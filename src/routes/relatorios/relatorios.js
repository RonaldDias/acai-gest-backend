import express from "express";
import * as relatoriosController from "../../controllers/relatoriosController.js";
import {
  authenticate,
  checkSubscription,
  authorize,
} from "../../middleware/auth.js";

const router = express.Router();

router.get(
  "/vendas",
  authenticate,
  checkSubscription,
  authorize("dono"),
  relatoriosController.vendas,
);

router.get(
  "/fluxo-caixa",
  authenticate,
  checkSubscription,
  authorize("dono"),
  relatoriosController.cashFlow,
);

export default router;
