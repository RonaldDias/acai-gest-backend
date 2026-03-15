import pool from "../../config/database.js";

export async function create(req, res) {
  try {
    const { ponto_id, categoria, descricao, valor, data } = req.body;
    const empresaId = req.user.empresaId;

    const pontoExists = await pool.query(
      "SELECT id FROM pontos WHERE id = $1 AND empresa_id = $2",
      [ponto_id, empresaId],
    );

    if (pontoExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ponto não encontrado",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const despesa = await client.query(
        `INSERT INTO despesas (ponto_id, categoria, descricao, valor, data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [ponto_id, categoria, descricao, valor, data || new Date()],
      );

      await client.query(
        `INSERT INTO fluxo_caixa (ponto_id, tipo, categoria, valor, referencia_tabela, referencia_id, data)
        VALUES ($1, 'despesa', $2, $3, 'despesas', $4, $5)`,
        [ponto_id, categoria, valor, despesa.rows[0].id, data || new Date()],
      );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        data: despesa.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao registrar despesa:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar despesa",
    });
  }
}
