import express from "express";
import * as relatoriosController from "../../controllers/gestao/relatoriosController.js";
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
  authorize("dono", "vendedor"),
  relatoriosController.vendas,
);

router.get(
  "/fluxo-caixa",
  authenticate,
  checkSubscription,
  authorize("dono", "vendedor"),
  relatoriosController.cashFlow,
);

export default router;
