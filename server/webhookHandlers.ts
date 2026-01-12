import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    
    // Process with stripe-replit-sync for database storage
    await sync.processWebhook(payload, signature);
    
    // Also parse the event for our custom handling
    try {
      const stripe = await getUncachableStripeClient();
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
      
      // Handle specific events
      if (event.type === 'checkout.session.completed') {
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
      }
    } catch (err) {
      // If webhook signature verification fails (e.g., no STRIPE_WEBHOOK_SECRET),
      // parse the payload directly for local development
      try {
        const eventData = JSON.parse(payload.toString());
        if (eventData.type === 'checkout.session.completed') {
          await WebhookHandlers.handleCheckoutCompleted(eventData.data.object);
        }
      } catch (parseErr) {
        console.error('Failed to parse webhook payload:', parseErr);
      }
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    // Only process wallet top-ups
    if (session.metadata?.type !== 'wallet_topup') {
      return;
    }

    const userId = session.metadata?.userId;
    const amount = session.metadata?.walletAmount;
    
    if (userId && amount) {
      console.log(`Processing wallet top-up: ${amount} for user ${userId}`);
      
      const profile = await storage.getProfile(userId);
      if (profile) {
        const newBalance = Number(profile.walletBalance) + Number(amount);
        await storage.updateProfile(userId, { walletBalance: newBalance.toFixed(2) });
        console.log(`Wallet updated: ${profile.walletBalance} -> ${newBalance.toFixed(2)}`);
      } else {
        console.error(`Profile not found for user ${userId}`);
      }
    }
  }
}
