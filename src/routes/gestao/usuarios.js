import express from "express";
import { updatePin } from "../../controllers/gestao/usuariosController.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

router.put("/pin", authenticate, updatePin);

export default router;
