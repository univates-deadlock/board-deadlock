import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../utils/auth.js";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const requireActiveUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            return res.status(401).json({ error: "Não autenticado" })
        };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, role: true, isActive: true }
        });

        if (!user) {
            return res.status(401).json({ error: "Sessão inválida" });
        };

        if (!user.isActive) {
            return res.status(403).json({ error: "Usuário Inativo" });
        };

        res.locals.user = user;
        next();
    } catch (error) {
        next(error);
    }
}
