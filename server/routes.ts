import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

// Seed function
async function seedDatabase() {
  const vendors = await storage.getVendors();
  if (vendors.length === 0) {
    console.log("Seeding database...");
    
    // We need a user to own these vendors. For now, we might not have one. 
    // This is tricky without a real user ID. 
    // I'll skip automatic seeding of vendors for now until a user registers and becomes a vendor, 
    // or I can create a dummy user if needed, but Replit Auth IDs are from the provider.
    // Actually, I can check for a specific admin user or just wait.
    
    // Alternative: Create a placeholder system user if possible, but auth requires valid IDs.
    // I will log that manual seeding might be needed or seed on first admin login.
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
    const profile = await storage.getProfile(user.claims.sub);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
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
    res.json(updated);
  });

  // -- Notifications --
  app.post(api.notifications.subscribe.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    
    try {
      const input = api.notifications.subscribe.input.parse(req.body);
      // Check if exists
      const existing = await storage.getPushSubscription(user.claims.sub);
      if (existing) {
         // Update logic if needed, or just return existing
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

  await seedDatabase();

  return httpServer;
}
