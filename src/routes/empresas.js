import express from "express";
import * as empresasController from "../controllers/cadastro/empresasController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.patch(
  "/:id/plano",
  authenticate,
  authorize("dono"),
  empresasController.updatePlan,
);

export default router;
