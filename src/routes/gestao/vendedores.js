import express from "express";
import { validationResult } from "express-validator";
import {
  createVendedor,
  listVendedores,
  updateVendedor,
  deleteVendedor,
} from "../../controllers/cadastro/vendedoresController.js";
import {
  authenticate,
  checkSubscription,
  authorize,
} from "../../middleware/auth.js";
import {
  validateCreateVendedor,
  validateUpdateVendedor,
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
  validateCreateVendedor,
  handleValidation,
  createVendedor,
);

router.get(
  "/",
  authenticate,
  checkSubscription,
  authorize("dono"),
  listVendedores,
);

router.put(
  "/:id",
  authenticate,
  checkSubscription,
  authorize("dono"),
  validateUpdateVendedor,
  handleValidation,
  updateVendedor,
);

router.delete(
  "/:id",
  authenticate,
  checkSubscription,
  authorize("dono"),
  deleteVendedor,
);

export default router;
