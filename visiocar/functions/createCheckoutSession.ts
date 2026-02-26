import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

// Product IDs from Stripe Dashboard
const PRODUCT_IDS = {
  starter: 'prod_TsM5ZBXHv59qKq',
  business: 'prod_TsM6jvvg3Buw9l',
};

Deno.serve(async (req) => {
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      console.error('[Stripe] STRIPE_SECRET_KEY manquante dans la configuration des fonctions.');
      return Response.json(
        {
          error: 'Configuration Stripe manquante',
          details: 'Ajoutez STRIPE_SECRET_KEY dans les variables d’environnement de la fonction Base44.',
        },
        { status: 500 },
      );
    }

    if (stripeSecretKey.startsWith('pk_') || stripeSecretKey.startsWith('mk_')) {
      console.error('[Stripe] Mauvais type de clé Stripe utilisée (clé publique au lieu de clé secrète).');
      return Response.json(
        {
          error: 'Clé Stripe invalide',
          details: 'Utilisez la clé secrète (sk_test_... ou sk_live_...) dans STRIPE_SECRET_KEY.',
        },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { planId, garageId } = await req.json();

    if (!planId || !garageId) {
      return Response.json({ error: 'planId et garageId requis' }, { status: 400 });
    }

    if (!['starter', 'business'].includes(planId)) {
      return Response.json({ error: 'planId invalide' }, { status: 400 });
    }

    // Fetch garage
    const garages = await base44.asServiceRole.entities.Garage.filter({ id: garageId });
    const garage = garages[0];

    if (!garage) {
      return Response.json({ error: 'Garage introuvable' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = garage.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: garage.company_name || garage.name,
        metadata: {
          garage_id: garageId,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update garage with customer ID
      await base44.asServiceRole.entities.Garage.update(garageId, {
        stripe_customer_id: customerId,
      });
    }

    // Get app URL for success/cancel redirects
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const appUrl = origin || (referer ? new URL(referer).origin : 'https://visiwebcar.com');

    // Get the default price for this product
    const product = await stripe.products.retrieve(PRODUCT_IDS[planId]);
    const priceId = product.default_price;

    if (!priceId) {
      return Response.json({ error: 'Prix Stripe non configuré pour ce produit' }, { status: 500 });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}#/billing`,
      cancel_url: `${appUrl}#/pricing?canceled=true`,
      metadata: {
        garage_id: garageId,
        plan_type: planId,
      },
      subscription_data: {
        metadata: {
          garage_id: garageId,
          plan_type: planId,
        },
      },
      allow_promotion_codes: true,
    });

    return Response.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json(
      { error: 'Erreur lors de la création de la session', details: error.message },
      { status: 500 }
    );
  }
});