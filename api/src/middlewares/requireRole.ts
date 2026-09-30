import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../../generated/prisma/client.js";

/**
 * Middleware to validate if the authenticated user has one of the allowed roles.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = res.locals.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Acesso negado: você não tem permissão para realizar esta ação" 
      });
    }

    next();
  };
};
