exports.up = (pgm) => {
  pgm.addColumns("usuarios", {
    tentativas_falhas: { type: "integer", notNull: true, default: 0 },
    bloqueado_ate: { type: "timestamp", notNull: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("usuarios", ["tentativas_falhas", "bloqueado_ate"]);
};
