exports.up = (pgm) => {
  pgm.addColumns("pagamentos", {
    qr_code: { type: "text" },
    qr_code_base64: { type: "text" },
    payment_id: { type: "varchar(255)" },
    tipo_assinatura: {
      type: "varchar(10)",
      check: "tipo_assinatura IN ('mensal', 'anual')",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("pagamentos", [
    "qr_code",
    "qr_code_base64",
    "payment_id",
    "tipo_assinatura",
  ]);
};
