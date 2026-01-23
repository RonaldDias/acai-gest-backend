exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns("usuarios", {
    reset_token: {
      type: "varchar(6)",
      notNull: false,
    },
    reset_token_expires: {
      type: "timestamp",
      notNull: false,
    },
  });

  pgm.createIndex("usuarios", "reset_token");
};

exports.down = (pgm) => {
  pgm.dropIndex("usuarios", "reset_token");
  pgm.dropColumns("usuarios", ["reset_token", "reset_token_expires"]);
};
