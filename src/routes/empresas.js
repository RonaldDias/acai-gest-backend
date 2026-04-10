import express from "express";
import * as empresasController from "../controllers/cadastro/empresasController.js";
import {
  authenticate,
  authorize,
  checkSubscription,
} from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/:id/assinatura",
  authenticate,
  checkSubscription,
  authorize("dono", "vendedor"),
  empresasController.getAssinatura,
)

router.patch(
  "/:id/plano",
  authenticate,
  checkSubscription,
  authorize("dono"),
  empresasController.updatePlan,
);

router.patch(
  "/:id/cancelar-assinatura",
  authenticate,
  authorize("dono"),
  empresasController.cancelarAssinatura,
)

export default router;
