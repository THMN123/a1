import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth"; // Import auth users

// Re-export auth models
export * from "./models/auth";

// === TABLE DEFINITIONS ===

// Extend user data with a profiles table
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  role: text("role", { enum: ["customer", "vendor", "admin"] }).default("customer").notNull(),
  phone: text("phone"),
  address: text("address"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  category: text("category").notNull(), // e.g., "Food", "Drink", "Service"
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  status: text("status", { enum: ["pending", "used", "expired"] }).default("pending").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

export const vendorCategories = pgTable("vendor_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  categoryId: integer("category_id").references(() => vendorCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  coverImageUrl: text("cover_image_url"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("4.5"),
  deliveryTime: text("delivery_time").default("15-25 min"),
  isOpen: boolean("is_open").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("5.00").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
  prepTimeMinutes: integer("prep_time_minutes").default(10).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  status: text("status", { 
    enum: ["pending", "accepted", "preparing", "ready", "completed", "cancelled"] 
  }).default("pending").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", { enum: ["cash", "wallet", "mobile_money"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
});

export const savedAddresses = pgTable("saved_addresses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  label: text("label").notNull(), // e.g., "Home", "Office", "Dorm"
  address: text("address").notNull(),
  building: text("building"),
  room: text("room"),
  instructions: text("instructions"),
  isDefault: boolean("is_default").default(false).notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  orderUpdates: boolean("order_updates").default(true).notNull(),
  promotions: boolean("promotions").default(true).notNull(),
  newVendors: boolean("new_vendors").default(true).notNull(),
  rewards: boolean("rewards").default(true).notNull(),
  emailNotifications: boolean("email_notifications").default(false).notNull(),
});

export const vendorApplications = pgTable("vendor_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  logoUrl: text("logo_url"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const vendorHours = pgTable("vendor_hours", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  openTime: text("open_time").notNull(), // HH:MM format
  closeTime: text("close_time").notNull(),
  isClosed: boolean("is_closed").default(false).notNull(),
});

export const platformMetrics = pgTable("platform_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalOrders: integer("total_orders").default(0).notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  totalUsers: integer("total_users").default(0).notNull(),
  totalVendors: integer("total_vendors").default(0).notNull(),
  newUsers: integer("new_users").default(0).notNull(),
  activeUsers: integer("active_users").default(0).notNull(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  code: text("code").unique(),
  vendorId: integer("vendor_id").references(() => vendors.id), // null = platform-wide
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0).notNull(),
});

// === RELATIONS ===

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  owner: one(users, {
    fields: [vendors.ownerId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [orders.vendorId],
    references: [vendors.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true });
export const insertRedemptionSchema = createInsertSchema(redemptions).omit({ id: true, redeemedAt: true });
export const insertVendorCategorySchema = createInsertSchema(vendorCategories).omit({ id: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true });
export const insertSavedAddressSchema = createInsertSchema(savedAddresses).omit({ id: true });
export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({ id: true });
export const insertVendorApplicationSchema = createInsertSchema(vendorApplications).omit({ id: true, submittedAt: true, reviewedAt: true, reviewedBy: true, status: true });
export const insertProductCategorySchema = createInsertSchema(productCategories).omit({ id: true });
export const insertVendorHoursSchema = createInsertSchema(vendorHours).omit({ id: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, usageCount: true });

// === EXPLICIT API TYPES ===

export type Profile = typeof profiles.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
export type VendorCategory = typeof vendorCategories.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type SavedAddress = typeof savedAddresses.$inferSelect;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type VendorApplication = typeof vendorApplications.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type VendorHours = typeof vendorHours.$inferSelect;
export type PlatformMetrics = typeof platformMetrics.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;

export type CreateVendorRequest = z.infer<typeof insertVendorSchema>;
export type CreateProductRequest = z.infer<typeof insertProductSchema>;

// Order creation needs nested items
export const createOrderRequestSchema = insertOrderSchema.extend({
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1),
  })),
});
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export type UpdateOrderStatusRequest = { status: Order["status"] };
export type CreatePushSubscriptionRequest = z.infer<typeof insertPushSubscriptionSchema>;

// Joined types for responses
export type ProductWithVendor = Product & { vendor: Vendor };
export type OrderWithItems = Order & { items: (OrderItem & { product: Product })[]; vendor: Vendor };
