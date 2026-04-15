import express from "express";
import * as empresasController from "../controllers/cadastro/empresasController.js";
import {
  authenticate,
  authorize,
  checkSubscription,
} from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/:id/assinatura",
  authenticate,
  checkSubscription,
  authorize("dono", "vendedor"),
  empresasController.getAssinatura,
)

router.patch(
  "/:id/plano",
  authenticate,
  checkSubscription,
  authorize("dono"),
  empresasController.trocarPlano,
);

router.patch(
  "/:id/cancelar-assinatura",
  authenticate,
  authorize("dono"),
  empresasController.cancelarAssinatura,
)

router.get(
  "/test/email-renovacao",
  authenticate,
  authorize("dono"),
  async (req, res) => {
    try {
      const { generatePixPayment } = await import("../services/pagamentoService.js");
      const { sendExpirationReminderEmail } = await import("../services/emailService.js");

      const pix = await generatePixPayment(149.9, "Teste renovação", req.user.email || "ronaldsilva850@gmail.com");
      await sendExpirationReminderEmail("Ronald", "ronaldsilva850@gmail.com", new Date(Date.now() + 3 * 86400000), pix.qr_code, pix.qr_code_base64);

      res.json({ success: true, message: "Email de teste enviado" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);


export default router;
