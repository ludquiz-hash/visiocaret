import express from 'express';
import { supabase } from '../index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get garage info
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('garages')
      .select('*')
      .eq('owner_id', req.user.id)
      .single();

    if (error || !data) {
      // Create default garage
      const { data: newGarage, error: createError } = await supabase
        .from('garages')
        .insert([{
          owner_id: req.user.id,
          name: 'Mon Garage',
          company_name: '',
          company_phone: '',
          company_email: '',
          plan_type: 'starter',
          is_subscribed: false,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;
      return res.json({ data: newGarage });
    }

    res.json({ data });
  } catch (error) {
    console.error('Get garage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update garage
router.patch('/', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('garages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    console.error('Update garage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get team members
router.get('/members', requireAuth, async (req, res) => {
  try {
    // Get user's garage
    const { data: garage, error: garageError } = await supabase
      .from('garages')
      .select('id')
      .eq('owner_id', req.user.id)
      .single();

    if (garageError || !garage) {
      return res.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('garage_id', garage.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ data: data || [] });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invite member
router.post('/members', requireAuth, async (req, res) => {
  try {
    const { email, role } = req.body;
    
    // Get user's garage
    const { data: garage, error: garageError } = await supabase
      .from('garages')
      .select('id')
      .eq('owner_id', req.user.id)
      .single();

    if (garageError || !garage) {
      return res.status(400).json({ error: 'No garage found' });
    }

    const { data, error } = await supabase
      .from('members')
      .insert([{
        garage_id: garage.id,
        user_email: email,
        role: role || 'staff',
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update member
router.patch('/members/:id', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove member
router.delete('/members/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get usage stats
router.get('/usage', requireAuth, async (req, res) => {
  try {
    // Get current month's claims count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    res.json({ 
      data: {
        claims_created: count || 0,
        claims_limit: 15 // Starter plan limit
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
