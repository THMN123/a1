import { type Request, Response, NextFunction, type Express } from "express";
import { supabase } from "./supabase-client";
import jwt from "jsonwebtoken";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        user_metadata?: any;
      };
      isAuthenticated(): boolean;
    }
  }
}

// Mock isAuthenticated for compatibility
Request.prototype.isAuthenticated = function (
  this: Request
): this is Request & { user: any } {
  return !!this.user;
};

/**
 * Supabase JWT verification middleware
 * Verifies the JWT token from the Authorization header or cookies
 */
export async function verifySupabaseJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header or cookies
    let token =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.access_token;

    if (!token) {
      return next();
    }

    // Get the Supabase secret for JWT verification
    const secret = process.env.SUPABASE_JWT_SECRET || "your-secret-key";

    // Verify the JWT token
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as any;

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      user_metadata: decoded.user_metadata,
    };

    next();
  } catch (error) {
    // Invalid token, continue without user
    next();
  }
}

/**
 * Requires authentication middleware
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

/**
 * Setup Supabase authentication
 */
export async function setupAuth(app: Express) {
  app.use(verifySupabaseJWT);
}

/**
 * Register Supabase auth routes
 */
export function registerAuthRoutes(app: Express) {
  // Login - redirects to Supabase auth
  app.get("/api/login", (req, res) => {
    const redirectUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?client_id=${process.env.SUPABASE_ANON_KEY}&redirect_to=${encodeURIComponent(`${process.env.APP_URL || 'http://localhost:5173'}/auth/callback`)}&response_type=code`;
    res.redirect(redirectUrl);
  });

  // Callback - exchange code for session
  app.get("/api/auth/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: "Missing auth code" });
    }

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        code as string
      );

      if (error) throw error;

      // Set the session token in a secure cookie
      res.cookie("access_token", data.session?.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Redirect to home or dashboard
      res.redirect("/");
    } catch (error) {
      console.error("Auth callback error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ id: req.user.id, email: req.user.email });
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    res.clearCookie("access_token");
    res.redirect("/");
  });
}

