import pool from "../config/database.js";

export async function updatePlan(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { plano } = req.body;
    const empresaId = req.user.empresaId;

    if (parseInt(id) !== empresaId) {
      return res.status(403).json({
        success: false,
        message: "Você não tem permissão para alterar esta empresa",
      });
    }

    if (!["basico", "top"].includes(plano)) {
      return res.status(400).json({
        success: false,
        message: "Plano deve ser 'basico' ou 'top'",
      });
    }

    const empresa = await client.query(
      "SELECT plano FROM empresas WHERE id = $1",
      [empresaId],
    );

    if (empresa.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Empresa não encontrada",
      });
    }

    const planoAtual = empresa.rows[0].plano;

    const pontosAtivos = await client.query(
      "SELECT COUNT(*) as total FROM  pontos WHERE empresa_id = $1 AND ativo = true",
      [empresaId],
    );

    const quantidadePontos = parseInt(pontosAtivos.rows[0].total);

    if (planoAtual === plano) {
      return res.status(400).json({
        success: false,
        message: `Empresa já está no plano ${plano}`,
      });
    }

    if (plano === "basico" && quantidadePontos > 1) {
      return res.status(400).json({
        success: false,
        message:
          "Não é possível mudar para plano BASIC com mais de 1 ponto ativo. Desative os pontos extras primeiro.",
      });
    }

    await client.query("BEGIN");

    await client.query(
      "UPDATE empresas SET plano = $1, quantidade_pontos = $2 WHERE id = $3",
      [plano, quantidadePontos, empresaId],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Plano alterado para ${plano.toUpperCase()} com sucesso`,
      data: {
        plano,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao atualizar plano:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar plano",
      error: error.message,
    });
  } finally {
    client.release();
  }
}
