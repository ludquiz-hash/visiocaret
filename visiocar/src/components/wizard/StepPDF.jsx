import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import { 
  FileText, 
  Download, 
  Share2,
  Mail,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Printer,
  Copy
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function StepPDF({ data, claimId, onBack, onComplete }) {
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(data?.pdf_url || null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const getFunctionErrorMessage = (err, fallback = 'Erreur serveur') => {
    const data = err?.response?.data;
    if (data) {
      const error = data?.error || data?.message;
      const details = data?.details;
      if (error && details) return `${error}: ${details}`;
      if (error) return String(error);
      if (typeof data === 'string') return data;
    }
    return err?.message || String(err) || fallback;
  };

  const generatePDF = async () => {
    setGenerating(true);
    setError(null);

    try {
      console.log('📄 [PDF] Génération pour claim:', claimId);
      
      const response = await base44.functions.invoke('generateClaimPDF', {
        claimId
      });

      console.log('📄 [PDF] Réponse:', response);

      if (response?.data?.error) {
        throw new Error(response.data.error + (response.data.details ? `: ${response.data.details}` : ''));
      }

      if (!response?.data?.pdf_url && !response?.data?.success) {
        console.error('📄 [PDF] Réponse invalide:', response);
        throw new Error('Réponse invalide de la fonction PDF');
      }

      const pdfUrl = response.data.pdf_url;
      
      if (!pdfUrl) {
        throw new Error('URL PDF non retournée');
      }

      setPdfUrl(pdfUrl);
      
      // Update claim with PDF URL - include garage_id for RLS
      await base44.entities.Claim.update(claimId, {
        pdf_url: pdfUrl,
        status: 'completed',
        completed_at: new Date().toISOString(),
        garage_id: data?.garage_id // Preserve garage_id for RLS
      });

      // Log history
      const user = await base44.auth.me();
      await base44.entities.ClaimHistory.create({
        claim_id: claimId,
        action: 'pdf_generated',
        description: 'PDF généré avec succès',
        user_name: user?.full_name || 'Utilisateur',
        user_email: user?.email,
      });

      toast.success('PDF généré avec succès !');
      if (onComplete) onComplete(pdfUrl);
    } catch (err) {
      console.error('❌ [PDF] Erreur:', err);
      const errorMessage = getFunctionErrorMessage(err, 'Erreur lors de la génération du PDF');
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!pdfUrl && !generating) {
      generatePDF();
    }
  }, []);

  const copyLink = async () => {
    if (pdfUrl) {
      await navigator.clipboard.writeText(pdfUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendByEmail = async () => {
    if (!data?.client_data?.email) {
      toast.error('Aucune adresse email client');
      return;
    }

    try {
      console.log('📧 [EMAIL] Envoi à:', data.client_data.email);
      
      const response = await base44.functions.invoke('sendClaimEmail', {
        claimId,
        recipientEmail: data.client_data.email,
        recipientName: data.client_data?.name || undefined,
      });

      console.log('📧 [EMAIL] Réponse:', response);

      if (response?.data?.error) {
        throw new Error(response.data.error + (response.data.details ? `: ${response.data.details}` : ''));
      }

      if (!response?.data?.success) {
        console.error('📧 [EMAIL] Réponse invalide:', response);
        throw new Error(response?.data?.error || 'Erreur lors de l\'envoi de l\'email');
      }

      // Log history
      const user = await base44.auth.me();
      await base44.entities.ClaimHistory.create({
        claim_id: claimId,
        action: 'email_sent',
        description: `Email envoyé à ${data.client_data.email}`,
        user_name: user?.full_name || 'Utilisateur',
        user_email: user?.email,
      });

      toast.success('Email envoyé avec succès !');
    } catch (err) {
      console.error('❌ [EMAIL] Erreur:', err);
      const errorMessage = getFunctionErrorMessage(err, 'Erreur lors de l\'envoi de l\'email');
      toast.error(`Erreur: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Status */}
      {generating ? (
        <GlassCard className="p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-[#007AFF] animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Finalisation en cours
          </h3>
          <p className="text-white/50">
            Votre dossier est en cours de traitement...
          </p>
        </GlassCard>
      ) : error ? (
        <GlassCard className="p-8 text-center border-[#FF3B30]/20">
          <div className="w-16 h-16 rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#FF3B30]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Erreur
          </h3>
          <p className="text-white/50 mb-6">{error}</p>
          <GlassButton onClick={generatePDF} icon={null} className="">
            Réessayer
          </GlassButton>
        </GlassCard>
      ) : (
        <>
          {/* Success State */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-8 text-center bg-gradient-to-b from-[#34C759]/5 to-transparent border-[#34C759]/20">
              <div className="w-20 h-20 rounded-2xl bg-[#34C759]/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-[#34C759]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Dossier finalisé !
              </h3>
              <p className="text-white/50 mb-2">
                Le rapport d'expertise a été créé avec succès
              </p>
              <p className="text-sm text-white/30">
                {data.vehicle_data?.brand} {data.vehicle_data?.model} • {data.client_data?.name}
              </p>
            </GlassCard>
          </motion.div>

          {/* Summary Card */}
          <GlassCard className="p-6">
            <h3 className="font-semibold text-white mb-4">Récapitulatif</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <p className="text-xs text-white/40 mb-1">Véhicule</p>
                <p className="text-sm font-medium text-white">
                  {data.vehicle_data?.brand} {data.vehicle_data?.model}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <p className="text-xs text-white/40 mb-1">Client</p>
                <p className="text-sm font-medium text-white">
                  {data.client_data?.name || '-'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <p className="text-xs text-white/40 mb-1">Dommages</p>
                <p className="text-sm font-medium text-white">
                  {data.ai_report?.damages?.length || 0} détectés
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <p className="text-xs text-white/40 mb-1">Temps estimé</p>
                <p className="text-sm font-medium text-[#007AFF]">
                  {data.ai_report?.total_hours || data.manual_adjustments?.total_hours_adjusted || 0}h
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <GlassCard className="p-6">
            <h3 className="font-semibold text-white mb-4">Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pdfUrl && (
                <button
                  onClick={async () => {
                    try {
                      console.log('📥 [PDF] Téléchargement:', pdfUrl);
                      const response = await fetch(pdfUrl);
                      if (!response.ok) throw new Error('Erreur téléchargement PDF');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Rapport_${data?.reference || claimId || 'DOSSIER'}_${new Date().toISOString().split('T')[0]}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      toast.success('PDF téléchargé !');
                    } catch (err) {
                      console.error('❌ [PDF] Erreur téléchargement:', err);
                      toast.error('Erreur lors du téléchargement');
                    }
                  }}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/20 text-[#007AFF] hover:bg-[#007AFF]/20 transition-colors active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Télécharger PDF</span>
                </button>
              )}
              
              <button 
                onClick={sendByEmail}
                disabled={!data?.client_data?.email}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-xl border transition-colors active:scale-95",
                  data?.client_data?.email 
                    ? "bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08]"
                    : "bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed"
                )}
              >
                <Mail className="w-5 h-5" />
                <span className="font-medium">Envoyer par email</span>
              </button>

              {pdfUrl && (
                <button 
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08] transition-colors active:scale-95"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-[#34C759]" /> : <Copy className="w-5 h-5" />}
                  <span className="font-medium">{copied ? 'Copié !' : 'Copier le lien'}</span>
                </button>
              )}

              <Link 
                to={createPageUrl(`ClaimDetail?id=${claimId}`)}
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08] transition-colors active:scale-95"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="font-medium">Voir le dossier</span>
              </Link>
            </div>
          </GlassCard>

          {/* Navigation */}
          <div className="flex justify-between">
            <GlassButton variant="secondary" onClick={onBack} icon={null} className="">
              <ArrowLeft className="w-4 h-4" />
              Modifier
            </GlassButton>
            <Link to={createPageUrl('Claims')}>
              <GlassButton variant="success" icon={null} className="">
                <CheckCircle className="w-4 h-4" />
                Terminer
              </GlassButton>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}