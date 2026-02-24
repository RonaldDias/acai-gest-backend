import cron from "node-cron";
import pool from "../config/database.js";
import { sendExpirationReminderEmail } from "../services/emailService.js";

export const startSubscriptionJob = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("Job de vencimento de assinaturas iniciado");

    try {
      const result = await pool.query(
        `SELECT a.empresa_id, a.data_vencimento, u.nome, u.email
                FROM assinaturas a
                INNER JOIN usuarios u ON u.empresa_id = a.empresa_id AND u.role = 'dono'
                WHERE a.status = 'ativa'
                AND a.data_vencimento::date = (NOW() + INTERVAL '3 days')::date`,
      );

      console.log(`Assinaturas vencendo em 3 dias: ${result.rows.length}`);

      for (const assinatura of result.rows) {
        try {
          await sendExpirationReminderEmail(
            assinatura.nome,
            assinatura.email,
            assinatura.data_vencimento,
          );
        } catch (emailError) {
          console.error(
            `Erro ao enviar email para ${assinatura.email}:`,
            emailError,
          );
        }
      }
    } catch (error) {
      console.error("Erro no job de assinaturas:", error);
    }
  });

  console.log("Job de assinaturas agendado para 08:00 diariamente");
};
