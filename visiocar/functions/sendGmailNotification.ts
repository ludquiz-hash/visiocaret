import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { claimId, recipientEmail, recipientName, status, pdfUrl, errorMessage } = await req.json();

    if (!claimId || !recipientEmail || !status) {
      return Response.json({ 
        error: 'Paramètres manquants',
        details: 'claimId, recipientEmail et status sont requis'
      }, { status: 400 });
    }

    // Get claim and garage data
    const claims = await base44.entities.Claim.filter({ id: claimId });
    if (!claims?.length) {
      return Response.json({ error: 'Dossier introuvable' }, { status: 404 });
    }
    const claim = claims[0];

    const garages = await base44.entities.Garage.filter({ id: claim.garage_id });
    const garage = garages[0];

    // Get Gmail access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("gmail");

    // Build email content based on status
    let subject, body;
    
    if (status === 'success') {
      subject = `✅ Rapport de sinistre prêt - ${claim.reference || claim.id}`;
      body = `Bonjour ${recipientName || ''},

Votre rapport de sinistre pour le véhicule ${claim.vehicle_data?.brand || ''} ${claim.vehicle_data?.model || ''} est maintenant disponible.

📋 Référence: ${claim.reference || claim.id}
🚗 Véhicule: ${claim.vehicle_data?.brand || ''} ${claim.vehicle_data?.model || ''} (${claim.vehicle_data?.plate || ''})
📄 Rapport PDF: ${pdfUrl || 'Disponible dans votre espace client'}

${garage?.name ? `\nCordialement,\nL'équipe ${garage.name}` : '\nCordialement'}
${garage?.company_email ? `\nContact: ${garage.company_email}` : ''}`;
    } else if (status === 'error') {
      subject = `❌ Erreur génération rapport - ${claim.reference || claim.id}`;
      body = `Bonjour ${recipientName || ''},

Une erreur est survenue lors de la génération de votre rapport de sinistre.

📋 Référence: ${claim.reference || claim.id}
🚗 Véhicule: ${claim.vehicle_data?.brand || ''} ${claim.vehicle_data?.model || ''} (${claim.vehicle_data?.plate || ''})
⚠️ Erreur: ${errorMessage || 'Erreur inconnue'}

Nous travaillons à résoudre ce problème. Vous serez notifié dès que le rapport sera disponible.

${garage?.name ? `\nCordialement,\nL'équipe ${garage.name}` : '\nCordialement'}
${garage?.company_email ? `\nContact: ${garage.company_email}` : ''}`;
    } else {
      subject = `📋 Mise à jour rapport - ${claim.reference || claim.id}`;
      body = `Bonjour ${recipientName || ''},

Votre rapport de sinistre est en cours de traitement.

📋 Référence: ${claim.reference || claim.id}
🚗 Véhicule: ${claim.vehicle_data?.brand || ''} ${claim.vehicle_data?.model || ''} (${claim.vehicle_data?.plate || ''})

${garage?.name ? `\nCordialement,\nL'équipe ${garage.name}` : '\nCordialement'}`;
    }

    // Create Gmail message in RFC 2822 format
    const messageParts = [
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ];
    const message = messageParts.join('\n');
    
    // Encode in base64url format
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!gmailResponse.ok) {
      const error = await gmailResponse.json();
      throw new Error(`Gmail API error: ${error.error?.message || gmailResponse.statusText}`);
    }

    const result = await gmailResponse.json();

    // Log the email
    await base44.entities.EmailLog.create({
      claim_id: claimId,
      to: recipientEmail,
      subject: subject,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    // Log history
    await base44.entities.ClaimHistory.create({
      claim_id: claimId,
      action: 'email_sent',
      description: `Email envoyé à ${recipientEmail} (${status})`,
      user_name: user.full_name,
      user_email: user.email,
      metadata: {
        recipient: recipientEmail,
        status: status,
        gmail_message_id: result.id
      }
    });

    return Response.json({
      success: true,
      message: 'Email envoyé via Gmail',
      gmail_message_id: result.id
    });

  } catch (error) {
    console.error('❌ [Gmail] Erreur:', error);
    return Response.json({
      error: 'Erreur lors de l\'envoi de l\'email',
      details: error.message
    }, { status: 500 });
  }
});