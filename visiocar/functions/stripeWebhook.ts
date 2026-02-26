import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // CRITICAL: Verify webhook signature using async method
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const garageId = session.metadata.garage_id;
        const planType = session.metadata.plan_type;

        if (garageId) {
          await base44.asServiceRole.entities.Garage.update(garageId, {
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            is_subscribed: true,
            plan_type: planType || 'starter',
            subscription_status: 'active',
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const garageId = subscription.metadata.garage_id;

        if (garageId) {
          const updateData = {
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          };

          // If subscription is active, ensure is_subscribed is true
          if (subscription.status === 'active') {
            updateData.is_subscribed = true;
          }

          await base44.asServiceRole.entities.Garage.update(garageId, updateData);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const garageId = subscription.metadata.garage_id;

        if (garageId) {
          await base44.asServiceRole.entities.Garage.update(garageId, {
            is_subscribed: false,
            subscription_status: 'canceled',
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find garage by customer ID
        const garages = await base44.asServiceRole.entities.Garage.filter({
          stripe_customer_id: customerId,
        });

        if (garages.length > 0) {
          await base44.asServiceRole.entities.Garage.update(garages[0].id, {
            is_subscribed: true,
            subscription_status: 'active',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find garage by customer ID
        const garages = await base44.asServiceRole.entities.Garage.filter({
          stripe_customer_id: customerId,
        });

        if (garages.length > 0) {
          await base44.asServiceRole.entities.Garage.update(garages[0].id, {
            subscription_status: 'past_due',
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 400 }
    );
  }
});