import express from "express";
import * as productsController from "../controllers/productsController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, productsController.getAll);

router.post(
  "/",
  authenticate,
  authorize("dono"),
  productsController.createProduct,
);

router.put(
  "/:id",
  authenticate,
  authorize("dono"),
  productsController.updateProduct,
);

router.delete(
  "/:id",
  authenticate,
  authorize("dono"),
  productsController.deleteProduct,
);

router.post(
  "/entrada",
  authenticate,
  authorize("dono"),
  productsController.entrada,
);

export default router;
