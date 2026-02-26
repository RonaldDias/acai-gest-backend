import express from "express";
import * as productsController from "../../controllers/productsController.js";
import {
  authenticate,
  authorize,
  checkSubscription,
} from "../../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, checkSubscription, productsController.getAll);

router.post(
  "/",
  authenticate,
  checkSubscription,
  authorize("dono"),
  productsController.createProduct,
);

router.put(
  "/:id",
  authenticate,
  checkSubscription,
  authorize("dono"),
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
  productsController.entrada,
);

export default router;
