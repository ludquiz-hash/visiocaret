import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, FileText } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0B0E14] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Link 
          to={createPageUrl('Landing')}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-[#34C759]/10">
            <FileText className="w-6 h-6 text-[#34C759]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Conditions Générales de Vente</h1>
            <p className="text-white/50">Dernière mise à jour : Janvier 2024</p>
          </div>
        </div>

        <GlassCard className="p-8">
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 1 - Objet</h2>
              <p className="text-white/70 leading-relaxed">
                Les présentes Conditions Générales de Vente (CGV) régissent les relations entre VisiWebCar SRL 
                et tout utilisateur professionnel du service VisiWebCar, plateforme SaaS d'aide à l'expertise carrosserie.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 2 - Services</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                VisiWebCar propose les services suivants :
              </p>
              <ul className="list-disc pl-5 text-white/70 space-y-2">
                <li>Analyse automatisée de photos de véhicules endommagés par intelligence artificielle</li>
                <li>Estimation des temps de réparation et des pièces concernées</li>
                <li>Génération de rapports d'expertise au format PDF</li>
                <li>Gestion des dossiers clients et historique</li>
                <li>Collaboration entre membres d'une même équipe</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 3 - Tarifs et abonnements</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                Deux formules d'abonnement sont proposées :
              </p>
              <ul className="list-disc pl-5 text-white/70 space-y-2">
                <li><strong>Plan Starter</strong> : 69€ HT/mois - 15 dossiers par mois maximum</li>
                <li><strong>Plan Business</strong> : 199€ HT/mois - dossiers illimités, logo personnalisé</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-4">
                TVA applicable selon le pays de facturation (21% Belgique, selon canton en Suisse).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 4 - Période d'essai</h2>
              <p className="text-white/70 leading-relaxed">
                Une période d'essai gratuite de 5 jours est offerte à tout nouvel utilisateur. 
                Pendant cette période, l'ensemble des fonctionnalités du Plan Business est accessible. 
                À l'issue de la période d'essai, l'utilisateur doit souscrire un abonnement pour continuer à utiliser le service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 5 - Paiement</h2>
              <p className="text-white/70 leading-relaxed">
                Le paiement s'effectue par carte bancaire via notre partenaire Stripe. 
                L'abonnement est mensuel et renouvelé automatiquement. 
                Les factures sont disponibles dans l'espace client.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 6 - Résiliation</h2>
              <p className="text-white/70 leading-relaxed">
                L'utilisateur peut résilier son abonnement à tout moment depuis son espace client. 
                La résiliation prend effet à la fin de la période de facturation en cours. 
                Aucun remboursement prorata temporis n'est effectué.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 7 - Responsabilité</h2>
              <p className="text-white/70 leading-relaxed">
                VisiWebCar fournit un outil d'aide à l'expertise.  Les résultats de l’analyse automatique sont donnés à titre indicatif  
                et doivent être vérifiés par un professionnel. VisiWebCar ne peut être tenu responsable des décisions 
                prises sur la base des analyses fournies par le service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 8 - Propriété intellectuelle</h2>
              <p className="text-white/70 leading-relaxed">
                VisiWebCar conserve tous les droits de propriété intellectuelle sur le service, 
                ses algorithmes et son interface. L'utilisateur conserve la propriété de ses données et photos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Article 9 - Droit applicable</h2>
              <p className="text-white/70 leading-relaxed">
                Les présentes CGV sont soumises au droit belge. En cas de litige, les tribunaux de Bruxelles seront compétents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Article 10 - Contact</h2>
              <p className="text-white/70 leading-relaxed">
                VisiWebCar SRL<br />
                Rue de la Carrosserie 1<br />
                1000 Bruxelles, Belgique<br />
                Email : contact@visiwebcar.fr<br />
                TVA : BE 0xxx.xxx.xxx
              </p>
            </section>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}