import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);

    // Verify JWT with Supabase
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Get user role from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, supabaseUser.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.error(
        `Role mismatch: User ${req.user.email} has role "${req.user.role}", but required: ${allowedRoles.join(", ")}`
      );
      return res.status(403).json({
        error: "Forbidden: Insufficient permissions",
        message: `Required role: ${allowedRoles.join(" or ")}, but user has role: ${req.user.role}`,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
};
