import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Car, Shield } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';

export default function Privacy() {
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
          <div className="p-3 rounded-xl bg-[#007AFF]/10">
            <Shield className="w-6 h-6 text-[#007AFF]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Politique de confidentialité</h1>
            <p className="text-white/50">Dernière mise à jour : Janvier 2024</p>
          </div>
        </div>

        <GlassCard className="p-8">
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-white/70 leading-relaxed">
                VisiWebCar SRL ("nous", "notre", "nos") s'engage à protéger la vie privée de ses utilisateurs. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. Données collectées</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                Nous collectons les types de données suivants :
              </p>
              <ul className="list-disc pl-5 text-white/70 space-y-2">
                <li>Informations d'identification (nom, email, téléphone)</li>
                <li>Informations professionnelles (nom du garage, adresse)</li>
                <li>Données des véhicules (marque, modèle, immatriculation, VIN)</li>
                <li>Photos des dommages pour analyse</li>
                <li>Données de paiement (traitées par Stripe)</li>
                <li>Données de connexion et d'utilisation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. Utilisation des données</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                Vos données sont utilisées pour :
              </p>
              <ul className="list-disc pl-5 text-white/70 space-y-2">
                <li>Fournir nos services d'analyse et de génération de rapports</li>
                <li>Améliorer notre algorithme d'IA</li>
                <li>Gérer votre compte et votre abonnement</li>
                <li>Vous contacter concernant votre utilisation du service</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. Base légale</h2>
              <p className="text-white/70 leading-relaxed">
                Le traitement de vos données est fondé sur : l'exécution du contrat de service, 
                votre consentement explicite, nos intérêts légitimes, et nos obligations légales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Stockage et sécurité</h2>
              <p className="text-white/70 leading-relaxed">
                Vos données sont stockées de manière sécurisée sur des serveurs situés dans l'Union Européenne. 
                Nous utilisons le chiffrement AES-256 pour les données au repos et TLS 1.3 pour les données en transit. 
                Les accès sont strictement contrôlés et journalisés.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. Durée de conservation</h2>
              <p className="text-white/70 leading-relaxed">
                Vos données sont conservées pendant la durée de votre abonnement plus 3 ans pour les obligations légales. 
                Les photos sont supprimées 12 mois après la création du dossier, sauf demande contraire.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">7. Vos droits</h2>
              <p className="text-white/70 leading-relaxed mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-5 text-white/70 space-y-2">
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit à la portabilité</li>
                <li>Droit d'opposition</li>
              </ul>
              <p className="text-white/70 leading-relaxed mt-4">
                Pour exercer ces droits, contactez-nous à : privacy@visiwebcar.fr
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">8. Cookies</h2>
              <p className="text-white/70 leading-relaxed">
                Nous utilisons des cookies essentiels au fonctionnement du service et des cookies analytiques 
                pour améliorer notre service. Vous pouvez gérer vos préférences de cookies à tout moment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Contact</h2>
              <p className="text-white/70 leading-relaxed">
                Pour toute question concernant cette politique :<br />
                Email : privacy@visiwebcar.fr<br />
                Adresse : VisiWebCar SRL, Rue de la Carrosserie 1, 1000 Bruxelles, Belgique
              </p>
            </section>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}