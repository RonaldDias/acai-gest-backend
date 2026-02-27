import express from "express";
import { validationResult } from "express-validator";
import * as pontosController from "../../controllers/cadastro/pontosController.js";
import {
  authenticate,
  authorize,
  checkSubscription,
} from "../../middleware/auth.js";
import {
  validateCreatePonto,
  validateUpdatePonto,
} from "../../middleware/validators.js";

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
  authorize("dono"),
  validateCreatePonto,
  handleValidation,
  pontosController.create,
);

router.get(
  "/",
  authenticate,
  checkSubscription,
  authorize("dono"),
  pontosController.getAll,
);

router.put(
  "/:id",
  authenticate,
  checkSubscription,
  authorize("dono"),
  validateCreatePonto,
  handleValidation,
  pontosController.update,
);

router.delete(
  "/:id",
  authenticate,
  checkSubscription,
  authorize("dono"),
  pontosController.deletePonto,
);

export default router;
