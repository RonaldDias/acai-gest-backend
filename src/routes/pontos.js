import express from "express";
import * as pontosController from "../controllers/cadastro/pontosController.js";
import {
  authenticate,
  authorize,
  checkSubscription,
} from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  checkSubscription,
  authorize("dono"),
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
