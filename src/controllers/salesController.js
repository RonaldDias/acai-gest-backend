import pool from "../config/database.js";

export async function create(req, res) {
  const client = await pool.connect();

  try {
    const { ponto_id, vendedor_id, itens, forma_pagamento } = req.body;

    if (
      !ponto_id ||
      !vendedor_id ||
      !itens ||
      !Array.isArray(itens) ||
      itens.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "ponto_id, vendedor_id e itens são obrigatórios",
      });
    }

    if (!forma_pagamento) {
      return res.status(400).json({
        success: false,
        message: "forma_pagamento é obrigatória",
      });
    }

    await client.query("BEGIN");

    let total = 0;
    for (const item of itens) {
      total += item.quantidade * item.preco_unitario;
    }

    const vendaResult = await client.query(
      `INSERT INTO vendas (ponto_id, vendedor_id, valor_total, forma_pagamento)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
      [ponto_id, vendedor_id, total, forma_pagamento],
    );

    const venda = vendaResult.rows[0];

    const itensVenda = [];

    for (const item of itens) {
      const itemResult = await client.query(
        `INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
        [
          venda.id,
          item.produto_id,
          item.quantidade,
          item.preco_unitario,
          item.quantidade * item.preco_unitario,
        ],
      );

      itensVenda.push(itemResult.rows[0]);

      await client.query(
        `INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, observacao)
        VALUES ($1, $2, $3, $4)`,
        [item.produto_id, "saida", item.quantidade, `Venda #${venda.id}`],
      );

      const estoqueResult = await client.query(
        `UPDATE produtos
        SET quantidade_estoque = quantidade_estoque - $1
        WHERE id = $2 AND ponto_id = $3
        RETURNING quantidade_estoque`,
        [item.quantidade, item.produto_id, ponto_id],
      );

      if (estoqueResult.rowCount === 0) {
        throw new Error(
          `Produto ${item.produto_id} não encontrado ou estoque insuficiente`,
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Venda registrada com sucesso!",
      data: {
        venda,
        itens: itensVenda,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar venda:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao registrar venda",
    });
  } finally {
    client.release();
  }
}

export async function today(req, res) {
  try {
    const pontoId = parseInt(req.query.ponto_id);

    if (!pontoId || isNaN(pontoId)) {
      return res.status(400).json({
        success: false,
        message: "ponto_id é obrigatório",
      });
    }

    const result = await pool.query(
      `SELECT
        v.id,
        v.valor_total,
        v.forma_pagamento,
        v.data_venda,
        u.nome as vendedor_nome,
        json_agg(
          json_build_object(
            'produto_id', iv.produto_id,
            'produto_nome', p.nome,
            'quantidade', iv.quantidade,
            'preco_unitario', iv.preco_unitario,
            'subtotal', iv.subtotal
          )
        ) as itens
       FROM vendas v
       INNER JOIN usuarios u ON v.vendedor_id = u.id
       INNER JOIN itens_venda iv ON v.id = iv.venda_id
       INNER JOIN produtos p ON iv.produto_id = p.id
       WHERE v.ponto_id = $1
         AND DATE(v.data_venda) = CURRENT_DATE
       GROUP BY v.id, u.nome
       ORDER BY v.data_venda DESC`,
      [pontoId],
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar vendas de hoje:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar vendas",
    });
  }
}

export async function summaryToday(req, res) {
  try {
    const pontoId = parseInt(req.query.ponto_id);

    if (!pontoId || isNaN(pontoId)) {
      return res.status(400).json({
        success: false,
        message: "ponto_id é obrigatório",
      });
    }

    const result = await pool.query(
      `SELECT
          COUNT(*) as total_vendas,
          COALESCE(SUM(valor_total), 0) as total_faturado
        FROM vendas
        WHERE ponto_id = $1
          AND DATE(data_venda) = CURRENT_DATE`,
      [pontoId],
    );

    res.json({
      success: true,
      data: {
        total_vendas: parseInt(result.rows[0].total_vendas),
        total_faturado: parseFloat(result.rows[0].total_faturado),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar resumo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar resumo",
    });
  }
}
