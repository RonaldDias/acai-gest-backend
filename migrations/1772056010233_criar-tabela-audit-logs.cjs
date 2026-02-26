exports.up = (pgm) => {
  pgm.createTable("audit_logs", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "integer",
      references: "usuarios(id)",
      onDelete: "SET NULL",
    },
    action: { type: "varchar(50)", notNull: true },
    entity: { type: "varchar(50)", notNull: true },
    entity_id: { type: "integer" },
    data: { type: "jsonb" },
    ip: { type: "varchar(45)" },
    created_at: { type: "timestamp", default: pgm.func("NOW()") },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("audit_logs");
};
