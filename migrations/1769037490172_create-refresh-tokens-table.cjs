exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("refresh_tokens", {
    id: "id",
    user_id: {
      type: "integer",
      notNull: true,
      references: "usuarios",
      onDelete: "CASCADE",
    },
    token: {
      type: "text",
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: "timestamp",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("refresh_tokens", "user_id");
  pgm.createIndex("refresh_tokens", "token");
};

exports.down = (pgm) => {
  pgm.dropTable("refresh_tokens");
};
