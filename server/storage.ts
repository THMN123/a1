import { 
  users, profiles, vendors, products, orders, orderItems, pushSubscriptions, rewards, redemptions, vendorCategories,
  savedAddresses, notificationPreferences, vendorApplications, productCategories, vendorHours, promotions, platformMetrics, inAppNotifications,
  type User, type Profile, type Vendor, type Product, type Order, type OrderItem, type PushSubscription, type Reward, type Redemption, type VendorCategory,
  type SavedAddress, type NotificationPreferences, type VendorApplication, type ProductCategory, type VendorHours, type Promotion, type PlatformMetrics, type InAppNotification,
  type CreateVendorRequest, type CreateProductRequest, type CreateOrderRequest, type UpdateOrderStatusRequest, type CreatePushSubscriptionRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, count, sum } from "drizzle-orm";

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

  // Vendor Applications
  getVendorApplications(): Promise<VendorApplication[]>;
  getVendorApplicationsByStatus(status: string): Promise<VendorApplication[]>;
  getVendorApplicationByUserId(userId: string): Promise<VendorApplication | undefined>;
  createVendorApplication(application: Partial<VendorApplication>): Promise<VendorApplication>;
  updateVendorApplication(id: number, updates: Partial<VendorApplication>): Promise<VendorApplication | undefined>;

  // Product Categories
  getProductCategories(vendorId: number): Promise<ProductCategory[]>;
  createProductCategory(category: Partial<ProductCategory>): Promise<ProductCategory>;
  updateProductCategory(id: number, updates: Partial<ProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: number): Promise<boolean>;

  // Vendor Hours
  getVendorHours(vendorId: number): Promise<VendorHours[]>;
  upsertVendorHours(vendorId: number, hours: Partial<VendorHours>[]): Promise<VendorHours[]>;

  // Products CRUD
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Promotions
  getPromotions(): Promise<Promotion[]>;
  getVendorPromotions(vendorId: number): Promise<Promotion[]>;
  createPromotion(promotion: Partial<Promotion>): Promise<Promotion>;
  updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined>;

  // Analytics
  getVendorAnalytics(vendorId: number): Promise<{ totalOrders: number; totalRevenue: string; avgOrderValue: string; weeklyData: any[] }>;
  getPlatformAnalytics(): Promise<{ totalOrders: number; totalRevenue: string; totalVendors: number; totalUsers: number }>;

  // In-App Notifications
  getNotifications(userId: string): Promise<InAppNotification[]>;
  createNotification(notification: { userId: string; title: string; message: string; type: string; data?: any }): Promise<InAppNotification>;
  markNotificationRead(id: number, userId: string): Promise<InAppNotification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
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
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.profileImageUrl && !normalizedUpdates.profileImageUrl.startsWith('/') && !normalizedUpdates.profileImageUrl.startsWith('http')) {
      normalizedUpdates.profileImageUrl = '/' + normalizedUpdates.profileImageUrl;
    }
    const [updated] = await db.update(profiles)
      .set(normalizedUpdates)
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
    const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
    if (existing.length > 0) {
      const [updated] = await db.update(pushSubscriptions)
        .set({ userId: sub.userId, p256dh: sub.p256dh, auth: sub.auth })
        .where(eq(pushSubscriptions.endpoint, sub.endpoint))
        .returning();
      return updated;
    }
    const [newSub] = await db.insert(pushSubscriptions).values(sub).returning();
    return newSub;
  }

  async getPushSubscription(userId: string): Promise<PushSubscription | undefined> {
    const [sub] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    return sub;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
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

  // Vendor Applications
  async getVendorApplications(): Promise<VendorApplication[]> {
    return await db.select().from(vendorApplications).orderBy(desc(vendorApplications.submittedAt));
  }

  async getVendorApplicationsByStatus(status: string): Promise<VendorApplication[]> {
    return await db.select().from(vendorApplications)
      .where(eq(vendorApplications.status, status as any))
      .orderBy(desc(vendorApplications.submittedAt));
  }

  async getVendorApplicationByUserId(userId: string): Promise<VendorApplication | undefined> {
    const [application] = await db.select().from(vendorApplications).where(eq(vendorApplications.userId, userId));
    return application;
  }

  async createVendorApplication(application: Partial<VendorApplication>): Promise<VendorApplication> {
    const [newApp] = await db.insert(vendorApplications).values(application as any).returning();
    return newApp;
  }

  async updateVendorApplication(id: number, updates: Partial<VendorApplication>): Promise<VendorApplication | undefined> {
    const [updated] = await db.update(vendorApplications)
      .set(updates)
      .where(eq(vendorApplications.id, id))
      .returning();
    return updated;
  }

  // Product Categories
  async getProductCategories(vendorId: number): Promise<ProductCategory[]> {
    return await db.select().from(productCategories)
      .where(eq(productCategories.vendorId, vendorId))
      .orderBy(productCategories.sortOrder);
  }

  async createProductCategory(category: Partial<ProductCategory>): Promise<ProductCategory> {
    const [newCat] = await db.insert(productCategories).values(category as any).returning();
    return newCat;
  }

  async updateProductCategory(id: number, updates: Partial<ProductCategory>): Promise<ProductCategory | undefined> {
    const [updated] = await db.update(productCategories)
      .set(updates)
      .where(eq(productCategories.id, id))
      .returning();
    return updated;
  }

  async deleteProductCategory(id: number): Promise<boolean> {
    await db.delete(productCategories).where(eq(productCategories.id, id));
    return true;
  }

  // Vendor Hours
  async getVendorHours(vendorId: number): Promise<VendorHours[]> {
    return await db.select().from(vendorHours)
      .where(eq(vendorHours.vendorId, vendorId))
      .orderBy(vendorHours.dayOfWeek);
  }

  async upsertVendorHours(vendorId: number, hoursData: Partial<VendorHours>[]): Promise<VendorHours[]> {
    await db.delete(vendorHours).where(eq(vendorHours.vendorId, vendorId));
    if (hoursData.length === 0) return [];
    const inserted = await db.insert(vendorHours)
      .values(hoursData.map(h => ({ ...h, vendorId })) as any)
      .returning();
    return inserted;
  }

  // Products CRUD
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions).orderBy(desc(promotions.startsAt));
  }

  async getVendorPromotions(vendorId: number): Promise<Promotion[]> {
    return await db.select().from(promotions)
      .where(eq(promotions.vendorId, vendorId))
      .orderBy(desc(promotions.startsAt));
  }

  async createPromotion(promotion: Partial<Promotion>): Promise<Promotion> {
    const [newPromo] = await db.insert(promotions).values(promotion as any).returning();
    return newPromo;
  }

  async updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined> {
    const [updated] = await db.update(promotions)
      .set(updates)
      .where(eq(promotions.id, id))
      .returning();
    return updated;
  }

  // Analytics
  async getVendorAnalytics(vendorId: number): Promise<{ totalOrders: number; totalRevenue: string; avgOrderValue: string; weeklyData: any[] }> {
    const vendorOrders = await db.select().from(orders).where(eq(orders.vendorId, vendorId));
    const totalOrders = vendorOrders.length;
    const totalRevenue = vendorOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = dayNames.map((day, index) => {
      const dayOrders = vendorOrders.filter(o => new Date(o.createdAt).getDay() === index);
      return {
        day,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0)
      };
    });
    const reorderedWeekly = [...weeklyData.slice(1), weeklyData[0]];
    
    return {
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
      weeklyData: reorderedWeekly
    };
  }

  async getPlatformAnalytics(): Promise<{ totalOrders: number; totalRevenue: string; totalVendors: number; totalUsers: number }> {
    const allOrders = await db.select().from(orders);
    const allVendors = await db.select().from(vendors);
    const allUsers = await db.select().from(profiles);
    
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    
    return {
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalVendors: allVendors.length,
      totalUsers: allUsers.length
    };
  }

  async getHomeFeedData(userId?: string): Promise<{
    popularProducts: any[];
    featuredVendors: any[];
    recentVendors: any[];
    recommendations: any[];
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentOrders = await db.select().from(orders)
      .where(gte(orders.createdAt, oneWeekAgo));
    
    const allOrderItems = await db.select().from(orderItems);
    const allProducts = await db.select().from(products).where(eq(products.isAvailable, true));
    const allVendors = await db.select().from(vendors);
    
    const recentOrderIds = new Set(recentOrders.map(o => o.id));
    const recentItems = allOrderItems.filter(item => recentOrderIds.has(item.orderId));
    
    const productSales: Record<number, number> = {};
    recentItems.forEach(item => {
      productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
    });
    
    const popularProducts = allProducts
      .map(p => ({ ...p, salesCount: productSales[p.id] || 0 }))
      .filter(p => p.salesCount > 0)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 10);
    
    const featuredVendors = allVendors
      .filter(v => v.isFeatured && v.isOpen)
      .slice(0, 5);
    
    const recentVendorsData = allVendors
      .slice(0, 5);
    
    let recommendations: any[] = [];
    if (userId) {
      const userOrders = await db.select().from(orders).where(eq(orders.customerId, userId));
      const userVendorIds = new Set(userOrders.map(o => o.vendorId));
      
      const userOrderIds = new Set(userOrders.map(o => o.id));
      const userItems = allOrderItems.filter(item => userOrderIds.has(item.orderId));
      const userCategories = new Set<string>();
      userItems.forEach(item => {
        const product = allProducts.find(p => p.id === item.productId);
        if (product?.category) userCategories.add(product.category);
      });
      
      recommendations = allProducts
        .filter(p => userCategories.has(p.category || '') && !userItems.some(ui => ui.productId === p.id))
        .slice(0, 8);
      
      if (recommendations.length < 4) {
        const otherProducts = allProducts
          .filter(p => !recommendations.some(r => r.id === p.id))
          .slice(0, 8 - recommendations.length);
        recommendations = [...recommendations, ...otherProducts];
      }
    } else {
      recommendations = allProducts.slice(0, 8);
    }
    
    return {
      popularProducts,
      featuredVendors,
      recentVendors: recentVendorsData,
      recommendations
    };
  }

  // In-App Notifications
  async getNotifications(userId: string): Promise<InAppNotification[]> {
    return await db.select().from(inAppNotifications)
      .where(eq(inAppNotifications.userId, userId))
      .orderBy(desc(inAppNotifications.createdAt));
  }

  async createNotification(notification: { userId: string; title: string; message: string; type: string; data?: any }): Promise<InAppNotification> {
    const [newNotif] = await db.insert(inAppNotifications).values(notification as any).returning();
    return newNotif;
  }

  async markNotificationRead(id: number, userId: string): Promise<InAppNotification | undefined> {
    const [updated] = await db.update(inAppNotifications)
      .set({ isRead: true })
      .where(and(eq(inAppNotifications.id, id), eq(inAppNotifications.userId, userId)))
      .returning();
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(inAppNotifications)
      .set({ isRead: true })
      .where(eq(inAppNotifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(inAppNotifications)
      .where(and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.isRead, false)));
    return result?.count || 0;
  }

}

export const storage = new DatabaseStorage();
