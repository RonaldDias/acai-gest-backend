exports.up = (pgm) => {
  pgm.addColumn("vendas", {
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "ativa",
      check: "status IN ('ativa', 'cancelada')",
    },
    data_cancelamento: {
      type: "timestamp",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("vendas", ["status", "data_cancelamento"]);
};
