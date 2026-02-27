import { body, param } from "express-validator";

export const validateCreateProduct = [
  body("ponto_id")
    .isInt({ min: 1 })
    .withMessage("ponto_id deve ser um número válido"),
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isLength({ max: 255 })
    .withMessage("Nome muito longo"),
  body("tipo")
    .trim()
    .isIn(["grosso", "medio", "popular", "outro"])
    .withMessage("Tipo inválido"),
  body("unidade").trim().notEmpty().withMessage("Unidade é obrigatória"),
  body("preco")
    .isFloat({ min: 0.01 })
    .withMessage("Preço deve ser maior que zero"),
  body("quantidade_inicial")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Quantidade inicial deve ser maior ou igual a zero"),
];

export const validateUpdateProduct = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  body("nome")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nome não pode ser vazio")
    .isLength({ max: 255 })
    .withMessage("Nome muito longo"),
  body("preco")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Preço deve ser maior que zero"),
  body("estoque_minimo")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Estoque mínimo deve ser maior ou igual a zero"),
];

export const validateEntrada = [
  body("produto_id")
    .isInt({ min: 1 })
    .withMessage("produto_id deve ser um número válido"),
  body("quantidade")
    .isFloat({ min: 0.01 })
    .withMessage("Quantidade deve ser maior que zero"),
  body("custo")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Custo deve ser maior ou igual a zero"),
  body("observacao")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Observação muito longa"),
];

export const validateCreateSale = [
  body("ponto_id")
    .isInt({ min: 1 })
    .withMessage("ponto_id deve ser um número válido"),
  body("vendedor_id")
    .isInt({ min: 1 })
    .withMessage("vendedor_id deve ser um número válido"),
  body("forma_pagamento")
    .trim()
    .notEmpty()
    .withMessage("forma_pagamento é obrigatória"),
  body("itens")
    .isArray({ min: 1 })
    .withMessage("itens deve ser uma lista com pelo menos 1 item"),
  body("itens.*.produto_id")
    .isInt({ min: 1 })
    .withMessage("produto_id do item inválido"),
  body("itens.*.quantidade")
    .isFloat({ min: 0.01 })
    .withMessage("Quantidade do item deve ser maior que zero"),
  body("itens.*.preco_unitario")
    .isFloat({ min: 0.01 })
    .withMessage("Preço unitário deve ser maior que zero"),
];

export const validateCreatePonto = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isLength({ max: 255 })
    .withMessage("Nome muito longo"),
  body("endereco")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Endereço muito longo"),
  body("telefone")
    .optional()
    .trim()
    .matches(/^\(\d{2}\) \d{5}-\d{4}$/)
    .withMessage("Telefone inválido"),
];

export const validateUpdatePonto = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  body("nome")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nome não pode ser vazio")
    .isLength({ max: 255 })
    .withMessage("Nome muito longo"),
  body("endereco")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Endereço muito longo"),
  body("telefone")
    .optional()
    .trim()
    .matches(/^\(\d{2}\) \d{5}-\d{4}$/)
    .withMessage("Telefone inválido"),
];

export const validateCreateVendedor = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Nome é obrigatório")
    .isLength({ max: 255 })
    .withMessage("Nome muito longo"),
  body("cpf")
    .matches(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/)
    .withMessage("CPF inválido"),
  body("pontoId")
    .isInt({ min: 1 })
    .withMessage("pontoId deve ser um número válido"),
];

export const validateUpdateVendedor = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido"),
  body("nome")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nome não pode ser vazio")
    .isLength({ max: 255 })
    .withMessage("Nome muito longo"),
  body("ativo")
    .optional()
    .isBoolean()
    .withMessage("ativo deve ser true ou false"),
];
