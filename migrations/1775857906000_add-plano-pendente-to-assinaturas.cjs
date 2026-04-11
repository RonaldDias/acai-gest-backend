exports.up = (pgm) => {
  pgm.addColumn("assinaturas", {
    plano_pendente: {
      type: "varchar(10)",
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("assinaturas", "plano_pendente");
};