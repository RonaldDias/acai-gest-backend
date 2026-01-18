exports.up = (pgm) => {
  pgm.addColumn("produtos", {
    estoque_minimo: {
      type: "decimal(10,2)",
      default: 0,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("produtos", "estoque_minimo");
};
