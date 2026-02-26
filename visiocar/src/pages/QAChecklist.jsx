import React, { useState } from 'react';
import { CheckCircle2, XCircle, Circle, Play } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import { cn } from '@/lib/utils';

const qaTests = [
  {
    category: 'Authentification',
    tests: [
      { id: 'auth-1', name: 'Connexion avec email/mot de passe', status: 'pending' },
      { id: 'auth-2', name: 'Déconnexion fonctionne', status: 'pending' },
      { id: 'auth-3', name: 'Auto-création garage pour nouveaux users', status: 'pending' },
    ],
  },
  {
    category: 'Dashboard',
    tests: [
      { id: 'dash-1', name: 'Affichage des statistiques', status: 'pending' },
      { id: 'dash-2', name: 'Liste des dossiers récents', status: 'pending' },
      { id: 'dash-3', name: 'Actions rapides fonctionnelles', status: 'pending' },
    ],
  },
  {
    category: 'Wizard (Création dossier)',
    tests: [
      { id: 'wiz-1', name: 'Étape 1: Identification client/véhicule', status: 'pending' },
      { id: 'wiz-2', name: 'Étape 2: Upload photos avec compression', status: 'pending' },
      { id: 'wiz-3', name: 'Étape 3: Analyse automatique (assistée)', status: 'pending' },
      { id: 'wiz-4', name: 'Étape 4: Rédaction/ajustements', status: 'pending' },
      { id: 'wiz-5', name: 'Étape 5: Génération PDF', status: 'pending' },
    ],
  },
  {
    category: 'PDF Design',
    tests: [
      { id: 'pdf-1', name: 'Logo affiché si activé', status: 'pending' },
      { id: 'pdf-2', name: 'Référence dossier correcte (VWC-YYYY-XXXXXX)', status: 'pending' },
      { id: 'pdf-3', name: 'Données véhicule cohérentes', status: 'pending' },
      { id: 'pdf-4', name: 'Dommages correctement listés', status: 'pending' },
      { id: 'pdf-5', name: 'Photos affichées (max 6)', status: 'pending' },
      { id: 'pdf-6', name: 'Pagination correcte', status: 'pending' },
      { id: 'pdf-7', name: 'Design professionnel et lisible', status: 'pending' },
    ],
  },
  {
    category: 'Paramètres Garage',
    tests: [
      { id: 'set-1', name: 'Sauvegarder infos entreprise', status: 'pending' },
      { id: 'set-2', name: 'Upload logo fonctionnel', status: 'pending' },
      { id: 'set-3', name: 'Toggle "Afficher logo sur PDF" fonctionne', status: 'pending' },
      { id: 'set-4', name: 'Données persistent après refresh', status: 'pending' },
    ],
  },
  {
    category: 'Stripe & Abonnement',
    tests: [
      { id: 'str-1', name: 'Bouton Starter ouvre Checkout', status: 'pending' },
      { id: 'str-2', name: 'Bouton Business ouvre Checkout', status: 'pending' },
      { id: 'str-3', name: 'Webhook met à jour DB après paiement', status: 'pending' },
      { id: 'str-4', name: 'Status abonnement correct dans Billing', status: 'pending' },
      { id: 'str-5', name: 'Portail client Stripe accessible', status: 'pending' },
    ],
  },
  {
    category: 'Responsive & UX',
    tests: [
      { id: 'res-1', name: 'Mobile: sidebar devient bottom nav', status: 'pending' },
      { id: 'res-2', name: 'Mobile: wizard utilisable', status: 'pending' },
      { id: 'res-3', name: 'Tablette: layout correct', status: 'pending' },
      { id: 'res-4', name: 'Aucun débordement horizontal', status: 'pending' },
      { id: 'res-5', name: 'Tous les textes en français correct', status: 'pending' },
    ],
  },
];

export default function QAChecklist() {
  const [tests, setTests] = useState(qaTests);

  const updateTestStatus = (categoryIndex, testIndex, status) => {
    const newTests = [...tests];
    newTests[categoryIndex].tests[testIndex].status = status;
    setTests(newTests);
  };

  const runAllTests = () => {
    // Simulate running tests
    alert('Fonctionnalité à implémenter: lancer tous les tests automatiques');
  };

  const getStats = () => {
    const allTests = tests.flatMap((cat) => cat.tests);
    return {
      total: allTests.length,
      passed: allTests.filter((t) => t.status === 'passed').length,
      failed: allTests.filter((t) => t.status === 'failed').length,
      pending: allTests.filter((t) => t.status === 'pending').length,
    };
  };

  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">QA Checklist</h1>
          <p className="text-sm text-white/50">
            Tests de qualité et validation fonctionnelle
          </p>
        </div>
        <GlassButton variant="primary" icon={Play} onClick={runAllTests}>
          Lancer tous les tests
        </GlassButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-white/50">Total</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-[#34C759]">{stats.passed}</div>
          <div className="text-sm text-white/50">Réussis</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-[#FF3B30]">{stats.failed}</div>
          <div className="text-sm text-white/50">Échoués</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-2xl font-bold text-white/50">{stats.pending}</div>
          <div className="text-sm text-white/50">En attente</div>
        </GlassCard>
      </div>

      {/* Test Categories */}
      {tests.map((category, catIndex) => (
        <GlassCard key={category.category} className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {category.category}
          </h2>

          <div className="space-y-2">
            {category.tests.map((test, testIndex) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {test.status === 'passed' && (
                    <CheckCircle2 className="w-5 h-5 text-[#34C759]" />
                  )}
                  {test.status === 'failed' && (
                    <XCircle className="w-5 h-5 text-[#FF3B30]" />
                  )}
                  {test.status === 'pending' && (
                    <Circle className="w-5 h-5 text-white/30" />
                  )}
                  <span className="text-sm text-white/80">{test.name}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateTestStatus(catIndex, testIndex, 'passed')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      test.status === 'passed'
                        ? 'bg-[#34C759]/20 text-[#34C759]'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                    )}
                  >
                    ✓ Passé
                  </button>
                  <button
                    onClick={() => updateTestStatus(catIndex, testIndex, 'failed')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      test.status === 'failed'
                        ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                    )}
                  >
                    ✗ Échoué
                  </button>
                  <button
                    onClick={() => updateTestStatus(catIndex, testIndex, 'pending')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      test.status === 'pending'
                        ? 'bg-white/[0.08] text-white/70'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
                    )}
                  >
                    ⟳ Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}