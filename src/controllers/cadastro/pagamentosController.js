import pool from "../../config/database.js";
import { generatePixPayment } from "../../services/pagamentoService.js";
import { createRecurringSubscription } from "../../services/pagamentoService.js";

export const createPixPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { empresa_id, plano, tipo_assinatura } = req.body;

    const valores = {
      basic: { mensal: 149.9, anual: 1619.1 },
      top: { mensal: 249.9, anual: 2699.1 },
    };

    const valor = valores[plano]?.[tipo_assinatura];

    if (!valor) {
      return res.status(400).json({
        success: false,
        message: "Plano ou tipo de assinatura inválido",
      });
    }

    await client.query("BEGIN");

    const empresaResult = await client.query(
      "SELECT id, nome, email FROM empresas WHERE id = $1",
      [empresa_id],
    );

    if (empresaResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada",
      });
    }

    const empresa = empresaResult.rows[0];
    const descricao = `Assinatura ${tipo_assinatura} - Plano ${plano.toUpperCase()} - ${empresa.nome}`;

    const mercadoPagoPayment = await generatePixPayment(
      valor,
      descricao,
      empresa.email,
    );

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const resultPagamento = await client.query(
      `INSERT INTO pagamentos (empresa_id, valor, status, metodo_pagamento,
            data_vencimento, qr_code, qr_code_base64, payment_id, tipo_assinatura)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
      [
        empresa_id,
        valor,
        "pendente",
        "pix",
        dueDate,
        mercadoPagoPayment.qr_code,
        mercadoPagoPayment.qr_code_base64,
        mercadoPagoPayment.id,
        tipo_assinatura,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Pagamento PIX gerado com sucesso",
      pagamento: {
        id: resultPagamento.rows[0].id,
        valor,
        qr_code: mercadoPagoPayment.qr_code,
        qr_code_base64: mercadoPagoPayment.qr_code_base64,
        ticket_url: mercadoPagoPayment.ticket_url,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar pagamento PIX:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar pagamento PIX",
    });
  } finally {
    client.release();
  }
};

export const createCardPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { empresa_id, plano, tipo_assinatura, card_token_id } = req.body;

    const valores = {
      basico: { mensal: 149.9, anual: 1619.1 },
      top: { mensal: 249.9, anual: 2699.1 },
    };

    const valor = valores[plano]?.[tipo_assinatura];

    if (!valor) {
      return res.status(400).json({
        success: false,
        message: "Plano ou tipo de assinatura inválido",
      });
    }

    if (!card_token_id) {
      return res.status(400).json({
        success: false,
        message: "Token do cartão é obrigatório",
      });
    }

    await client.query("BEGIN");

    const empresaResult = await client.query(
      "SELECT id, nome, email FROM empresas WHERE id = $1",
      [empresa_id],
    );

    if (empresaResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada",
      });
    }

    const empresa = empresaResult.rows[0];

    if (tipo_assinatura === "mensal") {
      const subscription = await createRecurringSubscription(
        empresa.email,
        card_token_id,
        valor,
        plano,
      );

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);

      const paymentResult = await client.query(
        `INSERT INTO pagamentos (empresa_id, valor, status, metodo_pagamento, 
          data_vencimento, payment_id, tipo_assinatura)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          empresa_id,
          valor,
          "pendente",
          "cartao",
          dueDate,
          subscription.id,
          tipo_assinatura,
        ],
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Assinatura recorrente criada com sucesso",
        pagamento: {
          id: paymentResult.rows[0].id,
          valor,
          subscription_id: subscription.id,
          status: subscription.status,
        },
      });
    }

    await client.query("ROLLBACK");
    return res.status(400).json({
      success: false,
      message: "Tipo de assinatura não implementado ainda",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar pagamento com cartão:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar pagamento",
    });
  } finally {
    client.release();
  }
};
