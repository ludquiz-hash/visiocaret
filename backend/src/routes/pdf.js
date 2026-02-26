import express from 'express';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Generate PDF for claim
router.post('/:id', requireAuth, async (req, res) => {
  try {
    // Get claim data
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    // Get garage info
    const { data: garage } = await supabase
      .from('garages')
      .select('*')
      .eq('owner_id', req.user.id)
      .single();

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    // Create PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 122, 255); // #007AFF
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('RAPPORT D\'EXPERTISE', 105, 25, { align: 'center' });
    
    // Garage info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    let yPos = 50;
    
    if (garage) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(garage.name || 'Garage', 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 8;
      
      if (garage.company_name) {
        doc.text(garage.company_name, 20, yPos);
        yPos += 6;
      }
      if (garage.company_address) {
        doc.text(garage.company_address, 20, yPos);
        yPos += 6;
      }
      if (garage.company_phone) {
        doc.text(`Tél: ${garage.company_phone}`, 20, yPos);
        yPos += 6;
      }
      if (garage.company_email) {
        doc.text(`Email: ${garage.company_email}`, 20, yPos);
        yPos += 6;
      }
    }

    // Expert info
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Expert:', 20, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 6;
    doc.text(profile?.full_name || profile?.email || 'Expert', 20, yPos);
    yPos += 10;

    // Claim info box
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, 170, 35, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`N° Dossier: ${claim.claim_number || claim.id}`, 25, yPos + 10);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${new Date(claim.created_at).toLocaleDateString('fr-FR')}`, 25, yPos + 20);
    doc.text(`Statut: ${claim.status === 'completed' ? 'Terminé' : 'En cours'}`, 25, yPos + 30);
    
    yPos += 45;

    // Client section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 122, 255);
    doc.text('INFORMATIONS CLIENT', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    const clientData = [
      ['Nom', claim.client_name || 'N/A'],
      ['Email', claim.client_email || 'N/A'],
      ['Téléphone', claim.client_phone || 'N/A'],
      ['Adresse', claim.client_address || 'N/A'],
    ];

    doc.autoTable({
      startY: yPos,
      head: [['Champ', 'Valeur']],
      body: clientData,
      theme: 'grid',
      headStyles: { fillColor: [0, 122, 255], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Vehicle section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 122, 255);
    doc.text('INFORMATIONS VÉHICULE', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    const vehicleData = [
      ['Marque', claim.vehicle_brand || 'N/A'],
      ['Modèle', claim.vehicle_model || 'N/A'],
      ['Année', claim.vehicle_year || 'N/A'],
      ['Immatriculation', claim.vehicle_license_plate || 'N/A'],
      ['N° VIN', claim.vehicle_vin || 'N/A'],
    ];

    doc.autoTable({
      startY: yPos,
      head: [['Champ', 'Valeur']],
      body: vehicleData,
      theme: 'grid',
      headStyles: { fillColor: [0, 122, 255], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Insurance section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 122, 255);
    doc.text('INFORMATIONS ASSURANCE', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    const insuranceData = [
      ['Compagnie', claim.insurance_company || 'N/A'],
      ['N° Police', claim.insurance_policy_number || 'N/A'],
      ['N° Sinistre', claim.claim_number || 'N/A'],
    ];

    doc.autoTable({
      startY: yPos,
      head: [['Champ', 'Valeur']],
      body: insuranceData,
      theme: 'grid',
      headStyles: { fillColor: [0, 122, 255], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    // New page for damage analysis
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 122, 255);
    doc.text('ANALYSE DES DOMMAGES', 20, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    if (claim.damage_description) {
      doc.setFontSize(11);
      doc.text('Description des dommages:', 20, yPos);
      yPos += 8;
      
      const splitDescription = doc.splitTextToSize(claim.damage_description, 170);
      doc.text(splitDescription, 20, yPos);
      yPos += splitDescription.length * 6 + 10;
    }

    if (claim.damage_areas && claim.damage_areas.length > 0) {
      doc.text('Zones endommagées:', 20, yPos);
      yPos += 8;
      
      claim.damage_areas.forEach((area, index) => {
        doc.text(`• ${area}`, 25, yPos);
        yPos += 6;
      });
      yPos += 10;
    }

    if (claim.estimated_repair_cost) {
      doc.setFillColor(255, 159, 10); // Orange
      doc.rect(20, yPos, 170, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('ESTIMATION RÉPARATION:', 25, yPos + 12);
      doc.text(`${claim.estimated_repair_cost} €`, 160, yPos + 12, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 35;
    }

    // Expert notes
    if (claim.expert_notes) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 122, 255);
      doc.text('NOTES DE L\'EXPERT', 20, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 10;
      
      const splitNotes = doc.splitTextToSize(claim.expert_notes, 170);
      doc.setFontSize(11);
      doc.text(splitNotes, 20, yPos);
      yPos += splitNotes.length * 6 + 15;
    }

    if (claim.repair_recommendations) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 122, 255);
      doc.text('RECOMMANDATIONS', 20, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 10;
      
      const splitRecs = doc.splitTextToSize(claim.repair_recommendations, 170);
      doc.setFontSize(11);
      doc.text(splitRecs, 20, yPos);
    }

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(`VisioCar - Page ${i} / ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 290);
    }

    // Update claim status to completed
    await supabase
      .from('claims')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-${claim.claim_number || claim.id}.pdf"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
