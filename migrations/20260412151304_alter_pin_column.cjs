export const up = (pgm) => {
  pgm.alterColumn("usuarios", "pin", {
    type: "varchar(100)",
  });
};

export const down = (pgm) => {
  pgm.alterColumn("usuarios", "pin", {
    type: "varchar(6)",
  });
};