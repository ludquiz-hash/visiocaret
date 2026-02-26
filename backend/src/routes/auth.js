import express from 'express';
import { supabase } from '../index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      // Create profile if doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      return res.json({ data: newProfile });
    }

    res.json({ data: profile });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
