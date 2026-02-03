import express from "express";
import * as relatoriosController from "../controllers/relatoriosController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/vendas",
  authenticate,
  authorize("dono"),
  relatoriosController.vendas,
);

router.get(
  "/fluxo-caixa",
  authenticate,
  authorize("dono"),
  relatoriosController.cashFlow,
);

export default router;
