import express from "express";
import { body, validationResult } from "express-validator";
import {
  cadastrarUsuario,
  loginUsuario,
} from "../controllers/authController.js";

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

router.post("/login", loginValidation, loginUsuario);

router.post("/cadastro", cadastroValidation, cadastrarUsuario);

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
