import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Upload file to Supabase Storage
router.post('/:bucket', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { bucket } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${req.user.id}/${uuidv4()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    res.json({ 
      data: {
        path: data.path,
        url: publicUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/:bucket/*', requireAuth, async (req, res) => {
  try {
    const { bucket } = req.params;
    const path = req.params[0];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
