import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui-custom/GlassCard';
import GlassButton from '@/components/ui-custom/GlassButton';
import {
  Upload,
  Image as ImageIcon,
  Camera,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_IMAGES = 6;
const MAX_SIZE_MB = 5;
const TARGET_WIDTH = 1600;
const JPEG_QUALITY = 0.75;

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > TARGET_WIDTH) {
          height = (height * TARGET_WIDTH) / width;
          width = TARGET_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                }),
              );
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          JPEG_QUALITY,
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function StepPhotos({ data, onNext, onBack }) {
  const [images, setImages] = useState(data?.images || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file) => {
    const compressedFile = await compressImage(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });
    return {
      url: file_url,
      name: file.name,
      position: `photo_${images.length + 1}`,
      uploaded_at: new Date().toISOString(),
    };
  };

  const handleFiles = async (files) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Seules les images sont acceptées');
        return false;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Le fichier ${file.name} dépasse ${MAX_SIZE_MB}MB`);
        return false;
      }
      return true;
    });

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      setError(
        `Maximum ${MAX_IMAGES} photos. ${validFiles.length - remainingSlots} fichier(s) ignoré(s).`,
      );
    }

    if (filesToUpload.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedImages = await Promise.all(filesToUpload.map(uploadFile));
      setImages((prev) => [...prev, ...uploadedImages]);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [images.length],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (images.length === 0) {
      setError('Veuillez ajouter au moins une photo');
      return;
    }
    onNext({ images });
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#007AFF]/10">
            <ImageIcon className="w-5 h-5 text-[#007AFF]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Photos du sinistre</h3>
            <p className="text-xs text-white/50">
              Ajoutez jusqu&apos;à {MAX_IMAGES} photos pour l&apos;analyse
            </p>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200',
            dragOver ? 'border-[#007AFF] bg-[#007AFF]/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || images.length >= MAX_IMAGES}
          />

          {uploading ? (
            <div className="py-8">
              <Loader2 className="w-12 h-12 text-[#007AFF] mx-auto mb-4 animate-spin" />
              <p className="text-white font-medium">Upload en cours...</p>
              <p className="text-sm text-white/50 mt-1">Compression et envoi des images</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white font-medium">Glissez vos photos ici</p>
              <p className="text-sm text-white/50 mt-1">ou cliquez pour sélectionner</p>
              <p className="text-xs text-white/30 mt-3">
                JPG, PNG • Max {MAX_SIZE_MB}MB par image • {images.length}/{MAX_IMAGES} photos
              </p>
            </>
          )}
        </div>

        {/* Input caméra native */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
          id="camera-input"
        />

        {/* Bouton Caméra (native) */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <label
            htmlFor="camera-input"
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer',
              'bg-[#007AFF] text-white hover:bg-[#005BBB]',
            )}
          >
            <Camera className="w-4 h-4" />
            <span>Prendre une photo</span>
          </label>
          <p className="text-xs text-white/40 flex items-center">
            Utilise la caméra native de votre appareil pour capturer les photos du sinistre.
          </p>
        </div>

        {/* Error upload */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20"
            >
              <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0" />
              <p className="text-sm text-[#FF3B30]">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-[#FF3B30]/60 hover:text-[#FF3B30]"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Uploaded Images Grid */}
        {images.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-[#34C759]" />
              <span className="text-sm text-white/70">
                {images.length} photo{images.length > 1 ? 's' : ''} ajoutée{images.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {images.map((image, index) => (
                  <motion.div
                    key={image.url}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-white/[0.04]"
                  >
                    <img
                      src={image.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white hover:bg-[#FF3B30] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      Photo {index + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Tips */}
      <GlassCard className="p-5 bg-[#007AFF]/5 border-[#007AFF]/20">
        <h4 className="text-sm font-medium text-white mb-3">Conseils pour de meilleures analyses</h4>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <span className="text-[#007AFF]">•</span>
            Prenez des photos sous différents angles
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#007AFF]">•</span>
            Assurez-vous d&apos;une bonne luminosité
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#007AFF]">•</span>
            Capturez les dommages de près et de loin
          </li>
        </ul>
      </GlassCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <GlassButton variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Retour
        </GlassButton>
        <GlassButton onClick={handleContinue} disabled={images.length === 0}>
          Lancer l&apos;analyse
          <ArrowRight className="w-5 h-5" />
        </GlassButton>
      </div>
    </div>
  );
}