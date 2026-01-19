exports.up = (pgm) => {
  pgm.addColumn("itens_venda", {
    subtotal: {
      type: "numeric(10,2)",
      notNull: true,
      default: 0,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("itens_venda", "subtotal");
};
