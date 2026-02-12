import express from "express";
import { criarPagamentoPix } from "../controllers/cadastro/pagamentosController.js";

const router = express.Router();

router.post("/pix", criarPagamentoPix);

export default router;
