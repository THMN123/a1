import { z } from 'zod';
import { 
  insertVendorSchema, 
  insertProductSchema, 
  createOrderRequestSchema, 
  insertPushSubscriptionSchema,
  vendors,
  products,
  orders,
  pushSubscriptions,
  insertProfileSchema,
  profiles
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  // Profiles (User data)
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound, // If profile not created yet
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/me',
      input: z.object({
        phone: z.string().optional(),
        address: z.string().optional(),
        bio: z.string().optional(),
        profileImageUrl: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    },
  },

  // Rewards
  rewards: {
    list: {
      method: 'GET' as const,
      path: '/api/rewards',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()), // Using profile points for now
      },
    },
    redeem: {
      method: 'POST' as const,
      path: '/api/rewards/redeem/:rewardId',
      responses: {
        201: z.any(),
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/rewards/history',
      responses: {
        200: z.array(z.any()),
      },
    }
  },

  // Vendors
  vendors: {
    list: {
      method: 'GET' as const,
      path: '/api/vendors',
      responses: {
        200: z.array(z.custom<typeof vendors.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/vendors/:id',
      responses: {
        200: z.custom<typeof vendors.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vendors',
      input: insertVendorSchema.omit({ ownerId: true }), // owner inferred from auth
      responses: {
        201: z.custom<typeof vendors.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    toggleOpen: {
      method: 'PATCH' as const,
      path: '/api/vendors/:id/open',
      input: z.object({ isOpen: z.boolean() }),
      responses: {
        200: z.custom<typeof vendors.$inferSelect>(),
      },
    },
  },

  // Products
  products: {
    listByVendor: {
      method: 'GET' as const,
      path: '/api/vendors/:vendorId/products',
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vendors/:vendorId/products',
      input: insertProductSchema.omit({ vendorId: true }),
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
      },
    },
  },

  // Orders
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: createOrderRequestSchema.omit({ customerId: true, totalAmount: true }), // calculated on backend
      responses: {
        201: z.custom<typeof orders.$inferSelect>(), // Simplification, ideally OrderWithItems
      },
    },
    listMine: {
      method: 'GET' as const,
      path: '/api/orders/mine',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()), // Simplification
      },
    },
    listVendor: {
      method: 'GET' as const,
      path: '/api/vendors/:vendorId/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status',
      input: z.object({ status: z.enum(["pending", "accepted", "preparing", "ready", "completed", "cancelled"]) }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
      },
    },
  },

  // Notifications
  notifications: {
    subscribe: {
      method: 'POST' as const,
      path: '/api/notifications/subscribe',
      input: insertPushSubscriptionSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof pushSubscriptions.$inferSelect>(),
      },
    },
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
