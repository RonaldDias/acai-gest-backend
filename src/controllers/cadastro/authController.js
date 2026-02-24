import pool from "../../config/database.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  generatePasswordResetToken,
  getPasswordResetTokenExpiry,
} from "../../utils/auth.js";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../../services/emailService.js";
import { cpfExists, emailExists } from "../../utils/validators.js";
import {
  generatePixPayment,
  createRecurringSubscription,
  createCheckoutPreference,
} from "../../services/pagamentoService.js";

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
      quantidadePontos,
      formaPagamento,
      tipoAssinatura,
    } = req.body;

    await client.query("BEGIN");

    if (await emailExists(email)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado",
      });
    }

    if (await cpfExists(cpf)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "CPF já cadastrado",
      });
    }

    if (quantidadePontos >= 2 && plano.toLowerCase() === "basico") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Plano BASIC permite apenas 1 ponto de venda",
      });
    }

    const cpfLimpo = cpf.replace(/\D/g, "");
    const senhaHash = await hashPassword(senha);

    const resultEmpresa = await client.query(
      `INSERT INTO empresas (nome, cnpj, telefone, email, endereco, plano, quantidade_pontos, forma_pagamento, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
        RETURNING id`,
      [
        nomeEmpresa,
        cnpj,
        telefone,
        email,
        endereco,
        plano.toLowerCase(),
        quantidadePontos,
        formaPagamento,
      ],
    );

    const empresaId = resultEmpresa.rows[0].id;

    const pontos = [];
    for (let i = 0; i < quantidadePontos; i++) {
      const resultPonto = await client.query(
        `INSERT INTO pontos (empresa_id, nome, endereco, ativo)
        VALUES ($1, $2, $3, false)
        RETURNING id`,
        [empresaId, nomeEmpresa, endereco],
      );
      pontos.push(resultPonto.rows[0].id);
    }

    const pontoId = pontos[0];

    const resultUsuario = await client.query(
      `INSERT INTO usuarios (empresa_id, ponto_id, nome, cpf, email, senha, role, aceitou_termos, ativo)
      VALUES ($1, $2, $3, $4, $5, $6, 'dono', true, false)
      RETURNING id, nome, email, cpf, role, data_cadastro`,
      [empresaId, pontoId, nome, cpfLimpo, email, senhaHash],
    );

    const usuario = resultUsuario.rows[0];

    if (formaPagamento === "CARTAO") {
      const valores = {
        basico: { mensal: 149.9, anual: 1619.1 },
        top: { mensal: 249.9, anual: 2699.1 },
      };

      if (tipoAssinatura === "mensal") {
        const valor = valores[plano.toLowerCase()]?.mensal;

        const subscription = await createRecurringSubscription(
          email,
          plano,
          valor,
        );

        await client.query("COMMIT");

        return res.status(201).json({
          success: true,
          message: "Assinatura criada. Complete o pagamento.",
          user: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            empresaId: empresaId,
          },
          init_point: subscription.init_point,
        });
      } else if (tipoAssinatura === "anual") {
        const valor = valores[plano.toLowerCase()]?.anual;

        const checkout = await createCheckoutPreference(email, plano, valor);

        await client.query("COMMIT");

        return res.status(201).json({
          success: true,
          message: "Checkout criado. Complete o pagamento.",
          user: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            empresaId: empresaId,
          },
          init_point: checkout.init_point,
        });
      }
    }

    const valores = {
      basico: { mensal: 149.9, anual: 1619.1 },
      top: { mensal: 249.9, anual: 2699.1 },
    };

    const valor = valores[plano.toLowerCase()]?.[tipoAssinatura];

    if (!valor) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Plano ou tipo de assinatura inválido",
      });
    }

    const descricao = `Assinatura ${tipoAssinatura} - Plano ${plano.toUpperCase()} - ${nomeEmpresa}`;

    const mercadoPagoPayment = await generatePixPayment(
      valor,
      descricao,
      email,
    );

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const paymentResult = await client.query(
      `INSERT INTO pagamentos (empresa_id, valor, status, metodo_pagamento, 
        data_vencimento, qr_code, qr_code_base64, payment_id, tipo_assinatura)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        empresaId,
        valor,
        "pendente",
        "pix",
        dueDate,
        mercadoPagoPayment.qr_code,
        mercadoPagoPayment.qr_code_base64,
        mercadoPagoPayment.id,
        tipoAssinatura,
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Cadastro criado. Aguardando pagamento.",
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        empresaId: empresaId,
      },
      pagamento: {
        id: paymentResult.rows[0].id,
        valor,
        qr_code: mercadoPagoPayment.qr_code,
        qr_code_base64: mercadoPagoPayment.qr_code_base64,
        ticket_url: mercadoPagoPayment.ticket_url,
      },
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
    const { login, senha } = req.body;

    const isEmail = login.includes("@");

    const result = await pool.query(
      `SELECT u.id, u.nome, u.senha, u.role, u.empresa_id, u.ponto_id, u.ativo, u.email,
                e.nome as empresa_nome, e.plano, e.ativo as empresa_ativa
        FROM usuarios u
        INNER JOIN empresas e ON u.empresa_id = e.id
        WHERE ${isEmail ? "u.email" : "u.cpf"} = $1`,
      [login],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciais incorretas",
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

    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)`,
      [usuario.id, refreshToken, refreshTokenExpiry],
    );

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
      refreshToken,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      "SELECT id, nome, email FROM usuarios WHERE email = $1 AND ativo = true",
      [email],
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message:
          "Se o email existir, você receberá instruções para redefinir sua senha",
      });
    }

    const usuario = result.rows[0];
    const resetToken = generatePasswordResetToken();
    const resetTokenExpiry = getPasswordResetTokenExpiry();

    await pool.query(
      "UPDATE usuarios SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [resetToken, resetTokenExpiry, usuario.id],
    );

    try {
      await sendPasswordResetEmail(usuario.nome, usuario.email, resetToken);
    } catch (emailError) {
      console.error("Erro ao enviar email de recuperação:", emailError);
    }

    res.json({
      success: true,
      message:
        "Se o email existir, você receberá instruções para redefinir sua senha",
    });
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};

export const resetPassword = async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, token, novaSenha } = req.body;

    await client.query("BEGIN");

    const result = await client.query(
      "SELECT id, nome, reset_token, reset_token_expires FROM usuarios WHERE email = $1 AND ativo = true",
      [email],
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    const usuario = result.rows[0];

    if (!usuario.reset_token || usuario.reset_token !== token) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    if (new Date() > new Date(usuario.reset_token_expires)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    const senhaHash = await hashPassword(novaSenha);

    await client.query(
      "UPDATE usuarios SET senha = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [senhaHash, usuario.id],
    );

    await client.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
      usuario.id,
    ]);

    const nomeUsuario = result.rows[0].nome || "Usuário";

    await client.query("COMMIT");

    try {
      await sendPasswordChangedEmail(nomeUsuario, email);
    } catch (emailError) {
      console.error("Erro ao enviar email de confirmação:", emailError);
    }

    res.json({
      success: true,
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  } finally {
    client.release();
  }
};

export const getUsuarioStatus = async (req, res) => {
  try {
    const { empresaId } = req.params;

    const result = await pool.query(
      "SELECT ativo FROM usuarios WHERE empresa_id = $1 AND role = 'dono' LIMIT 1",
      [empresaId],
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, ativo: false });
    }

    res.json({ success: true, ativo: result.rows[0].ativo });
  } catch (error) {
    console.error("Erro ao buscar status:", error);
    res.status(500).json({ success: false, ativo: false });
  }
};
