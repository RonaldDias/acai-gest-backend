import express from "express";
import * as productsController from "../controllers/productsController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, productsController.getAll);

router.post("/entrada", productsController.entrada);

export default router;
