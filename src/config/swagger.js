import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Açaí Gest API",
      version: "1.0.0",
      description:
        "Documentação da API do sistema de gestão para pontos de venda de açaí.",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Desenvolvimento",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Mensagem de erro" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Operação realizada com sucesso",
            },
            data: { type: "object" },
          },
        },
      },
    },
    paths: {
      "/api/auth/cadastro": {
        post: {
          tags: ["Autenticação"],
          summary: "Cadastrar novo usuário e empresa",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "nome",
                    "cpf",
                    "telefone",
                    "email",
                    "senha",
                    "confirmaSenha",
                  ],
                  properties: {
                    nome: { type: "string", example: "João Silva" },
                    cpf: { type: "string", example: "123.456.789-00" },
                    telefone: { type: "string", example: "(11) 99999-9999" },
                    email: { type: "string", example: "joao@email.com" },
                    senha: { type: "string", example: "Senha@123" },
                    confirmaSenha: { type: "string", example: "Senha@123" },
                    nomeEmpresa: { type: "string", example: "Açaí do João" },
                    cnpj: { type: "string", example: "12.345.678/0001-90" },
                    plano: { type: "string", enum: ["basico", "top"] },
                    formaPagamento: { type: "string", enum: ["cartao", "pix"] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Usuário cadastrado com sucesso" },
            400: { description: "Dados inválidos" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Autenticação"],
          summary: "Login com email ou CPF",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["login", "senha"],
                  properties: {
                    login: { type: "string", example: "joao@email.com" },
                    senha: { type: "string", example: "Senha@123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login realizado com sucesso" },
            401: { description: "Credenciais inválidas" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Autenticação"],
          summary: "Renovar access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: {
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Token renovado com sucesso" },
            401: { description: "Refresh token inválido" },
          },
        },
      },
      "/api/auth/esqueci-senha": {
        post: {
          tags: ["Autenticação"],
          summary: "Solicitar redefinição de senha",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", example: "joao@email.com" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Email de redefinição enviado" },
          },
        },
      },
      "/api/auth/redefinir-senha": {
        post: {
          tags: ["Autenticação"],
          summary: "Redefinir senha com token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "token", "novaSenha"],
                  properties: {
                    email: { type: "string", example: "joao@email.com" },
                    token: { type: "string", example: "123456" },
                    novaSenha: { type: "string", example: "NovaSenha@123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Senha redefinida com sucesso" },
            400: { description: "Token inválido ou expirado" },
          },
        },
      },
      "/api/auth/usuarios/{empresaId}/status": {
        get: {
          tags: ["Autenticação"],
          summary: "Verificar status dos usuários de uma empresa",
          parameters: [
            {
              name: "empresaId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Status retornado com sucesso" },
          },
        },
      },
      "/api/products": {
        get: {
          tags: ["Produtos"],
          summary: "Listar todos os produtos",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Lista de produtos" },
            401: { description: "Não autenticado" },
          },
        },
        post: {
          tags: ["Produtos"],
          summary: "Criar produto",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nome", "tipo", "preco"],
                  properties: {
                    nome: { type: "string", example: "Açaí 500ml" },
                    tipo: {
                      type: "string",
                      enum: ["grosso", "medio", "popular", "outro"],
                    },
                    preco: { type: "number", example: 15.9 },
                    quantidade_estoque: { type: "integer", example: 100 },
                    estoque_minimo: { type: "integer", example: 10 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Produto criado com sucesso" },
            400: { description: "Dados inválidos" },
          },
        },
      },
      "/api/products/{id}": {
        put: {
          tags: ["Produtos"],
          summary: "Atualizar produto",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nome: { type: "string" },
                    preco: { type: "number" },
                    estoque_minimo: { type: "integer" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Produto atualizado" },
            404: { description: "Produto não encontrado" },
          },
        },
        delete: {
          tags: ["Produtos"],
          summary: "Deletar produto",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Produto deletado" },
            404: { description: "Produto não encontrado" },
          },
        },
      },
      "/api/products/entrada": {
        post: {
          tags: ["Produtos"],
          summary: "Registrar entrada de estoque",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["produto_id", "quantidade"],
                  properties: {
                    produto_id: { type: "integer", example: 1 },
                    quantidade: { type: "integer", example: 50 },
                    observacao: {
                      type: "string",
                      example: "Reposição semanal",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Entrada registrada" },
          },
        },
      },
      "/api/products/{id}/movimentacoes": {
        get: {
          tags: ["Produtos"],
          summary: "Listar movimentações de estoque de um produto",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Lista de movimentações" },
          },
        },
      },
      "/api/sales": {
        post: {
          tags: ["Vendas"],
          summary: "Registrar venda",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["itens"],
                  properties: {
                    itens: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          produto_id: { type: "integer", example: 1 },
                          quantidade: { type: "integer", example: 2 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Venda registrada" },
            400: { description: "Dados inválidos" },
          },
        },
      },
      "/api/sales/today": {
        get: {
          tags: ["Vendas"],
          summary: "Listar vendas do dia",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Lista de vendas do dia" },
          },
        },
      },
      "/api/sales/summary/today": {
        get: {
          tags: ["Vendas"],
          summary: "Resumo das vendas do dia",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Resumo do dia" },
          },
        },
      },
      "/api/sales/{id}/cancel": {
        post: {
          tags: ["Vendas"],
          summary: "Cancelar venda",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Venda cancelada" },
            404: { description: "Venda não encontrada" },
          },
        },
      },
      "/api/vendedores": {
        post: {
          tags: ["Vendedores"],
          summary: "Criar vendedor",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nome", "cpf", "email", "senha"],
                  properties: {
                    nome: { type: "string", example: "Maria Silva" },
                    cpf: { type: "string", example: "987.654.321-00" },
                    email: { type: "string", example: "maria@email.com" },
                    senha: { type: "string", example: "Senha@123" },
                    ponto_id: { type: "integer", example: 1 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Vendedor criado" },
          },
        },
        get: {
          tags: ["Vendedores"],
          summary: "Listar vendedores",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Lista de vendedores" },
          },
        },
      },
      "/api/vendedores/{id}": {
        put: {
          tags: ["Vendedores"],
          summary: "Atualizar vendedor",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Vendedor atualizado" },
          },
        },
        delete: {
          tags: ["Vendedores"],
          summary: "Deletar vendedor",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Vendedor deletado" },
          },
        },
      },
      "/api/pontos": {
        post: {
          tags: ["Pontos de Venda"],
          summary: "Criar ponto de venda",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nome"],
                  properties: {
                    nome: { type: "string", example: "Ponto Centro" },
                    endereco: {
                      type: "string",
                      example: "Rua das Flores, 123",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Ponto criado" },
          },
        },
        get: {
          tags: ["Pontos de Venda"],
          summary: "Listar pontos de venda",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Lista de pontos" },
          },
        },
      },
      "/api/pontos/{id}": {
        put: {
          tags: ["Pontos de Venda"],
          summary: "Atualizar ponto de venda",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Ponto atualizado" },
          },
        },
        delete: {
          tags: ["Pontos de Venda"],
          summary: "Deletar ponto de venda",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Ponto deletado" },
          },
        },
      },
      "/api/empresas/{id}/plano": {
        patch: {
          tags: ["Empresas"],
          summary: "Atualizar plano da empresa",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["plano"],
                  properties: {
                    plano: { type: "string", enum: ["basico", "top"] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Plano atualizado" },
          },
        },
      },
      "/api/pagamentos/pix": {
        post: {
          tags: ["Pagamentos"],
          summary: "Gerar pagamento PIX",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["empresaId", "plano", "tipoAssinatura"],
                  properties: {
                    empresaId: { type: "integer", example: 1 },
                    plano: { type: "string", enum: ["basico", "top"] },
                    tipoAssinatura: {
                      type: "string",
                      enum: ["mensal", "anual"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "QR Code PIX gerado" },
          },
        },
      },
      "/api/pagamentos/cartao": {
        post: {
          tags: ["Pagamentos"],
          summary: "Gerar pagamento por cartão",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["empresaId", "plano", "tipoAssinatura"],
                  properties: {
                    empresaId: { type: "integer", example: 1 },
                    plano: { type: "string", enum: ["basico", "top"] },
                    tipoAssinatura: {
                      type: "string",
                      enum: ["mensal", "anual"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Link de pagamento gerado" },
          },
        },
      },
      "/api/webhooks/mercadopago": {
        post: {
          tags: ["Webhooks"],
          summary: "Webhook do Mercado Pago",
          responses: {
            200: { description: "Webhook processado" },
          },
        },
      },
      "/api/relatorios/vendas": {
        get: {
          tags: ["Relatórios"],
          summary: "Relatório de vendas por período",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "dataInicio",
              in: "query",
              schema: { type: "string", example: "2026-01-01" },
            },
            {
              name: "dataFim",
              in: "query",
              schema: { type: "string", example: "2026-01-31" },
            },
          ],
          responses: {
            200: { description: "Relatório de vendas" },
          },
        },
      },
      "/api/relatorios/fluxo-caixa": {
        get: {
          tags: ["Relatórios"],
          summary: "Relatório de fluxo de caixa",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "dataInicio",
              in: "query",
              schema: { type: "string", example: "2026-01-01" },
            },
            {
              name: "dataFim",
              in: "query",
              schema: { type: "string", example: "2026-01-31" },
            },
          ],
          responses: {
            200: { description: "Fluxo de caixa" },
          },
        },
      },
      "/api/audit-logs": {
        get: {
          tags: ["Auditoria"],
          summary: "Listar logs de auditoria",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Lista de logs" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
