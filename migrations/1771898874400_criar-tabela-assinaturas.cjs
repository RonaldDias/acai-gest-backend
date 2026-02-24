exports.up = (pgm) => {
  pgm.createTable("assinaturas", {
    id: { type: "serial", primaryKey: true },
    empresa_id: {
      type: "integer",
      notNull: true,
      unique: true,
      references: "empresas(id)",
      onDelete: "CASCADE",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "ativa",
      check: "status IN ('ativa', 'inadimplente', 'cancelada')",
    },
    plano: {
      type: "varchar(10)",
      notNull: true,
      check: "plano IN ('basico', 'top')",
    },
    tipo: {
      type: "varchar(10)",
      notNull: true,
      check: "tipo IN ('mensal', 'anual')",
    },
    data_inicio: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("NOW()"),
    },
    data_vencimento: { type: "timestamp", notNull: true },
    created_at: { type: "timestamp", default: pgm.func("NOW()") },
    updated_at: { type: "timestamp", default: pgm.func("NOW()") },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("assinaturas");
};
