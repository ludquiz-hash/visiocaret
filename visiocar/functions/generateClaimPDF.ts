import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init?.headers as Record<string, string>) },
  });
}

Deno.serve(async (req) => {
  console.log('='.repeat(50));
  console.log('📄 [PDF] DÉBUT GÉNÉRATION PDF');
  console.log('='.repeat(50));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const base44 = createClientFromRequest(req);

  try {
    // ========== STEP 1: PARSE BODY ==========
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Body JSON invalide' }, 400);
    }
    const { claimId } = body;

    if (!claimId) {
      return json({ error: 'claimId requis' }, 400);
    }

    console.log('📄 [PDF] ClaimId:', claimId);

    // ========== STEP 2: AUTH ==========
    const user = await base44.auth.me();
    if (!user) {
      return json({ error: 'Non autorisé' }, 401);
    }

    // ========== STEP 3: ENV VAR (PDFShift uniquement – Base44 n'a pas BASE44_URL) ==========
    const pdfshiftKey = Deno.env.get('PDFSHIFT_API_KEY');

    if (!pdfshiftKey) {
      return json(
        {
          error: 'Variables manquantes',
          details: 'Ajoutez PDFSHIFT_API_KEY dans Base44 : Functions → generateClaimPDF → Secrets.',
        },
        500
      );
    }

    console.log('✅ [PDF] PDFSHIFT_API_KEY OK');

    // ========== STEP 4: RÉCUPÉRATION DU DOSSIER ET DU GARAGE (SDK Base44) ==========
    console.log('📄 [PDF] Récupération du dossier...');

    const claims = await base44.asServiceRole.entities.Claim.filter({ id: claimId });
    const claim = claims?.[0];

    if (!claim) {
      return json({ error: 'Dossier introuvable' }, 404);
    }

    const garages = await base44.asServiceRole.entities.Garage.filter({ id: claim.garage_id });
    const garage = garages?.[0] || {};

    // Vérifier que l'utilisateur est membre du garage
    if (user.email) {
      const memberships = await base44.asServiceRole.entities.GarageMember.filter({
        garage_id: claim.garage_id,
        user_email: user.email,
        is_active: true,
      });
      if (!memberships?.length) {
        return json({ error: 'Accès refusé', details: 'Vous n\'êtes pas autorisé à accéder à ce dossier.' }, 403);
      }
    }

    const reference = claim.reference || `VWC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
    console.log('✅ [PDF] Dossier récupéré:', reference);

    // ========== EXTRACTION DE TOUTES LES DONNÉES (modèle Base44) ==========
    const vehicleData = claim.vehicle_data || {};
    const clientData = claim.client_data || {};
    const sinistreData = claim.sinistre_data || {};
    const assuranceData = claim.insurance_details || claim.assurance_data || {};
    const garageDisplay = {
      name: garage?.company_name || garage?.name || 'Garage',
      address: garage?.company_address ? [garage.company_address.street, garage.company_address.zip, garage.company_address.city].filter(Boolean).join(', ') : '',
      phone: garage?.company_phone || garage?.phone,
      email: garage?.company_email || garage?.email,
    };

    // Récupérer les zones de l'analyse assistée (modèle Base44)
    const zones = claim.analysis_assistee?.zones || claim?.manual_adjustments?.adjusted_damages || [];

    // Récupérer les photos (Base44 utilise claim.images)
    const photos = claim.images || claim.photos || claim.ClaimPhoto || [];

    console.log('📊 [PDF] Données extraites:');
    console.log('  - Véhicule:', Object.keys(vehicleData).length, 'champs');
    console.log('  - Client:', Object.keys(clientData).length, 'champs');
    console.log('  - Zones:', zones.length);
    console.log('  - Photos:', photos.length);

    // Calculer le temps total (Base44: estimated_hours, tempsEstime, estimatedTime)
    const totalHours = zones.reduce((sum: number, zone: any) => {
      const time = Number(zone.estimatedTime) || Number(zone.estimated_time) || Number(zone.estimated_hours) || Number(zone.tempsEstime) || 0;
      return sum + time;
    }, 0);

    console.log('  - Temps total:', totalHours, 'heures');

    // ========== STEP 5: GÉNÉRATION HTML COMPLÈTE ==========
    console.log('📄 [PDF] Génération HTML...');

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport ${reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 4px solid #007AFF;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 28px;
      color: #007AFF;
      margin-bottom: 10px;
    }
    .header-info {
      font-size: 14px;
      color: #666;
      margin: 5px 0;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #007AFF;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .field {
      padding: 12px;
      background: #f8f9fa;
      border-left: 3px solid #007AFF;
      border-radius: 4px;
    }
    .field-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .field-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    thead {
      background: #007AFF;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px;
    }
    tbody tr:nth-child(even) {
      background: #f8f9fa;
    }
    .total-row {
      background: #e3f2fd !important;
      font-weight: bold;
      border-top: 2px solid #007AFF;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-importante { background: #fee; color: #c00; }
    .badge-moyenne { background: #fff3cd; color: #856404; }
    .badge-legere { background: #d1ecf1; color: #0c5460; }
    .operations {
      font-size: 12px;
      color: #555;
      line-height: 1.8;
      list-style-position: inside;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 20px;
    }
    .photo-item {
      text-align: center;
      page-break-inside: avoid;
    }
    .photo-item img {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }
    .photo-caption {
      margin-top: 8px;
      font-size: 11px;
      color: #666;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>

  <!-- EN-TÊTE -->
  <div class="header">
    <h1>RAPPORT D'EXPERTISE AUTOMOBILE</h1>
    <div class="header-info"><strong>${garageDisplay.name}</strong></div>
    ${garageDisplay.address ? `<div class="header-info">${garageDisplay.address}</div>` : ''}
    ${garageDisplay.phone ? `<div class="header-info">Tél: ${garageDisplay.phone}</div>` : ''}
    ${garageDisplay.email ? `<div class="header-info">Email: ${garageDisplay.email}</div>` : ''}
    <div class="header-info" style="margin-top: 15px;">
      <strong>Référence: ${reference}</strong><br>
      Date: ${new Date(claim.created_date || Date.now()).toLocaleDateString('fr-FR')}
    </div>
  </div>

  <!-- VÉHICULE -->
  <div class="section">
    <div class="section-title">🚗 VÉHICULE</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Marque</div>
        <div class="field-value">${vehicleData.brand || 'Non renseigné'}</div>
      </div>
      <div class="field">
        <div class="field-label">Modèle</div>
        <div class="field-value">${vehicleData.model || 'Non renseigné'}</div>
      </div>
      <div class="field">
        <div class="field-label">Immatriculation</div>
        <div class="field-value">${vehicleData.plate || 'Non renseigné'}</div>
      </div>
      <div class="field">
        <div class="field-label">Année</div>
        <div class="field-value">${vehicleData.year || 'Non renseigné'}</div>
      </div>
      <div class="field">
        <div class="field-label">Kilométrage</div>
        <div class="field-value">${vehicleData.mileage ? parseInt(vehicleData.mileage).toLocaleString('fr-FR') + ' km' : 'Non renseigné'}</div>
      </div>
      <div class="field">
        <div class="field-label">Couleur</div>
        <div class="field-value">${vehicleData.color || 'Non renseigné'}</div>
      </div>
      ${vehicleData.vin ? `
      <div class="field">
        <div class="field-label">N° de châssis (VIN)</div>
        <div class="field-value">${vehicleData.vin}</div>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- CLIENT -->
  <div class="section">
    <div class="section-title">👤 CLIENT</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Nom complet</div>
        <div class="field-value">${clientData.name || 'Non renseigné'}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${clientData.email || 'Non renseigné'}</div>
      </div>
      ${clientData.phone ? `
      <div class="field">
        <div class="field-label">Téléphone</div>
        <div class="field-value">${clientData.phone}</div>
      </div>
      ` : ''}
      ${clientData.address ? `
      <div class="field full-width">
        <div class="field-label">Adresse</div>
        <div class="field-value">${clientData.address}</div>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- ASSURANCE (Base44: insurance_details avec policy_number, claim_number, accident_date) -->
  ${assuranceData && (assuranceData.company || assuranceData.policy_number || assuranceData.policyNumber) ? `
  <div class="section">
    <div class="section-title">🛡️ ASSURANCE</div>
    <div class="grid">
      ${assuranceData.company ? `
      <div class="field">
        <div class="field-label">Compagnie</div>
        <div class="field-value">${assuranceData.company}</div>
      </div>
      ` : ''}
      ${(assuranceData.policy_number || assuranceData.policyNumber) ? `
      <div class="field">
        <div class="field-label">N° de police</div>
        <div class="field-value">${assuranceData.policy_number || assuranceData.policyNumber}</div>
      </div>
      ` : ''}
      ${(assuranceData.claim_number || assuranceData.claimNumber) ? `
      <div class="field">
        <div class="field-label">N° sinistre</div>
        <div class="field-value">${assuranceData.claim_number || assuranceData.claimNumber}</div>
      </div>
      ` : ''}
      ${(assuranceData.accident_date || assuranceData.claimDate) ? `
      <div class="field">
        <div class="field-label">Date du sinistre</div>
        <div class="field-value">${new Date(assuranceData.accident_date || assuranceData.claimDate).toLocaleDateString('fr-FR')}</div>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- SINISTRE -->
  ${sinistreData && sinistreData.description ? `
  <div class="section">
    <div class="section-title">⚠️ SINISTRE</div>
    <div class="field full-width">
      <div class="field-label">Description</div>
      <div class="field-value" style="white-space: pre-wrap;">${sinistreData.description}</div>
    </div>
    ${sinistreData.date ? `
    <div class="field" style="margin-top: 15px;">
      <div class="field-label">Date du sinistre</div>
      <div class="field-value">${new Date(sinistreData.date).toLocaleDateString('fr-FR')}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- DOMMAGES -->
  <div class="section">
    <div class="section-title">🔧 DOMMAGES IDENTIFIÉS (${zones.length})</div>
    ${zones.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Zone</th>
          <th>Gravité</th>
          <th>Type</th>
          <th>Opérations</th>
          <th style="text-align: right;">Temps</th>
        </tr>
      </thead>
      <tbody>
        ${zones.map((zone: any) => {
          const operations = zone.operations || [];
          const estimatedTime = Number(zone.estimatedTime) || Number(zone.estimated_time) || Number(zone.estimated_hours) || Number(zone.tempsEstime) || 0;
          const severity = (zone.severity || 'moyenne').toLowerCase();
          const severityClass = severity === 'importante' ? 'importante' : severity === 'legere' || severity === 'légère' ? 'legere' : 'moyenne';
          return `
          <tr>
            <td><strong>${zone.zone || 'Non spécifié'}</strong></td>
            <td>
              <span class="badge badge-${severityClass}">
                ${(zone.severity || 'Moyenne').toString().charAt(0).toUpperCase() + (zone.severity || 'moyenne').toString().slice(1)}
              </span>
            </td>
            <td>${zone.damageType || zone.damage_type || zone.description || 'Non spécifié'}</td>
            <td>
              ${operations.length > 0 ? `
                <ul class="operations">
                  ${operations.map((op: string) => `<li>${op}</li>`).join('')}
                </ul>
              ` : (zone.description || 'Non renseigné')}
            </td>
            <td style="text-align: right; font-weight: 600;">${estimatedTime}h</td>
          </tr>
          `;
        }).join('')}
        <tr class="total-row">
          <td colspan="4" style="text-align: right;"><strong>TEMPS TOTAL ESTIMÉ</strong></td>
          <td style="text-align: right;"><strong>${totalHours.toFixed(1)}h</strong></td>
        </tr>
      </tbody>
    </table>
    ` : `
    <div class="field">
      <div class="field-value" style="color: #666;">Aucun dommage enregistré</div>
    </div>
    `}
  </div>

  <!-- PHOTOS -->
  ${photos.length > 0 ? `
  <div class="section page-break">
    <div class="section-title">📷 PHOTOGRAPHIES DU VÉHICULE (${photos.length})</div>
    <div class="photos-grid">
      ${photos.map((photo: any, index: number) => {
        const photoUrl = photo.url || photo.path || photo.file_url || photo.photo_url;
        return `
        <div class="photo-item">
          <img src="${photoUrl || ''}" alt="Photo ${index + 1}" onerror="this.style.display='none'">
          <div class="photo-caption">Photo ${index + 1}${photo.description ? ` - ${photo.description}` : photo.position ? ` - ${photo.position}` : ''}</div>
        </div>
        `;
      }).join('')}
    </div>
  </div>
  ` : ''}

  <!-- FOOTER -->
  <div class="footer">
    <strong>${garageDisplay.name}</strong><br>
    Rapport d'expertise automobile - Analyse assistée des dommages<br>
    Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
      <em>Signature et cachet</em>
    </div>
  </div>

</body>
</html>
    `;

    console.log('✅ [PDF] HTML généré:', html.length, 'caractères');

    // ========== STEP 6: APPEL PDFSHIFT ==========
    console.log('📄 [PDF] Appel PDFShift...');

    const pdfResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa('api:' + pdfshiftKey)}`
      },
      body: JSON.stringify({
        source: html,
        format: 'A4',
        filename: `Rapport_${reference}_${new Date().toISOString().split('T')[0]}.pdf`
      })
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ [PDF] PDFShift error:', errorText);
      return new Response(
        JSON.stringify({ error: 'PDFShift error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    console.log('✅ [PDF] PDF généré:', pdfBytes.byteLength, 'bytes');

    // ========== STEP 7: UPLOAD VERS BASE44 (SDK Core.UploadFile) ==========
    console.log('📄 [PDF] Upload vers Base44...');

    const pdfFile = new File([pdfBytes], `Rapport_${reference}_${new Date().toISOString().split('T')[0]}.pdf`, { type: 'application/pdf' });
    const uploadResult: any = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfFile });
    const pdfUrl = uploadResult?.file_url || uploadResult?.url;

    if (!pdfUrl) {
      console.error('❌ [PDF] Pas d\'URL dans la réponse UploadFile:', uploadResult);
      return json({ error: 'Upload échoué', details: 'UploadFile n\'a pas retourné de file_url/url' }, 500);
    }

    console.log('✅ [PDF] PDF uploadé:', pdfUrl);

    // ========== STEP 8: MISE À JOUR DU DOSSIER (SDK Claim.update) ==========
    try {
      await base44.asServiceRole.entities.Claim.update(claimId, {
        pdf_url: pdfUrl,
        reference,
      });
      console.log('✅ [PDF] Claim mis à jour');
    } catch (e: any) {
      console.warn('⚠️ [PDF] Erreur update claim (non bloquant):', e?.message);
    }

    // ========== SUCCESS ==========
    console.log('='.repeat(50));
    console.log('✅ [PDF] SUCCÈS TOTAL');
    console.log('='.repeat(50));

    return json({
      success: true,
      pdf_url: pdfUrl,
      pdfUrl: pdfUrl,
      claimId: claimId,
      reference,
      stats: {
        zones: zones.length,
        photos: photos.length,
        totalHours: totalHours
      }
    });

  } catch (error: any) {
    console.error('='.repeat(50));
    console.error('❌ [PDF] ERREUR GLOBALE');
    console.error('❌', error?.message);
    console.error('❌', error?.stack);
    console.error('='.repeat(50));

    return json(
      { error: 'Erreur serveur', details: error?.message || String(error) },
      500
    );
  }
});
