import pool from "../config/database.js";

export async function getAll(req, res) {
  try {
    // TODO: Pegar empresa_id do token JWT
    const ponto_id = parseInt(req.query.ponto_id);

    if (!ponto_id || isNaN(ponto_id)) {
      return res.status(400).json({
        success: false,
        message: "ponto_id é obrigatório e deve ser um numero válido",
      });
    }

    const pontoExists = await pool.query(
      "SELECT id FROM pontos WHERE id = $1",
      [ponto_id]
    );

    if (pontoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    const result = await pool.query(
      `SELECT
        id,
        nome,
        unidade,
        estoque_atual,
        estoque_minimo,
        preco_venda,
        created_at,
        updated_at
      FROM produtos
      WHERE ponto_id = $1
      ORDER BY nome ASC`,
      [ponto_id]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar produtos",
      error: error.message,
    });
  }
}

export async function entrada(req, res) {
  console.log("🎯 ENTRADA CHAMADA!");
  console.log("Body:", req.body);
  console.log("Headers:", req.headers);

  const client = await pool.connect();

  try {
    const { produto_id, quantidade, custo, observacao } = req.body;
    console.log("Dados extraídos:", {
      produto_id,
      quantidade,
      custo,
      observacao,
    });

    if (!produto_id || !quantidade) {
      return res.status(400).json({
        success: false,
        message: "produto_id e a quantidade são obrigatórios",
      });
    }

    if (quantidade <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantidade deve ser maior que zero",
      });
    }

    const produtoExists = await client.query(
      "SELECT id FROM produtos WHERE id = $1",
      [produto_id]
    );

    if (produtoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Produto não encontrado",
      });
    }

    await client.query("BEGIN");

    const movimentacao = await client.query(
      `INSERT INTO movimentacoes_estoque
          (produto_id, tipo, quantidade, custo, observacao)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
      [produto_id, "entrada", quantidade, custo || null, observacao || null]
    );

    const produtoAtualizado = await client.query(
      `UPDATE produtos
      SET estoque_atual = estoque_atual + $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [quantidade, produto_id]
    );

    if (produtoAtualizado.rowCount === 0) {
      throw new Error("Produto não encontrado");
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Entrada registrada com sucesso",
      data: {
        movimentacao: movimentacao.rows[0],
        produto: produtoAtualizado.rows[0],
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao registrar entrada:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar entrada de estoque",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
