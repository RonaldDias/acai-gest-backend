exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("empresas", {
    endereco: {
      type: "text",
      notNull: false,
    },
    forma_pagamento: {
      type: "varchar(20)",
      notNull: false,
      check: "forma_pagamento IN ('PIX', 'CARTAO')",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("empresas", ["endereco", "forma_pagamento"]);
};
