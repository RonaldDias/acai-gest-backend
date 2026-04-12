exports.up = (pgm) => {
  pgm.alterColumn("usuarios", "pin", {
    type: "varchar(100)",
  });
};

exports.down = (pgm) => {
  pgm.alterColumn("usuarios", "pin", {
    type: "varchar(6)",
  });
};