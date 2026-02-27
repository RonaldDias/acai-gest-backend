import express from "express";
import { validationResult } from "express-validator";
import * as productsController from "../../controllers/productsController.js";
import {
  authenticate,
  authorize,
  checkSubscription,
} from "../../middleware/auth.js";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateEntrada,
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

router.get("/", authenticate, checkSubscription, productsController.getAll);

router.post(
  "/",
  authenticate,
  checkSubscription,
  authorize("dono"),
  validateCreateProduct,
  handleValidation,
  productsController.createProduct,
);

router.put(
  "/:id",
  authenticate,
  checkSubscription,
  authorize("dono"),
  validateUpdateProduct,
  handleValidation,
  productsController.updateProduct,
);

router.delete(
  "/:id",
  authenticate,
  checkSubscription,
  authorize("dono"),
  productsController.deleteProduct,
);

router.get(
  "/:id/movimentacoes",
  authenticate,
  checkSubscription,
  productsController.getMovimentacoes,
);

router.post(
  "/entrada",
  authenticate,
  checkSubscription,
  authorize("dono"),
  validateEntrada,
  handleValidation,
  productsController.entrada,
);

export default router;
