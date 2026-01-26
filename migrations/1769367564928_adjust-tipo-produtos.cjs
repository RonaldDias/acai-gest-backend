exports.up = (pgm) => {
  pgm.sql("UPDATE produtos SET tipo = 'outro' WHERE tipo IS NULL");

  pgm.alterColumn("produtos", "tipo", {
    notNull: true,
  });

  pgm.addConstraint("produtos", "check_tipo_produto", {
    check: "tipo IN ('grosso', 'medio', 'popular', 'outro')",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("produtos", "check_tipo_produto");

  pgm.alterColumn("produtos", "tipo", {
    notNull: false,
  });
};
