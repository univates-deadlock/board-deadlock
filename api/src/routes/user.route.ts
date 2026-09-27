import { Router } from "express";
import * as UserController from '../controllers/user.controller.js';
import { requireActiveUser } from "../middlewares/requireActiveUser.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = Router()

router.use(requireActiveUser, requireAdmin);

router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.get('/:id', UserController.getUserById);
router.patch('/:id', UserController.updateUser);
router.patch('/:id/activate', UserController.activateUser);
router.patch('/:id/deactivate', UserController.deactivateUser);
router.delete('/:id', UserController.deactivateUser); // Logical deletion preserves business history.

export default router;
