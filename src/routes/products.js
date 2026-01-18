import express from "express";
import * as productsController from "../controllers/productsController.js";

const router = express.Router();

router.get("/", productsController.getAll);

router.post("/entrada", productsController.entrada);

export default router;
