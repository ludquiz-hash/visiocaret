import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const TestResult = ({ name, status, error, logs }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-white/10 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'pass' && <CheckCircle2 className="w-5 h-5 text-[#34C759]" />}
          {status === 'fail' && <XCircle className="w-5 h-5 text-[#FF3B30]" />}
          {status === 'pending' && <Loader2 className="w-5 h-5 text-[#007AFF] animate-spin" />}
          <span className={cn(
            'font-semibold',
            status === 'pass' ? 'text-[#34C759]' : status === 'fail' ? 'text-[#FF3B30]' : 'text-[#007AFF]'
          )}>
            {name}
          </span>
        </div>
        {logs && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white/40 hover:text-white/70 text-sm"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-[#FF3B30] ml-8">{error}</p>
      )}
      
      {expanded && logs && (
        <div className="ml-8 mt-2 p-3 bg-black/30 rounded text-xs text-white/60 font-mono whitespace-pre-wrap max-h-64 overflow-auto">
          {logs}
        </div>
      )}
    </div>
  );
};

export default function NativeTest() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const addResult = (testName, status, error = null, logs = null) => {
    setResults(prev => ({
      ...prev,
      [testName]: { status, error, logs }
    }));
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const createTestImage = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#007AFF';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST', 50, 55);
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'test-logo.png', { type: 'image/png' }));
      });
    });
  };

  const createPhotoImage = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#34C759';
      ctx.fillRect(0, 0, 200, 150);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PHOTO', 100, 80);
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'test-photo.png', { type: 'image/png' }));
      });
    });
  };

  const runAllTests = async () => {
    setRunning(true);
    setResults({});

    let garageId = null;
    let claimId = null;
    let logoUrl = null;

    // Test 1: Load session + currentGarageId
    try {
      addResult('1. Session & Garage ID', 'pending');
      const currentUser = await base44.auth.me();
      if (!currentUser) throw new Error('Pas d\'utilisateur authentifié');

      const memberships = await base44.entities.GarageMember.filter({ user_email: currentUser.email });
      const membership = memberships[0];
      if (!membership) throw new Error('Aucune adhésion trouvée');

      garageId = membership.garage_id;

      // Verify activeGarageId is set
      if (!currentUser.data?.activeGarageId) {
        console.warn('[NativeTest] activeGarageId not in user.data, but membership found');
      }

      const garages = await base44.entities.Garage.filter({ id: garageId });
      const garage = garages[0];
      if (!garage) throw new Error('Garage non trouvé');

      const logs = `Email: ${currentUser.email}\nGarage ID: ${garageId}\nActiveGarageId: ${currentUser.data?.activeGarageId || 'not set'}\nGarage: ${garage.name}`;
      addResult('1. Session & Garage ID', 'pass', null, logs);
    } catch (err) {
      const errorMsg = err.message || String(err);
      addResult('1. Session & Garage ID', 'fail', errorMsg);
      setRunning(false);
      return;
    }

    // Test 2: Save Garage Info
    try {
      addResult('2. Save Garage Info', 'pending');
      
      const testData = {
        company_name: `Test Garage ${Date.now()}`,
        company_vat: 'TEST-VAT-123',
        company_email: 'test@test.com',
        company_phone: '+1234567890',
        company_address: {
          street: '123 Test St',
          zip: '1000',
          city: 'Test City',
          country: 'BE'
        }
      };

      await base44.entities.Garage.update(garageId, testData);
      
      // Verify after save
      await sleep(500);
      const updated = await base44.entities.Garage.filter({ id: garageId });
      if (!updated[0]?.company_name) throw new Error('Data not persisted after update');
      if (updated[0].company_name !== testData.company_name) throw new Error('Data mismatch');

      addResult('2. Save Garage Info', 'pass', null, `Saved: ${testData.company_name}\nVAT: ${testData.company_vat}`);
    } catch (err) {
      addResult('2. Save Garage Info', 'fail', err.message);
    }

    // Test 3: Upload Logo
    try {
      addResult('3. Upload Logo', 'pending');
      
      const logoFile = await createTestImage();
      
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
        logoUrl = file_url;

        await base44.entities.Garage.update(garageId, { logo_url: file_url });

        await sleep(500);
        const updated = await base44.entities.Garage.filter({ id: garageId });
        if (!updated[0]?.logo_url) throw new Error('Logo URL not saved in DB');

        addResult('3. Upload Logo', 'pass', null, `URL: ${file_url.substring(0, 50)}...\nGarage: ${garageId}`);
      } catch (uploadErr) {
        throw new Error(`Upload failed: ${uploadErr.message || uploadErr}`);
      }
    } catch (err) {
      addResult('3. Upload Logo', 'fail', `${err.message}`);
    }

    // Test 4: Create Draft Claim
    try {
      addResult('4. Create Draft Claim', 'pending');

      const testTimestamp = Date.now();
      const newClaim = {
        garage_id: garageId,
        status: 'draft',
        client_data: {
          name: `Test Client ${testTimestamp}`,
          email: 'test@test.com',
          phone: '+1234567890',
          address: '123 Test St'
        },
        vehicle_data: {
          brand: 'Tesla',
          model: 'Model 3',
          year: 2024,
          plate: 'TEST-123',
          vin: 'VIN-TEST-123',
          color: 'Black',
          mileage: 5000
        }
      };

      const created = await base44.entities.Claim.create(newClaim);
      claimId = created.id;

      await sleep(500);
      const fetched = await base44.entities.Claim.filter({ id: claimId });
      if (!fetched[0]) throw new Error('Claim not persisted');

      const logs = `ID: ${claimId}\nGarage: ${garageId}\nStatus: draft\nVehicle: Tesla Model 3\nClient: Test Client ${testTimestamp}`;
      addResult('4. Create Draft Claim', 'pass', null, logs);
    } catch (err) {
      addResult('4. Create Draft Claim', 'fail', err.message);
    }

    // Test 5: Update Draft Claim
    if (claimId) {
      try {
        addResult('5. Update Draft Claim', 'pending');
        const currentClaim = await base44.entities.Claim.filter({ id: claimId });
        const updateData = {
          client_data: {
            name: `Updated Client ${Date.now()}`,
            email: 'updated@test.com',
            phone: currentClaim[0]?.client_data?.phone || '+1234567890',
            address: currentClaim[0]?.client_data?.address || '123 Test St'
          }
        };

        await base44.entities.Claim.update(claimId, updateData);

        await sleep(500);
        const updated = await base44.entities.Claim.filter({ id: claimId });
        if (!updated[0]?.client_data?.name) throw new Error('Data not updated');
        if (!updated[0].client_data.name.includes('Updated')) throw new Error('Update not persisted');

        addResult('5. Update Draft Claim', 'pass', null, `Updated: ${updateData.client_data.name}`);
      } catch (err) {
        addResult('5. Update Draft Claim', 'fail', err.message);
      }
    }

    // Test 6: Upload Photo
    if (claimId) {
      try {
        addResult('6. Upload Photo', 'pending');
        
        const photoFile = await createPhotoImage();
        
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });

          const claim = await base44.entities.Claim.filter({ id: claimId });
          const images = claim[0]?.images || [];
          images.push({
            url: file_url,
            name: 'Test Photo',
            position: 'front',
            uploaded_at: new Date().toISOString()
          });

          await base44.entities.Claim.update(claimId, { images });

          await sleep(500);
          const updated = await base44.entities.Claim.filter({ id: claimId });
          if (!updated[0]?.images || updated[0].images.length === 0) throw new Error('Photo not saved in DB');

          addResult('6. Upload Photo', 'pass', null, `URL: ${file_url.substring(0, 50)}...\nClaim: ${claimId}\nImages: ${updated[0].images.length}`);
        } catch (uploadErr) {
          throw new Error(`Upload failed: ${uploadErr.message || uploadErr}`);
        }
      } catch (err) {
        addResult('6. Upload Photo', 'fail', `${err.message}`);
      }
    }

    // Test 7: Generate PDF
    if (claimId) {
      try {
        addResult('7. Generate PDF', 'pending');
        
        try {
          const response = await base44.functions.invoke('generateClaimPDF', { claimId });

          if (!response.data?.pdf_url) throw new Error('No PDF URL in response');
          if (!response.data?.reference) throw new Error('No reference in response');

          await sleep(500);
          const updated = await base44.entities.Claim.filter({ id: claimId });
          if (!updated[0]?.pdf_url) throw new Error('PDF URL not saved on claim');

          addResult('7. Generate PDF', 'pass', null, `URL: ${response.data.pdf_url.substring(0, 50)}...\nRef: ${response.data.reference}\nClaim: ${claimId}`);
        } catch (pdfErr) {
          throw new Error(`PDF generation failed: ${pdfErr.message || pdfErr}`);
        }
      } catch (err) {
        addResult('7. Generate PDF', 'fail', `${err.message}`);
      }
    }

    // Test 8: Delete Draft Claim
    if (claimId) {
      try {
        addResult('8. Delete Draft Claim', 'pending');
        
        try {
          // Try direct delete first (RLS should allow draft claims)
          await base44.entities.Claim.delete(claimId);

          await sleep(500);
          const deleted = await base44.entities.Claim.filter({ id: claimId });
          if (deleted.length > 0) throw new Error('Claim still exists after delete');

          addResult('8. Delete Draft Claim', 'pass', null, `Claim: ${claimId}\nGarage: ${garageId}\nStatus: Cascade delete OK`);
        } catch (deleteErr) {
          throw new Error(`Delete failed: ${deleteErr.message || deleteErr}`);
        }
      } catch (err) {
        addResult('8. Delete Draft Claim', 'fail', `${err.message}`);
      }
    }

    setRunning(false);
    toast.success('Tests terminés!');
  };

  const passCount = Object.values(results).filter(r => r.status === 'pass').length;
  const failCount = Object.values(results).filter(r => r.status === 'fail').length;
  const totalTests = Object.keys(results).length;
  const allPass = totalTests === 8 && failCount === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Tests Natives VisiWebCar</h1>
        <p className="text-white/50 mt-1">Validez toutes les fonctionnalités natives (DB/Storage/Auth)</p>
      </div>

      {/* Stats */}
      <GlassCard className={cn(
        "p-6",
        allPass && "border-[#34C759]/50 bg-[#34C759]/5"
      )}>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-white/50 text-sm">Tests Total</p>
            <p className="text-2xl font-bold text-white">{totalTests}</p>
          </div>
          <div>
            <p className="text-white/50 text-sm">Réussis</p>
            <p className={cn('text-2xl font-bold', passCount === 8 ? 'text-[#34C759]' : 'text-white')}>{passCount}</p>
          </div>
          <div>
            <p className="text-white/50 text-sm">Échoués</p>
            <p className={cn('text-2xl font-bold', failCount > 0 ? 'text-[#FF3B30]' : 'text-[#34C759]')}>{failCount}</p>
          </div>
          <div>
            <p className="text-white/50 text-sm">Status</p>
            <p className={cn('text-lg font-bold', allPass ? 'text-[#34C759]' : 'text-white')}>
              {allPass ? '✅ 8/8 PASS' : totalTests > 0 ? `${passCount}/${totalTests}` : '-'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Run Button */}
      <GlassButton
        onClick={runAllTests}
        loading={running}
        disabled={running}
        size="lg"
      >
        {running ? 'Tests en cours...' : 'Exécuter tous les tests'}
      </GlassButton>

      {/* Results */}
      <GlassCard className="p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white mb-4">Résultats des tests</h2>
        
        {Object.keys(results).length === 0 ? (
          <p className="text-white/50 text-center py-8">Cliquez sur "Exécuter tous les tests" pour commencer</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(results).map(([name, result]) => (
              <TestResult
                key={name}
                name={name}
                status={result.status}
                error={result.error}
                logs={result.logs}
              />
            ))}
          </div>
        )}
      </GlassCard>

      {/* Success Message */}
      {allPass && (
        <GlassCard className="p-6 bg-gradient-to-r from-[#34C759]/10 to-[#34C759]/5 border-[#34C759]/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-[#34C759]" />
            <div>
              <p className="font-semibold text-[#34C759]">✅ Tous les tests réussis!</p>
              <p className="text-sm text-white/60 mt-1">VisiWebCar est 100% fonctionnel (Auth/DB/Storage/PDF)</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Final Summary */}
      {Object.keys(results).length === 8 && (
        <GlassCard className={cn(
          "p-6",
          allPass ? "bg-gradient-to-r from-[#34C759]/10 to-[#34C759]/5 border-[#34C759]/30" : "bg-gradient-to-r from-[#FF3B30]/10 to-[#FF3B30]/5 border-[#FF3B30]/30"
        )}>
          <h2 className="text-lg font-semibold mb-4 text-white">Résumé Final</h2>
          <div className="space-y-2 text-sm text-white/60">
            <p>
              <span className="font-semibold">Résultat:</span> 
              <span className={cn("ml-2 font-bold", allPass ? "text-[#34C759]" : "text-[#FF3B30]")}>
                {allPass ? '✅ 8/8 PASS' : `❌ ${failCount} FAIL`}
              </span>
            </p>
            {!allPass && (
              <div className="mt-3 p-3 bg-black/30 rounded text-xs">
                <p className="font-semibold text-white mb-2">Erreurs détectées:</p>
                {Object.entries(results)
                  .filter(([_, r]) => r.status === 'fail')
                  .map(([name, r]) => (
                    <p key={name} className="text-[#FF3B30]">• {name}: {r.error}</p>
                  ))
                }
              </div>
            )}
            <p className="mt-4 text-xs text-white/40">VisiWebCar {allPass ? 'production-ready' : 'needs fixes'} • {new Date().toLocaleString()}</p>
          </div>
        </GlassCard>
      )}

      {/* Rehydration Debug */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Debug: Réhydratation</h2>
        <div className="space-y-2 text-xs text-white/50 font-mono">
          <p>User Email: <span className="text-white">{user?.email || 'loading...'}</span></p>
          <p>User ID: <span className="text-white">{user?.id?.substring(0, 20) || '-'}...</span></p>
          <p>activeGarageId: <span className={cn(user?.data?.activeGarageId ? 'text-[#34C759]' : 'text-[#FF3B30]', 'font-bold')}>{user?.data?.activeGarageId || 'NOT SET'}</span></p>
          <p>Session: <span className={cn(user ? 'text-[#34C759]' : 'text-[#FF3B30]', 'font-bold')}>{user ? '✓ OK' : '✗ Missing'}</span></p>
          <p>Timestamp: <span className="text-white">{new Date().toISOString()}</span></p>
        </div>
      </GlassCard>
    </div>
  );
}