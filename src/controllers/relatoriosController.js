import pool from "../config/database.js";

export async function vendas(req, res) {
  try {
    const pontoId = parseInt(req.query.ponto_id);
    const empresaId = req.user.empresaId;
    const { data_inicio, data_fim, agrupar } = req.query;

    if (!pontoId || isNaN(pontoId)) {
      return res.status(400).json({
        success: false,
        message: "ponto_id é obrigatório e deve ser um número válido",
      });
    }

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        message: "ponto_id é obrigatório e deve ser um número válido",
      });
    }

    if (!["dia", "semana", "mes"].includes(agrupar)) {
      return res.status(400).json({
        success: false,
        message: "agrupar é obrigatório e deve ser dia, semana ou mês",
      });
    }

    const pontoExists = await pool.query(
      "SELECT id FROM pontos WHERE id = $1 AND empresa_id = $2",
      [pontoId, empresaId],
    );

    if (pontoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    const agrupamentos = {
      dia: "DATE(data_venda)",
      semana: "DATE_TRUNC('week', data_venda)",
      mes: "DATE_TRUNC('month', data_venda)",
    };

    const result = await pool.query(
      `SELECT
        ${agrupamentos[agrupar]} AS periodo,
        COUNT(*) AS total_vendas,
        COALESCE(SUM(valor_total), 0)::numeric AS valor_total,
        SUM(iv.quantidade)::numeric AS total_quantidade
       FROM vendas v
       INNER JOIN itens_venda iv ON v.id = iv.venda_id
       WHERE v.ponto_id = $1
        AND v.status = 'ativa'
        AND v.data_venda BETWEEN $2 AND $3
       GROUP BY periodo
       ORDER BY periodo DESC`,
      [pontoId, data_inicio, data_fim],
    );

    const totais = await pool.query(
      `SELECT
          COUNT(*) AS total_vendas,
          SUM(valor_total)::numeric AS valor_total
        FROM vendas
        WHERE ponto_id = $1
          AND status = 'ativa'
          AND data_venda BETWEEN $2 AND $3`,
      [pontoId, data_inicio, data_fim],
    );

    res.json({
      success: true,
      data: result.rows,
      totais: {
        total_vendas: parseInt(totais.rows[0].total_vendas),
        valor_total: parseFloat(totais.rows[0].valor_total),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar relatório de vendas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar relatório de vendas",
      error: error.message,
    });
  }
}

export async function cashFlow(req, res) {
  try {
    const pontoId = parseInt(req.query.ponto_id);
    const empresaId = req.user.empresaId;
    const { data_inicio, data_fim } = req.query;

    if (!pontoId || isNaN(pontoId)) {
      return res.status(400).json({
        success: false,
        message: "ponto_id é obrigatório e deve ser um número válido",
      });
    }

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        success: false,
        message: "data_inicio e data_fim são obrigatórios",
      });
    }

    const pontoExists = await pool.query(
      "SELECT id FROM pontos WHERE id = $1 AND empresa_id = $2",
      [pontoId, empresaId],
    );

    if (pontoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    const records = await pool.query(
      `SELECT
        id,
        tipo,
        categoria,
        valor::numeric AS valor,
        referencia_tabela,
        referencia_id,
        data
      FROM fluxo_caixa
      WHERE ponto_id = $1
        AND data BETWEEN $2 AND $3
      ORDER BY data DESC`,
      [pontoId, data_inicio, data_fim],
    );

    const summary = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)::numeric AS revenues,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)::numeric AS expenses
      FROM fluxo_caixa
      WHERE ponto_id = $1
        AND data BETWEEN $2 AND $3`,
      [pontoId, data_inicio, data_fim],
    );

    const revenues = parseFloat(summary.rows[0].revenues);
    const expenses = parseFloat(summary.rows[0].expenses);

    res.json({
      success: true,
      data: records.rows,
      summary: {
        revenues,
        expenses,
        balance: revenues - expenses,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar fluxo de caixa:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar fluxo de caixa",
      error: error.message,
    });
  }
}
