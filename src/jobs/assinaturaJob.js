import cron from "node-cron";
import pool from "../config/database.js";
import { sendExpirationReminderEmail } from "../services/emailService.js";
import { generatePixPayment } from "../services/pagamentoService.js"

export const startSubscriptionJob = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("Job de vencimento de assinaturas iniciado");

    const pendentes = await pool.query(
      `SELECT a.empresa_id, a.plano_pendente, a.tipo
      FROM assinaturas a
      WHERE a.status = 'ativa'
      AND a.plano_pendente IS NOT NULL
      AND a.data_vencimento::date <= CURRENT_DATE`
    );

    console.log(`Planos pendentes para processar: ${pendentes.rows.length}`);

    for (const row of pendentes.rows) {
      try {
        const novaVencimento = row.tipo === 'anual' ? 365 : 30;

        await pool.query(
          `UPDATE assinaturas
          SET plano = plano_pendente,
              plano_pendente = NULL,
              data_inicio = CURRENT_DATE,
              data_vencimento = CURRENT_DATE + INTERVAL '${novaVencimento} days'
          WHERE empresa_id = $1`,
          [row.empresa_id]
        );

        await pool.query(
          `UPDATE empresas SET plano = $1 WHERE id = $2`,
          [row.plano_pendente, row.empresa_id]
        );

        console.log(`Plano da empresa ${row.empresa_id} atualizado para ${row.plano_pendente}`);
      } catch (error) {
        console.error(`Erro ao processar plano da empresa ${row.empresa_id}:`, error);
      }
    }

    try {
      const result = await pool.query(
        `SELECT a.empresa_id, a.plano, a.tipo, a.data_vencimento, u.nome, u.email
                FROM assinaturas a
                INNER JOIN usuarios u ON u.empresa_id = a.empresa_id AND u.role = 'dono'
                INNER JOIN empresas e ON e.id = a.empresa_id
                WHERE a.status = 'ativa'
                AND e.forma_pagamento = 'PIX'
                AND a.data_vencimento::date = (NOW() + INTERVAL '3 days')::date`,
      );

      console.log(`Assinaturas vencendo em 3 dias: ${result.rows.length}`);

      for (const assinatura of result.rows) {
        try {
          const valores = {
            basico: { mensal: 149.9, anual: 1619.1 },
            top: { mensal: 249.9, anual: 2699.1 }
          };

          const valor = valores[assinatura.plano][assinatura.tipo];
          const descricao = `Renovação ${assinatura.tipo} - Plano ${assinatura.plano.toUpperCase()}`;

          const pix = await generatePixPayment(valor, descricao, assinatura.email);

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 3);

          await pool.query(
            `INSERT INTO pagamentos (empresa_id, valor, status, metodo_pagamento, data_vencimento, qr_code, qr_code_base64, payment_id, tipo_assinatura, plano)
            VALUES ($1, $2, 'pendente', 'pix', $3, $4, $5, $6, $7, $8)`,
            [assinatura.empresa_id, valor, dueDate, pix.qr_code, pix.qr_code_base64, pix.id, assinatura.tipo, assinatura.plano]
          );

          await sendExpirationReminderEmail(assinatura.nome, assinatura.email, assinatura.data_vencimento, pix.qr_code, pix.qr_code_base64);

          console.log(`Lembrete enviado para ${assinatura.email}`);
        } catch (emailError) {
          console.error(`Erro ao processar renovação para ${assinatura.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error("Erro no job de assinaturas:", error);
    }
  });

  console.log("Job de assinaturas agendado para 08:00 diariamente");
};
