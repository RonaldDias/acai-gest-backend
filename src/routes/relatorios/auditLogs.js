import express from "express";
import { getAuditLogs } from "../../controllers/auditController.js";
import {
  authenticate,
  checkSubscription,
  authorize,
} from "../../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  checkSubscription,
  authorize("dono"),
  getAuditLogs,
);

export default router;
