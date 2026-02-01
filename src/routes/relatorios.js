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

export default router;
