import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { ZodError } from 'zod';

export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    void next;
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Dados inválidos',
            fields: err.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
        return res.status(400).json({ error: 'JSON inválido' });
    }
    if ('status' in err && err.status === 413) {
        return res.status(413).json({ error: 'Corpo da requisição excede o limite' });
    }

    // Custom AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message
        });
    }

    // Prisma: Record not found
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        return res.status(409).json({ error: 'Alteração concorrente; tente novamente' });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        return res.status(404).json({
            error: 'Registro não encontrado'
        });
    }

    // Prisma: Unique constraint violation
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = err.meta?.target;
        const field = Array.isArray(target) && target.length === 1 ? target[0] : undefined;

        let errorMessage = 'Já existe um registro com esse valor.';
        if (field === 'email') {
            errorMessage = 'Este email já está em uso';
        } else if (field === 'quoteId' || field === 'quote_id') {
            errorMessage = 'Já existe um serviço para este orçamento';
        }

        return res.status(409).json({
            error: errorMessage
        });
    }

    // Prisma: Foreign key constraint
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        return res.status(400).json({
            error: 'Referência inválida: o registro relacionado não existe'
        });
    }

    // Prisma: Validation error
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            error: 'Dados inválidos'
        });
    }

    // Fallback: Unknown/unexpected error
    // Do not log Prisma messages: they may contain payloads or credentials.
    console.error('[ERROR]: Unexpected request failure');
    return res.status(500).json({
        error: 'Erro interno'
    });
};
