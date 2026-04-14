import pool from "../../config/database.js";
import { logAudit } from "../../utils/auditLogger.js";

export async function trocarPlano(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { novo_plano, metodo_pagamento, card_token_id } = req.body;
    const empresaId = req.user.empresaId;

    if (parseInt(id) !== empresaId) {
      return res.status(403).json({ success: false, message: "Sem permissão" });
    }

    if (!["basico", "top"].includes(novo_plano)) {
      return res.status(400).json({
        success: false,
        message: "Plano inválido",
      })
    }

    const assinaturaResult = await client.query(
      "SELECT plano, tipo, data_vencimento FROM assinaturas WHERE empresa_id = $1",
      [empresaId],
    );

    if (assinaturaResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Assinatura não encontrada",
      });
    }

    const assinatura = assinaturaResult.rows[0];

    if (assinatura.plano === novo_plano) {
      return res.status(400).json({
        success: false,
        message: `Empresa já possui o plano ${novo_plano}`,
      })
    }

    const empresaResult = await client.query(
      "SELECT id, nome, email FROM empresas WHERE id = $1",
      [empresaId]
    );

    const empresa = empresaResult.rows[0];
    
    const valores = {
      basico: { mensal: 149.9, anual: 1619.1 },
      top: { mensal: 249.9, anual: 2699.1 }
    };

    const isUpgrade = novo_plano === "top";

    if (!isUpgrade) {
      const pontosAtivos = await client.query(
        "SELECT COUNT(*) as total FROM pontos WHERE empresa_id = $1 AND ativo = true",
        [empresaId],
      );

      if (parseInt(pontosAtivos.rows[0].total) > 1) {
        return res.status(400).json({
          success: false,
          message: "Desative os pontos extras antes de mudar para o plano Básico.",
        })
      }

      await client.query(
        "UPDATE assinaturas SET plano_pendente = $1 WHERE empresa_id = $2",
        [novo_plano, empresaId],
      );

      return res.json({
        success: true,
        downgrade: true,
        message: `Seu plano será alterado para Básico em ${new Date(assinatura.data_vencimento).toLocaleDateString('pt-BR')}.`
      })
    }

    const agora = new Date();
    const vencimento = new Date(assinatura.data_vencimento);
    const diasTotais = assinatura.tipo === "anual" ? 365 : 30;
    const diasRestantes = Math.max(0, Math.ceil((vencimento - agora) / (1000 * 60 * 60 * 24)));
    const valorAtual = valores[assinatura.plano][assinatura.tipo];
    const valorNovo = valores[novo_plano][assinatura.tipo];
    const valorDiario = (valorNovo - valorAtual) / diasTotais;
    const valorCobrar = parseFloat((valorDiario * diasRestantes).toFixed(2));

    if (valorCobrar <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valor de upgrade inválido",
      })
    }
    
    const descricao = `Upgrade para plano TOP - ${empresa.nome}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    
    await client.query("BEGIN");

    let pagamentoResposta;

    if (metodo_pagamento === "pix") {
      const { generatePixPayment } = await import("../../services/pagamentoService.js");
      const pix = await generatePixPayment(valorCobrar, descricao, empresa.email);

      const result = await client.query(
        `INSERT INTO pagamentos (empresa_id, valor, status, metodo_pagamento, data_vencimento, qr_code, qr_code_base64, payment_id, tipo_assinatura, plano)
        VALUES ($1, $2, 'pendente', 'pix', $3, $4, $5, $6, $7, $8) RETURNING id`,
        [empresaId, valorCobrar, dueDate, pix.qr_code, pix.qr_code_base64, pix.id, assinatura.tipo, novo_plano],
      );

      pagamentoResposta = {
        metodo: "pix",
        valor: valorCobrar,
        qr_code: pix.qr_code,
        qr_code_base64: pix.qr_code_base64,
        ticket_url: pix.ticket_url,
        pagamento_id: result.rows[0].id,
      }
    } else if (metodo_pagamento === "cartao") {
      const { createRecurringSubscription } = await import("../../services/pagamentoService.js");
      const subscription = await createRecurringSubscription(empresa.email, valorCobrar, novo_plano);

      const result = await client.query(
        `INSERT INTO pagamentos (empresa_id, valor, status, metodo_pagamento, data_vencimento, payment_id, tipo_assinatura, plano)
        VALUES ($1, $2, 'pendente', 'cartao', $3, $4, $5, $6) RETURNING id`,
        [empresaId, valorCobrar, dueDate, subscription.id, assinatura.tipo, novo_plano],
      );

      pagamentoResposta = {
        metodo: "cartao",
        valor: valorCobrar,
        init_point: subscription.init_point,
        pagamento_id: result.rows[0].id,
      }
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Método de pagamento inválido"
      })
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      upgrade: true,
      pagamento: pagamentoResposta,
    })
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao trocar plano:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar troca de plano",
      error: error.message,
    });
  } finally {
    client.release();
  }
}

export async function getAssinatura(req, res) {
  try {
    const empresaId = req.user.empresaId;
    const result = await pool.query(
      "SELECT plano, tipo, status, data_inicio, data_vencimento, plano_pendente FROM assinaturas WHERE empresa_id = $1",
      [empresaId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Assinatura não encontrada",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar assinatura",
      error: error.message,
    });
  }
}

export async function cancelarAssinatura(req, res) {
  try {
    const empresaId = req.user.empresaId;
    const { id } = req.params;

    if (parseInt(id) !== empresaId) {
      return res.status(403).json({ success: false, message: "Sem permissão" });
    }

    await pool.query(
      "UPDATE assinaturas SET status = 'cancelada' WHERE empresa_id = $1",
      [empresaId],
    );

    await logAudit(req.user.userId, "cancelar_assinatura", "assinaturas", empresaId, {}, req);

    res.json({ success: true, message: "Assinatura cancelada com sucesso" });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    res.status(500).json({ success: false, message: "Erro ao cancelar assinatura" });
  }
}