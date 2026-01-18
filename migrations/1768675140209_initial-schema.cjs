exports.up = (pgm) => {
  pgm.createTable("empresas", {
    id: "id",
    nome: { type: "varchar(255)", notNull: true },
    cnpj: { type: "varchar(18)", notNull: true, unique: true },
    telefone: { type: "varchar(20)" },
    email: { type: "varchar(255)" },
    plano: {
      type: "varchar(10)",
      notNull: true,
      check: "plano IN ('basico', 'top')",
    },
    quantidade_pontos: { type: "integer", default: 1 },
    data_cadastro: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
    ativo: { type: "boolean", default: true },
  });

  pgm.addConstraint("empresas", "check_plano_pontos", {
    check:
      "(plano = 'basico' AND quantidade_pontos = 1) OR (plano = 'top' AND quantidade_pontos >= 2)",
  });

  pgm.createTable("pontos", {
    id: "id",
    empresa_id: {
      type: "integer",
      notNull: true,
      references: "empresas",
      onDelete: "CASCADE",
    },
    nome: { type: "varchar(255)", notNull: true },
    endereco: { type: "text" },
    telefone: { type: "varchar(20)" },
    ativo: { type: "boolean", default: true },
    data_cadastro: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("usuarios", {
    id: "id",
    empresa_id: {
      type: "integer",
      notNull: true,
      references: "empresas",
      onDelete: "CASCADE",
    },
    ponto_id: {
      type: "integer",
      references: "pontos",
      onDelete: "SET NULL",
    },
    nome: { type: "varchar(255)", notNull: true },
    cpf: { type: "varchar(14)", notNull: true, unique: true },
    email: { type: "varchar(255)" },
    senha: { type: "varchar(255)", notNull: true },
    pin: { type: "varchar(6)" },
    role: {
      type: "varchar(20)",
      notNull: true,
      check: "role IN ('dono', 'vendedor')",
    },
    aceitou_termos: { type: "boolean", default: false },
    ativo: { type: "boolean", default: true },
    data_cadastro: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("produtos", {
    id: "id",
    ponto_id: {
      type: "integer",
      notNull: true,
      references: "pontos",
      onDelete: "CASCADE",
    },
    nome: { type: "varchar(255)", notNull: true },
    tipo: { type: "varchar(50)" },
    unidade: {
      type: "varchar(20)",
      notNull: true,
      check: "unidade IN ('litro', 'kg', 'unidade')",
    },
    preco: { type: "decimal(10,2)", notNull: true },
    quantidade_estoque: { type: "decimal(10,2)", default: 0 },
    ativo: { type: "boolean", default: true },
    data_cadastro: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("movimentacoes_estoque", {
    id: "id",
    produto_id: {
      type: "integer",
      notNull: true,
      references: "produtos",
      onDelete: "CASCADE",
    },
    tipo: {
      type: "varchar(20)",
      notNull: true,
      check: "tipo IN ('entrada', 'saida')",
    },
    quantidade: { type: "decimal(10,2)", notNull: true },
    custo: { type: "decimal(10,2)" },
    observacao: { type: "text" },
    data: { type: "timestamp", default: pgm.func("current_timestamp") },
  });

  pgm.createTable("vendas", {
    id: "id",
    ponto_id: {
      type: "integer",
      notNull: true,
      references: "pontos",
      onDelete: "CASCADE",
    },
    vendedor_id: {
      type: "integer",
      notNull: true,
      references: "usuarios",
      onDelete: "RESTRICT",
    },
    valor_total: { type: "decimal(10,2)", notNull: true },
    forma_pagamento: {
      type: "varchar(20)",
      notNull: true,
      check:
        "forma_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito')",
    },
    data_venda: { type: "timestamp", default: pgm.func("current_timestamp") },
  });

  pgm.createTable("itens_venda", {
    id: "id",
    venda_id: {
      type: "integer",
      notNull: true,
      references: "vendas",
      onDelete: "CASCADE",
    },
    produto_id: {
      type: "integer",
      notNull: true,
      references: "produtos",
      onDelete: "RESTRICT",
    },
    quantidade: { type: "decimal(10,2)", notNull: true },
    preco_unitario: { type: "decimal(10,2)", notNull: true },
  });

  pgm.createTable("despesas", {
    id: "id",
    ponto_id: {
      type: "integer",
      notNull: true,
      references: "pontos",
      onDelete: "CASCADE",
    },
    descricao: { type: "varchar(255)", notNull: true },
    valor: { type: "decimal(10,2)", notNull: true },
    categoria: { type: "varchar(50)" },
    data: { type: "timestamp", default: pgm.func("current_timestamp") },
  });

  pgm.createTable("fluxo_caixa", {
    id: "id",
    ponto_id: {
      type: "integer",
      notNull: true,
      references: "pontos",
      onDelete: "CASCADE",
    },
    tipo: {
      type: "varchar(20)",
      notNull: true,
      check: "tipo IN ('receita', 'despesa')",
    },
    categoria: { type: "varchar(50)", notNull: true },
    valor: { type: "decimal(10,2)", notNull: true },
    referencia_tabela: { type: "varchar(50)" },
    referencia_id: { type: "integer" },
    data: { type: "timestamp", default: pgm.func("current_timestamp") },
  });

  pgm.createTable("pagamentos", {
    id: "id",
    empresa_id: {
      type: "integer",
      notNull: true,
      references: "empresas",
      onDelete: "CASCADE",
    },
    valor: { type: "decimal(10,2)", notNull: true },
    status: {
      type: "varchar(20)",
      notNull: true,
      check: "status IN ('pendente', 'pago', 'cancelado')",
    },
    metodo_pagamento: {
      type: "varchar(20)",
      check: "metodo_pagamento IN ('pix', 'cartao')",
    },
    referencia_externa: { type: "varchar(255)" },
    data_pagamento: { type: "timestamp" },
    data_vencimento: { type: "timestamp", notNull: true },
    data_cadastro: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("pagamentos");
  pgm.dropTable("fluxo_caixa");
  pgm.dropTable("despesas");
  pgm.dropTable("itens_venda");
  pgm.dropTable("vendas");
  pgm.dropTable("movimentacoes_estoque");
  pgm.dropTable("produtos");
  pgm.dropTable("usuarios");
  pgm.dropTable("pontos");
  pgm.dropTable("empresas");
};
