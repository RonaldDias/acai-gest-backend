import express from "express";
import {
  createPixPayment,
  createCardPayment,
} from "../../controllers/cadastro/pagamentosController.js";

const router = express.Router();

router.post("/pix", createPixPayment);
router.post("/cartao", createCardPayment);

export default router;
