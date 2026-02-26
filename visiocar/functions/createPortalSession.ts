import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { garageId } = await req.json();

    // Get garage
    const garages = await base44.asServiceRole.entities.Garage.filter({ id: garageId });
    const garage = garages[0];

    if (!garage || !garage.stripe_customer_id) {
      return Response.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: garage.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/Billing`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});