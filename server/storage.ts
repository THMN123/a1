import { 
  users, profiles, vendors, products, orders, orderItems, pushSubscriptions,
  type User, type Profile, type Vendor, type Product, type Order, type OrderItem, type PushSubscription,
  type CreateVendorRequest, type CreateProductRequest, type CreateOrderRequest, type UpdateOrderStatusRequest, type CreatePushSubscriptionRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;

  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendorByOwnerId(ownerId: string): Promise<Vendor | undefined>;
  createVendor(vendor: CreateVendorRequest & { ownerId: string }): Promise<Vendor>;
  updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor>;

  // Products
  getProductsByVendorId(vendorId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: CreateProductRequest & { vendorId: number }): Promise<Product>;
  
  // Orders
  createOrder(order: any, items: any[]): Promise<Order>;
  getOrdersByCustomerId(customerId: string): Promise<Order[]>;
  getOrdersByVendorId(vendorId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  // Push Subscriptions
  createPushSubscription(sub: CreatePushSubscriptionRequest & { userId: string }): Promise<PushSubscription>;
  getPushSubscription(userId: string): Promise<PushSubscription | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: any): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const [updated] = await db.update(profiles)
      .set(updates)
      .where(eq(profiles.userId, userId))
      .returning();
    return updated;
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors);
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async getVendorByOwnerId(ownerId: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.ownerId, ownerId));
    return vendor;
  }

  async createVendor(vendor: CreateVendorRequest & { ownerId: string }): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor> {
    const [updated] = await db.update(vendors).set(updates).where(eq(vendors.id, id)).returning();
    return updated;
  }

  // Products
  async getProductsByVendorId(vendorId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.vendorId, vendorId));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: CreateProductRequest & { vendorId: number }): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Orders
  async createOrder(orderData: any, itemsData: any[]): Promise<Order> {
    // Transaction ideally, but keeping simple for now
    const [newOrder] = await db.insert(orders).values(orderData).returning();
    
    if (itemsData.length > 0) {
      await db.insert(orderItems).values(
        itemsData.map(item => ({
          ...item,
          orderId: newOrder.id
        }))
      );
    }
    
    return newOrder;
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByVendorId(vendorId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.vendorId, vendorId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders)
      .set({ status: status as any }) // Type casting to satisfy enum
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  // Push Subscriptions
  async createPushSubscription(sub: CreatePushSubscriptionRequest & { userId: string }): Promise<PushSubscription> {
    const [newSub] = await db.insert(pushSubscriptions).values(sub).returning();
    return newSub;
  }

  async getPushSubscription(userId: string): Promise<PushSubscription | undefined> {
    const [sub] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    return sub;
  }
}

export const storage = new DatabaseStorage();
