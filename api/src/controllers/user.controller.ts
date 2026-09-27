import type { Request, Response, NextFunction } from 'express';
import * as UserService from "../services/user.service.js";
import { AppError } from '../utils/AppError.js';
import { createUserBodySchema, updateUserBodySchema, userIdSchema } from '../schemas/user.schema.js';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await UserService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        next(error);
    };
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await UserService.getUserById(userIdSchema.parse(req.params.id));
        if (user === null) {
            throw new AppError('Usuário não encontrado', 404);
        }
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    };
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userData } = createUserBodySchema.parse(req.body);
        const user = await UserService.createUser(userData);
        return res.status(201).json(user);
    } catch (error) {
        next(error);
    };
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = userIdSchema.parse(req.params.id);
        const { userData } = updateUserBodySchema.parse(req.body);
        const user = await UserService.updateUser(id, userData, res.locals.user.id);
        return res.status(200).json(user);
    } catch (error) {
        next(error);
    };
}

export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UserService.activateUser(userIdSchema.parse(req.params.id));
        return res.status(204).send();
    } catch (error) {
        next(error);
    };
};

export const deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await UserService.deactivateUser(userIdSchema.parse(req.params.id), res.locals.user.id);
        return res.status(204).send();
    } catch (error) {
        next(error);
    };
};
