import { 
  users, profiles, vendors, products, orders, orderItems, pushSubscriptions, rewards, redemptions, vendorCategories,
  savedAddresses, notificationPreferences,
  type User, type Profile, type Vendor, type Product, type Order, type OrderItem, type PushSubscription, type Reward, type Redemption, type VendorCategory,
  type SavedAddress, type NotificationPreferences,
  type CreateVendorRequest, type CreateProductRequest, type CreateOrderRequest, type UpdateOrderStatusRequest, type CreatePushSubscriptionRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: any): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile>;

  // Rewards & Redemptions
  getRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createRedemption(redemption: any): Promise<Redemption>;
  getUserRedemptions(userId: string): Promise<(Redemption & { reward: Reward })[]>;

  // Categories
  getCategories(): Promise<VendorCategory[]>;

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

  // Saved Addresses
  getSavedAddresses(userId: string): Promise<SavedAddress[]>;
  createSavedAddress(address: Partial<SavedAddress> & { userId: string }): Promise<SavedAddress>;
  updateSavedAddress(id: number, userId: string, updates: Partial<SavedAddress>): Promise<SavedAddress | undefined>;
  deleteSavedAddress(id: number, userId: string): Promise<boolean>;
  setDefaultAddress(id: number, userId: string): Promise<SavedAddress | undefined>;

  // Notification Preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  upsertNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
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

  // Rewards & Redemptions
  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.isActive, true));
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }

  async createRedemption(redemption: any): Promise<Redemption> {
    const [newRedemption] = await db.insert(redemptions).values(redemption).returning();
    return newRedemption;
  }

  async getUserRedemptions(userId: string): Promise<(Redemption & { reward: Reward })[]> {
    const results = await db.select()
      .from(redemptions)
      .innerJoin(rewards, eq(redemptions.rewardId, rewards.id))
      .where(eq(redemptions.userId, userId));
    
    return results.map(r => ({
      ...r.redemptions,
      reward: r.rewards
    }));
  }

  // Categories
  async getCategories(): Promise<VendorCategory[]> {
    return await db.select().from(vendorCategories).orderBy(vendorCategories.sortOrder);
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

  // Saved Addresses
  async getSavedAddresses(userId: string): Promise<SavedAddress[]> {
    return await db.select().from(savedAddresses).where(eq(savedAddresses.userId, userId));
  }

  async createSavedAddress(address: Partial<SavedAddress> & { userId: string }): Promise<SavedAddress> {
    const [newAddress] = await db.insert(savedAddresses).values(address as any).returning();
    return newAddress;
  }

  async updateSavedAddress(id: number, userId: string, updates: Partial<SavedAddress>): Promise<SavedAddress | undefined> {
    const [updated] = await db.update(savedAddresses)
      .set(updates)
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSavedAddress(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(savedAddresses)
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, userId)));
    return true;
  }

  async setDefaultAddress(id: number, userId: string): Promise<SavedAddress | undefined> {
    await db.update(savedAddresses)
      .set({ isDefault: false })
      .where(eq(savedAddresses.userId, userId));
    
    const [updated] = await db.update(savedAddresses)
      .set({ isDefault: true })
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, userId)))
      .returning();
    return updated;
  }

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return prefs;
  }

  async upsertNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const existing = await this.getNotificationPreferences(userId);
    if (existing) {
      const [updated] = await db.update(notificationPreferences)
        .set(prefs)
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(notificationPreferences)
        .values({ userId, ...prefs } as any)
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
