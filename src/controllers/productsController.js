import pool from "../config/database.js";

export async function getAll(req, res) {
  try {
    const empresaId = req.user.empresaId;
    const pontoId = parseInt(req.query.ponto_id);

    if (!pontoId || isNaN(pontoId)) {
      return res.status(400).json({
        success: false,
        message: "ponto_id é obrigatório e deve ser um numero válido",
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

    const result = await pool.query(
      `SELECT
        id,
        nome,
        tipo,
        unidade,
        quantidade_estoque,
        estoque_minimo,
        preco:: numeric AS preco,
        ativo,
        data_cadastro
      FROM produtos
      WHERE ponto_id = $1 AND ativo = true
      ORDER BY nome ASC`,
      [pontoId],
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
  const client = await pool.connect();

  try {
    const { produto_id, quantidade, custo, observacao } = req.body;
    const empresaId = req.user.empresaId;

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
      `SELECT p.id
      FROM produtos p
      INNER JOIN pontos pt ON p.ponto_id = pt.id
      WHERE p.id = $1 AND pt.empresa_id = $2`,
      [produto_id, empresaId],
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
      [produto_id, "entrada", quantidade, custo || null, observacao || null],
    );

    const produtoAtualizado = await client.query(
      `UPDATE produtos
      SET quantidade_estoque = quantidade_estoque + $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [quantidade, produto_id],
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

export async function createProduct(req, res) {
  const client = await pool.connect();

  try {
    const { ponto_id, nome, tipo, unidade, preco, quantidade_inicial } =
      req.body;
    const empresaId = req.user.empresaId;

    const pontoExists = await client.query(
      "SELECT id FROM pontos WHERE id = $1 AND empresa_id = $2",
      [ponto_id, empresaId],
    );

    if (pontoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    await client.query("BEGIN");

    const produto = await client.query(
      `INSERT INTO produtos
      (ponto_id, nome, tipo, unidade, preco, quantidade_estoque, estoque_minimo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [ponto_id, nome, tipo, unidade, preco, quantidade_inicial || 0, 0],
    );

    if (quantidade_inicial > 0) {
      await client.query(
        `INSERT INTO movimentacoes_estoque
        (produto_id, tipo, quantidade, observacao)
        VALUES ($1, 'entrada', $2, 'Estoque inicial')`,
        [produto.rows[0].id, quantidade_inicial],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Produto criado com sucesso",
      data: produto.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar produto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar produto",
      error: error.message,
    });
  } finally {
    client.release();
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { nome, preco, estoque_minimo } = req.body;
    const empresaId = req.user.empresaId;

    const produtoExists = await pool.query(
      `SELECT p.id 
       FROM produtos p
       INNER JOIN pontos pt ON p.ponto_id = pt.id
       WHERE p.id = $1 AND pt.empresa_id = $2`,
      [id, empresaId],
    );

    if (produtoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Produto não encontrado",
      });
    }

    const result = await pool.query(
      `UPDATE produtos 
       SET nome = COALESCE($1, nome),
           preco = COALESCE($2, preco),
           estoque_minimo = COALESCE($3, estoque_minimo)
       WHERE id = $4
       RETURNING *`,
      [nome, preco, estoque_minimo, id],
    );

    res.json({
      success: true,
      message: "Produto atualizado com sucesso",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar produto",
      error: error.message,
    });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;

    const produtoExists = await pool.query(
      `SELECT p.id 
       FROM produtos p
       INNER JOIN pontos pt ON p.ponto_id = pt.id
       WHERE p.id = $1 AND pt.empresa_id = $2`,
      [id, empresaId],
    );

    if (produtoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Produto não encontrado",
      });
    }

    await pool.query("UPDATE produtos SET ativo = false WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Produto desativado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao desativar produto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao desativar produto",
      error: error.message,
    });
  }
}
