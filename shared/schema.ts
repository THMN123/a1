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
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  ownerId: varchar("owner_id").notNull().references(() => users.id), // Link to auth user
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  imageUrl: text("image_url"),
  isOpen: boolean("is_open").default(false).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("5.00").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
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
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true });

// === EXPLICIT API TYPES ===

export type Profile = typeof profiles.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

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
