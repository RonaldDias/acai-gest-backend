import express from "express";
import { mercadoPagoWebhook } from "../../controllers/webhookController.js";

const router = express.Router();

router.post("/mercadopago", mercadoPagoWebhook);

export default router;
