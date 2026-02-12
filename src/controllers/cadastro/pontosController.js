import pool from "../../config/database.js";

export async function create(req, res) {
  const client = await pool.connect();

  try {
    const { nome, endereco, telefone } = req.body;
    const empresaId = req.user.empresaId;

    if (!nome) {
      return res.status(400).json({
        success: false,
        message: "Nome é obrigatório",
      });
    }

    const empresa = await client.query(
      "SELECT plano, quantidade_pontos FROM empresas WHERE id = $1",
      [empresaId],
    );

    if (empresa.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada",
      });
    }

    const { plano, quantidade_pontos } = empresa.rows[0];

    if (plano === "basico" && quantidade_pontos >= 1) {
      return res.status(400).json({
        success: false,
        message: "Plano BASIC permite apenas 1 ponto de venda",
      });
    }

    await client.query("BEGIN");

    const ponto = await client.query(
      `INSERT INTO pontos (empresa_id, nome, endereco, telefone)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
      [empresaId, nome, endereco || null, telefone || null],
    );

    if (plano === "top") {
      await client.query(
        "UPDATE empresas SET quantidade_pontos = quantidade_pontos + 1 WHERE id = $1",
        [empresaId],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Ponto criado com sucesso",
      data: ponto.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar ponto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar ponto",
      error: error.message,
    });
  } finally {
    client.release();
  }
}

export async function getAll(req, res) {
  try {
    const empresaId = req.user.empresaId;

    const result = await pool.query(
      `SELECT
          id,
          nome,
          endereco,
          telefone,
          ativo,
          data_cadastro
        FROM pontos
        WHERE empresa_id = $1 AND ativo = true
        ORDER BY nome ASC`,
      [empresaId],
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error("Erro ao buscar pontos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar pontos",
      error: error.message,
    });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { nome, endereco, telefone } = req.body;
    const empresaId = req.user.empresaId;

    const pontoExists = await pool.query(
      "SELECT id FROM pontos WHERE id = $1 AND empresa_id = $2",
      [id, empresaId],
    );

    if (pontoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    const result = await pool.query(
      `UPDATE pontos
       SET nome = COALESCE($1, nome),
           endereco = COALESCE($2, endereco),
           telefone = COALESCE($3, telefone)
       WHERE id = $4
       RETURNING *`,
      [nome, endereco, telefone, id],
    );

    res.json({
      success: true,
      message: "Ponto atualizado com sucesso",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar ponto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar ponto",
      error: error.message,
    });
  }
}

export async function deletePonto(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;

    const pontoExists = await client.query(
      "SELECT id FROM pontos WHERE id = $1 AND empresa_id = $2",
      [id, empresaId],
    );

    if (pontoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    await client.query("BEGIN");

    await client.query("UPDATE pontos SET ativo = false WHERE id = $1", [id]);

    await client.query(
      "UPDATE usuarios SET ativo = false WHERE ponto_id = $1",
      [id],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Ponto desativado com sucesso",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao desativar ponto:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao desativar ponto",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
