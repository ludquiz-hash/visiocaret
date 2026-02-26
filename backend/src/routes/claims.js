import express from 'express';
import { supabase } from '../index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all claims for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('claims')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`client_name.ilike.%${search}%,vehicle_brand.ilike.%${search}%,vehicle_model.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({ 
      data: data || [],
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single claim
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Claim not found' });

    res.json({ data });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create claim
router.post('/', requireAuth, async (req, res) => {
  try {
    const claimData = req.body;
    
    // Generate claim number if not provided
    if (!claimData.claim_number) {
      const date = new Date();
      const prefix = 'VIS';
      const random = Math.floor(1000 + Math.random() * 9000);
      claimData.claim_number = `${prefix}-${date.getFullYear()}-${random}`;
    }

    const { data, error } = await supabase
      .from('claims')
      .insert([{
        ...claimData,
        user_id: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (error) {
    console.error('Create claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update claim
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('claims')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Claim not found' });

    res.json({ data });
  } catch (error) {
    console.error('Update claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete claim
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete claim error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get claim history
router.get('/:id/history', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('claim_history')
      .select('*')
      .eq('claim_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data: data || [] });
  } catch (error) {
    console.error('Get claim history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
