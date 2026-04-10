exports.up = (pgm) => {
  pgm.addColumn("pagamentos", {
    plano: {
      type: "varchar(10)",
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("pagamentos", "plano");
};