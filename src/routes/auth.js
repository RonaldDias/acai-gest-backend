import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const loginValidation = [
  body("email").isEmail().withMessage("Email inválido"),
  body("senha").notEmpty().withMessage("Senha é obrigatória"),
];

const cadastroValidation = [
  body("nome").notEmpty().withMessage("Nome é obrigatório"),
  body("cpf")
    .matches(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/)
    .withMessage("CPF inválido"),
  body("telefone")
    .matches(/^\(\d{2}\) \d{5}-\d{4}$/)
    .withMessage("Telefone inválido"),
  body("email").isEmail().withMessage("Email inválido"),
  body("senha")
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
    .withMessage(
      "Senha deve ter pelo menos 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial",
    ),
  body("confirmaSenha").custom((value, { req }) => {
    if (value !== req.body.senha) {
      throw new Error("Confirmação de senha não confere");
    }
    return true;
  }),

  body("nomeEmpresa")
    .optional()
    .notEmpty()
    .withMessage("Nome da empresa é obrigatório"),
  body("cnpj").optional().notEmpty().withMessage("CNPJ é obrigatório"),

  body("plano")
    .optional()
    .isIn(["basico", "premium", "enterprise"])
    .withMessage("Plano inválido"),

  body("formaPagamento")
    .optional()
    .isIn(["cartao", "boleto", "pix"])
    .withMessage("Forma de pagamento inválida"),
];

router.post("/login", loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: errors.array(),
      });
    }

    const { email, senha } = req.body;

    // TODO: Buscar usuário no banco de dados
    // const usuario = await Usuario.findOne({ email });
    // if (!usuario) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Email ou senha incorretos'
    //   });
    // }

    // TODO: Verificar senha
    // const senhaValida = await bcrypt.compare(senha, usuario.senha);
    // if (!senhaValida) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Email ou senha incorretos'
    //   });
    // }

    // TODO: Gerar JWT
    // const token = jwt.sign(
    //   { userId: usuario._id, email: usuario.email },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    // );

    if (email === "admin@acaigest.com" && senha === "123456") {
      res.json({
        success: true,
        message: "Login realizado com sucesso",
        user: {
          id: 1,
          nome: "Administrador",
          email: email,
        },
        token: "mock_jwt_token_here",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

router.post("/cadastro", cadastroValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: errors.array(),
      });
    }

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

    // TODO: Verificar se email já existe
    // const usuarioExistente = await Usuario.findOne({ email });
    // if (usuarioExistente) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'Email já cadastrado'
    //   });
    // }

    // TODO: Hash da senha
    // const senhaHash = await bcrypt.hash(senha, 12);

    // TODO: Salvar no banco
    // const novoUsuario = new Usuario({
    //   nome,
    //   cpf: cpf.replace(/\D/g, ''), // Remove formatação
    //   telefone,
    //   email,
    //   senha: senhaHash,
    //   empresa: {
    //     nome: nomeEmpresa,
    //     cnpj,
    //     endereco
    //   },
    //   plano,
    //   formaPagamento
    // });
    // await novoUsuario.save();

    // TODO: Gerar JWT
    // const token = jwt.sign(
    //   { userId: novoUsuario._id, email: novoUsuario.email },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    // );

    res.status(201).json({
      success: true,
      message: "Cadastro realizado com sucesso",
      user: {
        id: Date.now(),
        nome,
        email,
        cpf,
        telefone,
        empresa: {
          nome: nomeEmpresa,
          cnpj,
        },
        plano,
        createdAt: new Date(),
      },
      token: "mock_jwt_token_here",
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

router.get("/validate-email/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // TODO: Verificar no banco
    // const usuario = await Usuario.findOne({ email });

    const emailsExistentes = ["admin@acaigest.com", "teste@exemplo.com"];
    const exists = emailsExistentes.includes(email);

    res.json({
      success: true,
      exists,
      message: exists ? "Email já cadastrado" : "Email disponível",
    });
  } catch (error) {
    console.error("Erro na validação:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Email inválido")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Email inválido",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // TODO: Implementar recuperação de senha

      res.json({
        success: true,
        message:
          "Se o email existir, você receberá instruções para redefinir sua senha",
      });
    } catch (error) {
      console.error("Erro na recuperação:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  },
);

export default router;
