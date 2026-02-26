import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Building2 } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';

export default function Legal() {
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
          <div className="p-3 rounded-xl bg-[#FF9F0A]/10">
            <Building2 className="w-6 h-6 text-[#FF9F0A]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Mentions légales</h1>
            <p className="text-white/50">Informations légales obligatoires</p>
          </div>
        </div>

        <GlassCard className="p-8">
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Éditeur du site</h2>
              <p className="text-white/70 leading-relaxed">
                <strong>VisiWebCar SRL</strong><br />
                Société à responsabilité limitée de droit belge<br />
                Capital social : 18.550 EUR<br />
                RCS Bruxelles : 0xxx.xxx.xxx<br />
                Numéro TVA : BE 0xxx.xxx.xxx
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Siège social</h2>
              <p className="text-white/70 leading-relaxed">
                Rue de la Carrosserie 1<br />
                1000 Bruxelles<br />
                Belgique
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
              <p className="text-white/70 leading-relaxed">
                Email : contact@visiwebcar.fr<br />
                Support : support@visiwebcar.fr<br />
                Téléphone : +32 2 xxx xx xx
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Directeur de la publication</h2>
              <p className="text-white/70 leading-relaxed">
                [Nom du gérant]<br />
                En qualité de Gérant de VisiWebCar SRL
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Hébergement</h2>
              <p className="text-white/70 leading-relaxed">
                Les données sont hébergées par :<br /><br />
                <strong>Base44 / Supabase</strong><br />
                Infrastructure cloud européenne<br />
                Données stockées dans l'Union Européenne
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Traitement des paiements</h2>
              <p className="text-white/70 leading-relaxed">
                Les paiements sont traités par :<br /><br />
                <strong>Stripe Payments Europe, Ltd.</strong><br />
                1 Grand Canal Street Lower, Grand Canal Dock<br />
                Dublin, D02 H210, Irlande
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Propriété intellectuelle</h2>
              <p className="text-white/70 leading-relaxed">
                L'ensemble des éléments constituant le site VisiWebCar (textes, graphismes, logiciels, photographies, 
                images, vidéos, sons, plans, noms, logos, marques, bases de données, etc.) ainsi que le site lui-même, 
                sont la propriété exclusive de VisiWebCar SRL ou de ses partenaires.
              </p>
              <p className="text-white/70 leading-relaxed mt-4">
                Ces éléments sont protégés par les lois relatives à la propriété intellectuelle et autres, 
                et notamment le droit d'auteur. Toute reproduction, représentation, utilisation ou adaptation, 
                sous quelque forme que ce soit, de tout ou partie de ces éléments est strictement interdite 
                sans l'accord préalable écrit de VisiWebCar SRL.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Protection des données personnelles</h2>
              <p className="text-white/70 leading-relaxed">
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi belge 
                relative à la protection de la vie privée, vous disposez d'un droit d'accès, de rectification, 
                de suppression et d'opposition aux données personnelles vous concernant.
              </p>
              <p className="text-white/70 leading-relaxed mt-4">
                <strong>Délégué à la protection des données (DPO)</strong><br />
                Email : privacy@visiwebcar.fr
              </p>
              <p className="text-white/70 leading-relaxed mt-4">
                Pour plus d'informations, consultez notre{' '}
                <Link to={createPageUrl('Privacy')} className="text-[#007AFF] hover:underline">
                  Politique de confidentialité
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Litiges</h2>
              <p className="text-white/70 leading-relaxed">
                En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. 
                En cas d'échec, les tribunaux de l'arrondissement judiciaire de Bruxelles seront seuls compétents.
              </p>
              <p className="text-white/70 leading-relaxed mt-4">
                <strong>Plateforme européenne de règlement des litiges en ligne</strong><br />
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#007AFF] hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </section>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}