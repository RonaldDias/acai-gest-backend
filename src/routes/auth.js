import express from "express";
import { body, validationResult } from "express-validator";
import {
  cadastrarUsuario,
  loginUsuario,
  forgotPassword,
  resetPassword,
  getUsuarioStatus,
} from "../controllers/cadastro/authController.js";
import { refreshAccessToken } from "../controllers/refreshController.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const loginValidation = [
  body("login").isEmail().withMessage("Email ou CPF é obrigatório"),
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

router.post("/login", loginLimiter, loginValidation, loginUsuario);

router.post("/cadastro", cadastroValidation, cadastrarUsuario);

router.post("/refresh", refreshAccessToken);

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
  "/esqueci-senha",
  [body("email").isEmail().withMessage("Email inválido")],
  forgotPassword,
);

router.post(
  "/redefinir-senha",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("token").isLength({ min: 6, max: 6 }).withMessage("Token inválido"),
    body("novaSenha")
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage(
        "Senha deve ter pelo menos 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial",
      ),
  ],
  resetPassword,
);

router.get("/usuarios/:empresaId/status", getUsuarioStatus);

export default router;
