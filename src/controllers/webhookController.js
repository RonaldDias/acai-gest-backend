import pool from "../config/database.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { searchStatusPayment } from "../services/pagamentoService.js";

export const mercadoPagoWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log("Webhook recebido:", { type, data });

    if (type !== "payment") {
      return res.status(200).json({ success: true });
    }

    const paymentId = data.id;

    const paymentStatus = await searchStatusPayment(paymentId);
    console.log("Status do pagamento:", paymentStatus);

    if (paymentStatus.status !== "aprovado") {
      console.log("Pagamento ainda não aprovado, ignorando webhook");
      return res.status(200).json({
        success: true,
        message: "Pagamento não aprovado ainda",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const paymentResult = await client.query(
        `SELECT p.id, p.empresa_id, p.status, e.email, e.nome as empresa_nome
        FROM pagamentos p
        INNER JOIN empresas e ON p.empresa_id = e.id
        WHERE p.payment_id = $1`,
        [paymentId],
      );

      if (paymentResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Pagamento não encontrado",
        });
      }

      const pagamento = paymentResult.rows[0];

      if (pagamento.status === "pago") {
        await client.query("ROLLBACK");
        return res.status(200).json({
          success: true,
          message: "Pagamento já processado",
        });
      }

      await client.query(
        `UPDATE pagamentos SET status = 'pago', data_pagamento = NOW() 
         WHERE id = $1`,
        [pagamento.id],
      );

      await client.query(`UPDATE empresas SET ativo = true WHERE id = $1`, [
        pagamento.empresa_id,
      ]);

      await client.query(
        `UPDATE pontos SET ativo = true WHERE empresa_id = $1`,
        [pagamento.empresa_id],
      );

      await client.query(
        `UPDATE usuarios SET ativo = true WHERE empresa_id = $1`,
        [pagamento.empresa_id],
      );

      const userResult = await client.query(
        `SELECT nome, email FROM usuarios WHERE empresa_id = $1 AND role = 'dono'`,
        [pagamento.empresa_id],
      );

      await client.query("COMMIT");

      if (userResult.rows.length > 0) {
        const usuario = userResult.rows[0];
        try {
          await sendWelcomeEmail(usuario.nome, usuario.email);
        } catch (emailError) {
          console.error("Erro ao enviar email de boas-vindas:", emailError);
        }
      }

      res.status(200).json({
        success: true,
        message: "Pagamento confirmado e conta ativada",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar webhook",
    });
  }
};
