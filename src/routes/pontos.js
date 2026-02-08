import express from "express";
import * as pontosController from "../controllers/pontosController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticate, authorize("dono"), pontosController.create);

router.get("/", authenticate, authorize("dono"), pontosController.getAll);

router.put("/:id", authenticate, authorize("dono"), pontosController.update);

router.delete(
  "/:id",
  authenticate,
  authorize("dono"),
  pontosController.deletePonto,
);

export default router;
