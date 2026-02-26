import express from "express";
import * as salesController from "../../controllers/salesController.js";
import {
  authenticate,
  checkSubscription,
  authorize,
} from "../../middleware/auth.js";

const router = express.Router();

router.post("/", salesController.create);

router.get("/today", salesController.today);

router.get("/summary/today", salesController.summaryToday);

router.post(
  "/:id/cancel",
  authenticate,
  checkSubscription,
  authorize("dono", "vendedor"),
  salesController.cancel,
);

export default router;
