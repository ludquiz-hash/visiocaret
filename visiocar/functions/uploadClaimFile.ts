import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const claimId = formData.get('claimId');
    const garageId = formData.get('garageId');
    const fileType = formData.get('fileType'); // 'logo', 'photo', 'pdf'

    if (!file || !claimId || !garageId || !fileType) {
      return Response.json({ error: 'Paramètres manquants: file, claimId, garageId, fileType requis' }, { status: 400 });
    }

    let uploadPath = '';
    
    if (fileType === 'logo') {
      uploadPath = `branding/${garageId}/logo.png`;
    } else if (fileType === 'photo') {
      const filename = `${Date.now()}-${file.name}`;
      uploadPath = `claims/${garageId}/${claimId}/${filename}`;
    } else if (fileType === 'pdf') {
      uploadPath = `pdf-reports/${garageId}/${claimId}.pdf`;
    } else {
      return Response.json({ error: 'fileType invalide: logo, photo ou pdf requis' }, { status: 400 });
    }

    console.log(`[uploadClaimFile] Uploading ${fileType} to: ${uploadPath}`);

    // Upload file to storage
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    console.log(`[uploadClaimFile] Upload successful. URL: ${file_url}`);

    return Response.json({
      success: true,
      file_url: file_url,
      path: uploadPath,
      fileType: fileType
    });

  } catch (error) {
    console.error('[uploadClaimFile] Error:', error);
    return Response.json(
      { 
        error: 'Erreur lors de l\'upload du fichier',
        details: error.message,
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
});