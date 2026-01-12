import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { db } from "./db";
import { rewards, vendorCategories } from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed function
async function seedDatabase() {
  const vendors = await storage.getVendors();
  const existingRewards = await db.select().from(rewards);
  
  if (existingRewards.length === 0) {
    console.log("Seeding rewards...");
    await db.insert(rewards).values([
      { name: "Free Coffee", description: "Redeem for any small coffee", pointsRequired: 500, category: "Drink", isActive: true },
      { name: "10% Discount", description: "Get 10% off your next meal", pointsRequired: 1000, category: "Food", isActive: true },
      { name: "Free Burger", description: "Redeem for a classic burger", pointsRequired: 2000, category: "Food", isActive: true }
    ]);
  }

  const existingCategories = await db.select().from(vendorCategories);
  if (existingCategories.length === 0) {
    console.log("Seeding vendor categories...");
    await db.insert(vendorCategories).values([
      { name: "Food", icon: "🍔", color: "orange", sortOrder: 1 },
      { name: "Coffee", icon: "☕", color: "brown", sortOrder: 2 },
      { name: "Groceries", icon: "🥦", color: "green", sortOrder: 3 },
      { name: "Services", icon: "🔧", color: "blue", sortOrder: 4 },
      { name: "Print", icon: "🖨️", color: "gray", sortOrder: 5 },
      { name: "Fashion", icon: "👕", color: "purple", sortOrder: 6 },
    ]);
  }

  if (vendors.length === 0) {
    console.log("Skipping vendor seeding - waiting for first user to register as vendor.");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // === APPLICATION ROUTES ===

  // -- Profiles --
  app.get(api.profiles.me.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    let profile = await storage.getProfile(user.claims.sub);
    
    // Auto-create profile if it doesn't exist
    if (!profile) {
      profile = await storage.createProfile({ userId: user.claims.sub });
    }
    res.json(profile);
  });

  app.put(api.profiles.me.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const input = api.profiles.update.input.parse(req.body);
      const existing = await storage.getProfile(user.claims.sub);
      
      let profile;
      if (existing) {
        profile = await storage.updateProfile(user.claims.sub, input);
      } else {
        profile = await storage.createProfile({ ...input, userId: user.claims.sub });
      }
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // -- Rewards --
  app.get(api.rewards.list.path, async (req, res) => {
    const rewards = await storage.getRewards();
    res.json(rewards);
  });

  app.post(api.rewards.redeem.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const rewardId = Number(req.params.rewardId);
    
    try {
      const reward = await storage.getReward(rewardId);
      if (!reward) return res.status(404).json({ message: "Reward not found" });
      
      const profile = await storage.getProfile(user.claims.sub);
      if (!profile || profile.loyaltyPoints < reward.pointsRequired) {
        return res.status(400).json({ message: "Insufficient points" });
      }
      
      // Deduct points and create redemption
      await storage.updateProfile(user.claims.sub, { 
        loyaltyPoints: profile.loyaltyPoints - reward.pointsRequired 
      });
      
      const redemption = await storage.createRedemption({
        userId: user.claims.sub,
        rewardId,
        status: "pending"
      });
      
      res.status(201).json(redemption);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.rewards.history.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const history = await storage.getUserRedemptions(user.claims.sub);
    res.json(history);
  });

  // -- Categories --
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // -- Vendors --
  app.get(api.vendors.list.path, async (req, res) => {
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.get(api.vendors.get.path, async (req, res) => {
    const vendor = await storage.getVendor(Number(req.params.id));
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  });

  app.post(api.vendors.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const input = api.vendors.create.input.parse(req.body);
      
      // Ensure user has profile
      let profile = await storage.getProfile(user.claims.sub);
      if (!profile) {
        profile = await storage.createProfile({ userId: user.claims.sub, role: "vendor" });
      } else if (profile.role !== "vendor" && profile.role !== "admin") {
        await storage.updateProfile(user.claims.sub, { role: "vendor" });
      }

      const vendor = await storage.createVendor({ ...input, ownerId: user.claims.sub });
      res.status(201).json(vendor);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.vendors.toggleOpen.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const vendorId = Number(req.params.id);
    const vendor = await storage.getVendor(vendorId);
    
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    if (vendor.ownerId !== user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    const updated = await storage.updateVendor(vendorId, req.body);
    res.json(updated);
  });

  // -- Products --
  app.get(api.products.listByVendor.path, async (req, res) => {
    const products = await storage.getProductsByVendorId(Number(req.params.vendorId));
    res.json(products);
  });

  app.post(api.products.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const vendorId = Number(req.params.vendorId);
    
    const vendor = await storage.getVendor(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    if (vendor.ownerId !== user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct({ ...input, vendorId });
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // -- Orders --
  app.post(api.orders.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;

    try {
      const input = api.orders.create.input.parse(req.body);
      
      // Calculate total
      let total = 0;
      const itemsData = [];
      
      for (const item of input.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        const price = Number(product.price);
        total += price * item.quantity;
        itemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: product.price
        });
      }

      const orderData = {
        customerId: user.claims.sub,
        vendorId: input.vendorId,
        paymentMethod: input.paymentMethod,
        totalAmount: total.toFixed(2),
        status: "pending"
      };

      const order = await storage.createOrder(orderData, itemsData);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get(api.orders.listMine.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const orders = await storage.getOrdersByCustomerId(user.claims.sub);
    res.json(orders);
  });

  app.get(api.orders.listVendor.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const vendorId = Number(req.params.vendorId);
    
    const vendor = await storage.getVendor(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    if (vendor.ownerId !== user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    const orders = await storage.getOrdersByVendorId(vendorId);
    res.json(orders);
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const orderId = Number(req.params.id);
    
    const order = await storage.getOrder(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    // Verify vendor ownership
    const vendor = await storage.getVendor(order.vendorId);
    if (!vendor || vendor.ownerId !== user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    const updated = await storage.updateOrderStatus(orderId, req.body.status);
    
    // Award loyalty points when order is completed (1 point per $1 spent)
    if (req.body.status === "completed" && order.status !== "completed") {
      const pointsEarned = Math.floor(Number(order.totalAmount));
      const profile = await storage.getProfile(order.customerId);
      if (profile) {
        await storage.updateProfile(order.customerId, {
          loyaltyPoints: profile.loyaltyPoints + pointsEarned
        });
      }
    }
    
    res.json(updated);
  });

  // -- Notifications --
  app.post(api.notifications.subscribe.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    try {
      const input = api.notifications.subscribe.input.parse(req.body);
      const existing = await storage.getPushSubscription(user.claims.sub);
      if (existing) {
         res.status(200).json(existing);
      } else {
        const sub = await storage.createPushSubscription({ ...input, userId: user.claims.sub });
        res.status(201).json(sub);
      }
    } catch (err) {
       if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
       res.status(500).json({ message: "Internal server error" });
    }
  });

  // -- Wallet / Stripe --
  app.get(api.wallet.stripeKey.path, async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (err) {
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  app.post(api.wallet.topup.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;

    try {
      const { amount } = api.wallet.topup.input.parse(req.body);
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Wallet Top-Up: $${amount}`,
              description: 'Add funds to your A1 Services wallet',
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/profile?topup=success`,
        cancel_url: `${baseUrl}/profile?topup=cancelled`,
        metadata: {
          userId: user.claims.sub,
          walletAmount: amount.toString(),
          type: 'wallet_topup',
        },
      });

      res.json({ url: session.url });
    } catch (err) {
      console.error('Stripe checkout error:', err);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // -- Saved Addresses --
  app.get(api.addresses.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const addresses = await storage.getSavedAddresses(user.claims.sub);
    res.json(addresses);
  });

  app.post(api.addresses.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const input = api.addresses.create.input.parse(req.body);
      const address = await storage.createSavedAddress({ ...input, userId: user.claims.sub });
      res.status(201).json(address);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/addresses/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const id = Number(req.params.id);
    try {
      const input = api.addresses.update.input.parse(req.body);
      const address = await storage.updateSavedAddress(id, user.claims.sub, input);
      if (!address) return res.status(404).json({ message: "Address not found" });
      res.json(address);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/addresses/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const id = Number(req.params.id);
    await storage.deleteSavedAddress(id, user.claims.sub);
    res.json({ success: true });
  });

  app.patch('/api/addresses/:id/default', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const id = Number(req.params.id);
    const address = await storage.setDefaultAddress(id, user.claims.sub);
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.json(address);
  });

  // -- Notification Preferences --
  app.get(api.notificationPrefs.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    let prefs = await storage.getNotificationPreferences(user.claims.sub);
    if (!prefs) {
      prefs = await storage.upsertNotificationPreferences(user.claims.sub, {});
    }
    res.json(prefs);
  });

  app.put(api.notificationPrefs.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const input = api.notificationPrefs.update.input.parse(req.body);
      const prefs = await storage.upsertNotificationPreferences(user.claims.sub, input);
      res.json(prefs);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === VENDOR ADMIN ROUTES ===

  // -- Vendor Applications --
  app.get('/api/vendor-admin/application', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const application = await storage.getVendorApplicationByUserId(user.claims.sub);
    res.json(application || null);
  });

  app.post('/api/vendor-admin/application', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    try {
      const existing = await storage.getVendorApplicationByUserId(user.claims.sub);
      if (existing) {
        return res.status(400).json({ message: "Application already submitted" });
      }
      
      const application = await storage.createVendorApplication({
        ...req.body,
        userId: user.claims.sub,
      });
      res.status(201).json(application);
    } catch (err) {
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // -- Vendor's Own Shop --
  app.get('/api/vendor-admin/shop', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    res.json(vendor || null);
  });

  app.put('/api/vendor-admin/shop', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const updated = await storage.updateVendor(vendor.id, req.body);
    res.json(updated);
  });

  // -- Vendor Product Management --
  app.get('/api/vendor-admin/products', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const products = await storage.getProductsByVendorId(vendor.id);
    res.json(products);
  });

  app.post('/api/vendor-admin/products', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    try {
      const product = await storage.createProduct({ ...req.body, vendorId: vendor.id });
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/vendor-admin/products/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const productId = Number(req.params.id);
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const product = await storage.getProduct(productId);
    if (!product || product.vendorId !== vendor.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const updated = await storage.updateProduct(productId, req.body);
    res.json(updated);
  });

  app.delete('/api/vendor-admin/products/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const productId = Number(req.params.id);
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const product = await storage.getProduct(productId);
    if (!product || product.vendorId !== vendor.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    await storage.deleteProduct(productId);
    res.json({ success: true });
  });

  // -- Vendor Orders --
  app.get('/api/vendor-admin/orders', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const orders = await storage.getOrdersByVendorId(vendor.id);
    res.json(orders);
  });

  // -- Vendor Analytics --
  app.get('/api/vendor-admin/analytics', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const analytics = await storage.getVendorAnalytics(vendor.id);
    res.json(analytics);
  });

  // -- Vendor Hours --
  app.get('/api/vendor-admin/hours', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const hours = await storage.getVendorHours(vendor.id);
    res.json(hours);
  });

  app.put('/api/vendor-admin/hours', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    const vendor = await storage.getVendorByOwnerId(user.claims.sub);
    if (!vendor) return res.status(404).json({ message: "No shop found" });
    
    const hours = await storage.upsertVendorHours(vendor.id, req.body.hours);
    res.json(hours);
  });

  // === SUPER ADMIN ROUTES ===

  // Middleware helper for admin check
  const requireAdmin = async (req: any, res: any): Promise<boolean> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "Unauthorized" });
      return false;
    }
    const user = req.user as any;
    const profile = await storage.getProfile(user.claims.sub);
    if (!profile || profile.role !== 'admin') {
      res.status(403).json({ message: "Admin access required" });
      return false;
    }
    return true;
  };

  // -- Vendor Applications Management --
  app.get('/api/super-admin/applications', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const applications = await storage.getVendorApplications();
    res.json(applications);
  });

  app.get('/api/super-admin/applications/pending', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const applications = await storage.getVendorApplicationsByStatus('pending');
    res.json(applications);
  });

  app.patch('/api/super-admin/applications/:id/approve', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const user = req.user as any;
    const appId = Number(req.params.id);
    
    const application = await storage.updateVendorApplication(appId, {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: user.claims.sub
    });
    
    if (!application) return res.status(404).json({ message: "Application not found" });
    
    // Create vendor from application
    const vendor = await storage.createVendor({
      ownerId: application.userId,
      name: application.businessName,
      description: application.description || '',
      location: application.location,
      imageUrl: application.logoUrl || '',
    });
    
    // Update user role to vendor (but preserve admin role)
    const existingProfile = await storage.getProfile(application.userId);
    if (existingProfile?.role !== 'admin') {
      await storage.updateProfile(application.userId, { role: 'vendor' });
    }
    
    res.json({ application, vendor });
  });

  app.patch('/api/super-admin/applications/:id/reject', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const user = req.user as any;
    const appId = Number(req.params.id);
    
    const application = await storage.updateVendorApplication(appId, {
      status: 'rejected',
      rejectionReason: req.body.reason || 'Application not approved',
      reviewedAt: new Date(),
      reviewedBy: user.claims.sub
    });
    
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json(application);
  });

  // -- Platform Analytics --
  app.get('/api/super-admin/analytics', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const analytics = await storage.getPlatformAnalytics();
    res.json(analytics);
  });

  // -- All Vendors Management --
  app.get('/api/super-admin/vendors', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const vendors = await storage.getVendors();
    res.json(vendors);
  });

  app.patch('/api/super-admin/vendors/:id/feature', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const vendorId = Number(req.params.id);
    const vendor = await storage.updateVendor(vendorId, { isFeatured: req.body.isFeatured });
    res.json(vendor);
  });

  // -- Promotions Management --
  app.get('/api/super-admin/promotions', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const promos = await storage.getPromotions();
    res.json(promos);
  });

  app.post('/api/super-admin/promotions', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const promo = await storage.createPromotion(req.body);
      res.status(201).json(promo);
    } catch (err) {
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  app.patch('/api/super-admin/promotions/:id', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const promoId = Number(req.params.id);
    const promo = await storage.updatePromotion(promoId, req.body);
    if (!promo) return res.status(404).json({ message: "Promotion not found" });
    res.json(promo);
  });

  // -- Categories Management --
  app.post('/api/super-admin/categories', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    try {
      const [category] = await db.insert(vendorCategories).values(req.body).returning();
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/super-admin/categories/:id', async (req, res) => {
    if (!await requireAdmin(req, res)) return;
    const catId = Number(req.params.id);
    try {
      const [updated] = await db.update(vendorCategories)
        .set(req.body)
        .where(eq(vendorCategories.id, catId))
        .returning();
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  await seedDatabase();

  return httpServer;
}
