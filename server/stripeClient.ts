import Stripe from 'stripe';

// Use environment variables instead of Replit connectors
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

export async function getUncachableStripeClient() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not found in environment variables');
  }

  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  });
}

export async function getStripePublishableKey() {
  if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error('STRIPE_PUBLISHABLE_KEY not found in environment variables');
  }
  return STRIPE_PUBLISHABLE_KEY;
}

export async function getStripeSecretKey() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not found in environment variables');
  }
  return STRIPE_SECRET_KEY;
}

// Stripe sync functionality is no longer available
// If you need to sync Stripe data, use Stripe webhooks instead
export async function getStripeSync() {
  console.warn('Stripe sync is no longer available. Use Stripe webhooks for data synchronization.');
  return null;
}
