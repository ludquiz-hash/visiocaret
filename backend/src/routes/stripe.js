import express from 'express';
import Stripe from 'stripe';
import { supabase } from '../index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const plans = {
  starter: {
    name: 'Starter',
    price: 69,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  business: {
    name: 'Business',
    price: 199,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
  },
};

// Create checkout session
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { planId, garageId } = req.body;
    
    if (!plans[planId]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const plan = plans[planId];
    
    if (!plan.priceId) {
      return res.status(400).json({ error: 'Plan not configured' });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
      metadata: {
        garageId,
        planId,
        userId: req.user.id,
      },
    });

    res.json({ data: { url: session.url } });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create portal session
router.post('/portal', requireAuth, async (req, res) => {
  try {
    // Get garage
    const { data: garage } = await supabase
      .from('garages')
      .select('stripe_customer_id')
      .eq('owner_id', req.user.id)
      .single();

    if (!garage?.stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: garage.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({ data: { url: session.url } });
  } catch (error) {
    console.error('Create portal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { garageId, planId } = session.metadata;

      await supabase
        .from('garages')
        .update({
          plan_type: planId,
          is_subscribed: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        })
        .eq('id', garageId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      await supabase
        .from('garages')
        .update({
          is_subscribed: false,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
  }

  res.json({ received: true });
});

export default router;
