import express from "express";
import { validationResult } from "express-validator";
import * as salesController from "../../controllers/salesController.js";
import {
  authenticate,
  checkSubscription,
  authorize,
} from "../../middleware/auth.js";
import { validateCreateSale } from "../../middleware/validators.js";

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post(
  "/",
  authenticate,
  checkSubscription,
  validateCreateSale,
  handleValidation,
  salesController.create,
);

router.get("/today", authenticate, checkSubscription, salesController.today);

router.get(
  "/summary/today",
  authenticate,
  checkSubscription,
  salesController.summaryToday,
);

router.post(
  "/:id/cancel",
  authenticate,
  checkSubscription,
  authorize("dono", "vendedor"),
  salesController.cancel,
);

export default router;
