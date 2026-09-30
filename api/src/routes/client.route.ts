import { Router } from "express";
import * as ClientController from "../controllers/client.controller.js";
import { requireActiveUser } from "../middlewares/requireActiveUser.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

// Requires the user to be authenticated and active in the system to access any client route
router.use(requireActiveUser);

// Requires the user role == ADMIN or PLANNING
router.use(requireRole("ADMIN", "PLANNING"));

router.get("/", ClientController.getAllClients);
router.post("/", ClientController.createClient);
router.get("/:id", ClientController.getClientById);
router.patch("/:id", ClientController.updateClient);
router.patch("/:id/activate", ClientController.activateClient);
router.patch("/:id/deactivate", ClientController.deactivateClient);
router.delete("/:id", ClientController.deactivateClient);

export default router;