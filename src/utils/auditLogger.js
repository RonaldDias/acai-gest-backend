import pool from "../config/database.js";

export const logAudit = async (userId, action, entity, entityId, data, req) => {
  try {
    const ip =
      req?.headers["x-forwarded-for"] || req?.socket?.remoteAddress || null;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, data, ip)
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        action,
        entity,
        entityId,
        data ? JSON.stringify(data) : null,
        ip,
      ],
    );
  } catch (error) {
    console.error("Erro ao registrar audit log:", error);
  }
};
