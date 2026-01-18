import express from "express";
import * as salesController from "../controllers/salesController.js";

const router = express.Router();

router.post("/", salesController.create);

router.get("/today", salesController.today);

router.get("/summary/today", salesController.summaryToday);

export default router;
