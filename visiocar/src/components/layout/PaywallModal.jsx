import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import GlassButton from '../ui-custom/GlassButton';

export default function PaywallModal({ isOpen, daysRemaining, onClose }) {
  if (!isOpen) return null;

  const isExpired = daysRemaining <= 0;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#151921] to-[#0B0E14] border border-white/10 overflow-hidden"
        >
          {/* Glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#007AFF]/20 rounded-full blur-3xl" />
          
          <div className="relative p-8 text-center">
            {/* Icon */}
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 ${
              isExpired ? 'bg-[#FF3B30]/20' : 'bg-[#FF9F0A]/20'
            }`}>
              {isExpired ? (
                <AlertCircle className="w-8 h-8 text-[#FF3B30]" />
              ) : (
                <Zap className="w-8 h-8 text-[#FF9F0A]" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-3">
              {isExpired 
                ? "Votre période d'essai est terminée" 
                : `Plus que ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} d'essai`
              }
            </h2>

            {/* Description */}
            <p className="text-white/60 mb-8 max-w-sm mx-auto">
              {isExpired 
                ? "Pour continuer à créer et gérer vos dossiers d'expertise, choisissez un abonnement adapté à vos besoins."
                : "Profitez de toutes les fonctionnalités avant la fin de votre essai gratuit."
              }
            </p>

            {/* Features */}
            <div className="bg-white/[0.03] rounded-2xl p-4 mb-8 text-left space-y-3">
              {[
                "Analyse automatique des dommages en quelques secondes",
                "Génération automatique de rapports PDF",
                "Historique illimité de vos dossiers"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#34C759] shrink-0" />
                  <span className="text-sm text-white/80">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link to={createPageUrl('Pricing')}>
              <GlassButton size="lg" className="w-full">
                Voir les offres
                <ArrowRight className="w-5 h-5" />
              </GlassButton>
            </Link>

            {/* Secondary action */}
            {!isExpired && onClose && (
              <button
                onClick={onClose}
                className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Continuer l'essai
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}