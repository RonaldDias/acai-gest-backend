import express from "express";
import { validationResult } from "express-validator";
import * as despesasController from "../../controllers/gestao/despesasController.js";
import {
  authenticate,
  authorize,
  checkSubscription,
} from "../../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  checkSubscription,
  authorize("dono"),
  despesasController.create,
);

export default router;
