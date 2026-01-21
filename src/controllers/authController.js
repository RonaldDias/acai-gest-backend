import pool from "../config/database.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";

export const cadastrarUsuario = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      nome,
      cpf,
      telefone,
      email,
      senha,
      nomeEmpresa,
      cnpj,
      endereco,
      plano,
      formaPagamento,
    } = req.body;

    await client.query("BEGIN");

    const emailExistente = await client.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email],
    );

    if (emailExistente.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado",
      });
    }

    const cpfLimpo = cpf.replace(/\D/g, "");
    const cpfExistente = await client.query(
      "SELECT id FROM usuarios WHERE cpf = $1",
      [cpfLimpo],
    );

    if (cpfExistente.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "CPF já cadastrado",
      });
    }

    const senhaHash = await hashPassword(senha);

    const resultEmpresa = await client.query(
      `INSERT INTO empresas (nome, cnpj, endereco, plano, quantidade_pontos, forma_pagamento, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id`,
      [
        nomeEmpresa,
        cnpj,
        endereco,
        plano.toUpperCase() === "BASIC" ? "basico" : "top",
        plano.toUpperCase() === "BASIC" ? 1 : 2,
        formaPagamento,
      ],
    );

    const empresaId = resultEmpresa.rows[0].id;

    const resultPonto = await client.query(
      `INSERT INTO pontos (empresa_id, nome, endereco, ativo)
        VALUES ($1, $2, $3, true)
        RETURNING id`,
      [empresaId, `${nomeEmpresa} - Principal`, endereco],
    );

    const pontoId = resultPonto.rows[0].id;

    const resultUsuario = await client.query(
      `INSERT INTO usuarios (empresa_id, ponto_id, nome, cpf, email, senha, role, aceitou_termos, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, 'dono', true, true)
      RETURNING id, nome, email, cpf, role, data_cadastro`,
      [empresaId, pontoId, nome, cpfLimpo, email, senhaHash],
    );

    const usuario = resultUsuario.rows[0];

    await client.query("COMMIT");

    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
      empresaId: empresaId,
      pontoId: pontoId,
    });

    res.status(201).json({
      success: true,
      message: "Cadastro realizado com sucesso",
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: cpfLimpo,
        role: usuario.role,
        empresaId: empresaId,
        pontoId: pontoId,
        createdAt: usuario.data_cadastro,
      },
      token,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro no cadastro:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  } finally {
    client.release();
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const result = await pool.query(
      `SELECT u.id, u.nome, u.senha, u.role, u.empresa_id, u.ponto_id, u.ativo,
                e.nome as empresa_nome, e.plano, e.ativo as empresa_ativa
        FROM usuarios u
        INNER JOIN empresas e ON u.empresa_id = e.id
        WHERE u.email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }

    const usuario = result.rows[0];

    if (!usuario.ativo) {
      return res.status(401).json({
        success: false,
        message: "Usuário desativado. Entre em contato com o suporte.",
      });
    }

    if (!usuario.empresa_ativa) {
      return res.status(401).json({
        success: false,
        message: "Empresa desativada. Entre em contato com o suporte.",
      });
    }

    const senhaValida = await comparePassword(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }

    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
      empresaId: usuario.empresa_id,
      pontoId: usuario.ponto_id,
    });

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        empresaId: usuario.empresa_id,
        pontoId: usuario.ponto_id,
        empresa: {
          nome: usuario.empresa_nome,
          plano: usuario.plano,
        },
      },
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};
