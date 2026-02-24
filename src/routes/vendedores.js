import express from "express";
import { body } from "express-validator";
import {
  createVendedor,
  listVendedores,
  updateVendedor,
  deleteVendedor,
} from "../controllers/cadastro/vendedoresController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("dono"),
  [
    body("nome").notEmpty().withMessage("Nome é obrigatório"),
    body("cpf")
      .matches(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/)
      .withMessage("CPF inválido"),
    body("pontoId").isInt().withMessage("Ponto ID é obrigatório"),
  ],
  createVendedor,
);

router.get("/", authenticate, authorize("dono"), listVendedores);

router.put(
  "/:id",
  authenticate,
  authorize("dono"),
  [
    body("nome").optional().notEmpty().withMessage("Nome não pode ser vazio"),
    body("ativo")
      .optional()
      .isBoolean()
      .withMessage("Ativo deve ser verdadeiro ou falso"),
  ],
  updateVendedor,
);

router.delete("/:id", authenticate, authorize("dono"), deleteVendedor);

export default router;
