import pool from "../../config/database.js";
import { hashPassword, generateVendedorPassword } from "../../utils/auth.js";
import { cpfExists } from "../../utils/validators.js";

export const createVendedor = async (req, res) => {
  const client = await pool.connect();

  try {
    const { nome, cpf, pontoId } = req.body;
    const empresaId = req.user.empresaId;

    await client.query("BEGIN");

    const pontoResult = await client.query(
      "SELECT id FROM pontos WHERE id = $1 AND empresa_id = $2",
      [pontoId, empresaId],
    );

    if (pontoResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Ponto não encontrado ou não pertence à sua empresa",
      });
    }

    const cpfLimpo = cpf.replace(/\D/g, "");

    if (await cpfExists(cpf)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "CPF já cadastrado",
      });
    }

    const senhaTemporaria = generateVendedorPassword();
    const senhaHash = await hashPassword(senhaTemporaria);

    const result = await client.query(
      `INSERT INTO usuarios (empresa_id, ponto_id, nome, cpf, senha, role, ativo)
        VALUES ($1, $2, $3, $4, $5, 'vendedor', true)
        RETURNING id, nome, cpf, role, ponto_id, data_cadastro`,
      [empresaId, pontoId, nome, cpfLimpo, senhaHash],
    );

    await client.query("COMMIT");

    const vendedor = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Vendedor criado com sucesso",
      vendedor: {
        id: vendedor.id,
        nome: vendedor.nome,
        cpf: cpfLimpo,
        role: vendedor.role,
        pontoId: vendedor.ponto_id,
        createdAt: vendedor.data_cadastro,
      },
      senhaTemporaria,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  } finally {
    client.release();
  }
};

export const listVendedores = async (req, res) => {
  try {
    const { pontoId } = req.query;
    const empresaId = req.user.empresaId;

    let query = `
          SELECT u.id, u.nome, u.cpf, u.ponto_id, u.ativo, u.data_cadastro,
                 p.nome as ponto_nome
          FROM usuarios u
          INNER JOIN pontos p ON u.ponto_id = p.id
          WHERE u.empresa_id = $1 AND u.role = 'vendedor'
    `;
    const params = [empresaId];

    if (pontoId) {
      query += " AND u.ponto_id = $2";
      params.push(pontoId);
    }

    query += " ORDER BY u.nome";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      vendedores: result.rows,
    });
  } catch (error) {
    console.error("Erro ao listar vendedores:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

export const updateVendedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, ativo } = req.body;
    const empresaId = req.user.empresaId;

    const checkResult = await pool.query(
      "SELECT id FROM usuarios WHERE id = $1 AND empresa_id = $2 AND role = 'vendedor'",
      [id, empresaId],
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendedor não encontrado",
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nome !== undefined) {
      updates.push(`nome = $${paramCount}`);
      values.push(nome);
      paramCount++;
    }

    if (ativo !== undefined) {
      updates.push(`ativo = $${paramCount}`);
      values.push(ativo);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo para atualizar",
      });
    }

    values.push(id);
    const query = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, nome, ativo`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: "Vendedor atualizado com sucesso",
      vendedor: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

export const deleteVendedor = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresaId;

    const result = await pool.query(
      "UPDATE usuarios SET ativo = false WHERE id = $1 AND empresa_id = $2 AND role = 'vendedor' RETURNING id",
      [id, empresaId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendedor não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Vendedor desativado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao desativar vendedor:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};
