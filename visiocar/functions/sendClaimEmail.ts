import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers || {}),
    },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function looksLikeOutsideAppEmailRestriction(err: any) {
  const msg = String(err?.message || err?.details || err || '');
  return msg.toLowerCase().includes('cannot send emails to users outside the app');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Non autorisé' }, { status: 401 });

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const claimId = body?.claimId;
    const recipientEmail = body?.recipientEmail;
    const recipientName = body?.recipientName;

    if (!claimId || !recipientEmail) {
      return json({ error: 'claimId et recipientEmail requis' }, { status: 400 });
    }

    if (!isValidEmail(String(recipientEmail))) {
      return json({ error: 'Email invalide', details: String(recipientEmail) }, { status: 400 });
    }

    const claims = await base44.asServiceRole.entities.Claim.filter({ id: claimId });
    const claim = claims?.[0];
    if (!claim) return json({ error: 'Dossier introuvable' }, { status: 404 });

    const garages = await base44.asServiceRole.entities.Garage.filter({ id: claim.garage_id });
    const garage = garages?.[0];

    // Vérifier que l'utilisateur est bien membre du garage du dossier (sécurité)
    if (!user.email) {
      return json(
        {
          error: 'Accès refusé',
          details: "Aucune adresse email trouvée pour l'utilisateur connecté.",
        },
        { status: 403 },
      );
    }

    const memberships = await base44.asServiceRole.entities.GarageMember.filter({
      garage_id: claim.garage_id,
      user_email: user.email,
      is_active: true,
    });

    if (!memberships?.length) {
      return json(
        {
          error: 'Accès refusé',
          details: "Vous n'êtes pas autorisé à envoyer un email pour ce dossier (garage différent).",
        },
        { status: 403 },
      );
    }

    // Assurer un PDF
    let pdfUrl = claim.pdf_url;
    if (!pdfUrl) {
      const pdfRes = await base44.asServiceRole.functions.invoke('generateClaimPDF', { claimId });
      if (pdfRes?.data?.error) {
        return json(
          {
            error: 'Impossible de générer le PDF',
            details: pdfRes.data.details ? `${pdfRes.data.error}: ${pdfRes.data.details}` : String(pdfRes.data.error),
          },
          { status: 500 },
        );
      }
      pdfUrl = pdfRes?.data?.pdf_url;
      if (!pdfUrl) {
        return json(
          { error: 'Impossible de générer le PDF', details: "generateClaimPDF n'a pas retourné pdf_url" },
          { status: 500 },
        );
      }
    }

    const reference = claim.reference || claim.id;
    const subject = `Rapport d'expertise - Réf: ${reference}`;

    const textBody = `
Bonjour${recipientName ? ' ' + recipientName : ''},

Veuillez trouver ci-dessous le lien vers votre rapport d'expertise automobile.

📋 Référence : ${reference}
🚗 Véhicule : ${claim.vehicle_data?.brand || ''} ${claim.vehicle_data?.model || ''} (${claim.vehicle_data?.plate || ''})
📄 Rapport PDF : ${pdfUrl}

Si le lien ne fonctionne pas, vous pouvez également vous connecter à votre espace client pour télécharger le rapport.

Cordialement,
${garage?.company_name || garage?.name || 'VisiWebCar'}
    `.trim();

    // Envoi simple via Core.SendEmail (sans Gmail)
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: garage?.company_name || garage?.name || 'VisiWebCar',
        to: recipientEmail,
        subject,
        body: textBody,
      });
    } catch (e: any) {
      if (looksLikeOutsideAppEmailRestriction(e)) {
        return json(
          {
            error: 'Envoi email externe bloqué par Base44',
            details:
              "Votre app Base44 est configurée pour ne pas envoyer d'emails aux utilisateurs externes. Contactez le support Base44 pour autoriser l'envoi d'emails clients ou configurez un provider email adapté.",
          },
          { status: 500 },
        );
      }

      return json(
        {
          error: "Erreur lors de l'envoi de l'email",
          details: e?.message || String(e),
        },
        { status: 500 },
      );
    }

    // Logs (non bloquants)
    try {
      await base44.asServiceRole.entities.EmailLog.create({
        claim_id: claimId,
        to: recipientEmail,
        subject,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    try {
      await base44.asServiceRole.entities.ClaimHistory.create({
        claim_id: claimId,
        action: 'email_sent',
        description: `Email envoyé à ${recipientEmail}`,
        user_name: user?.full_name || 'Utilisateur',
        user_email: user?.email,
        metadata: {
          recipient: recipientEmail,
        },
      });
    } catch {
      // ignore
    }

    return json({
      success: true,
      message: 'Email envoyé (Core.SendEmail)',
    });
  } catch (err: any) {
    return json(
      {
        error: "Erreur lors de l'envoi de l'email",
        details: err?.message || String(err),
      },
      { status: 500 },
    );
  }
});

