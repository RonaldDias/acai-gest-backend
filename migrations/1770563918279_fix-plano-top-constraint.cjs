exports.up = (pgm) => {
  pgm.dropConstraint("empresas", "check_plano_pontos");

  pgm.addConstraint("empresas", "check_plano_pontos", {
    check:
      "(plano = 'basico' AND quantidade_pontos = 1) OR (plano = 'top' AND quantidade_pontos >= 1)",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("empresas", "check_plano_pontos");

  pgm.addConstraint("empresas", "check_plano_pontos", {
    check:
      "(plano = 'basico' AND quantidade_pontos = 1) OR (plano = 'top' AND quantidade_pontos >= 2)",
  });
};
