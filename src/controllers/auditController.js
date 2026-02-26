import pool from "../config/database.js";

export async function getAuditLogs(req, res) {
  try {
    const empresaId = req.user.empresaId;

    const result = await pool.query(
      `SELECT al.id, al.action, al.entity, al.entity_id, al.data, al.ip, al.created_at,
                u.nome as usuario_nome, u.email as usuario_email
        FROM audit_logs al
        LEFT JOIN usuarios u ON al.user_id = u.id
        WHERE u.empresa_id = $1
        ORDER BY al.created_at DESC
        LIMIT 100`,
      [empresaId],
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error("Erro ao buscar audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar logs de auditoria",
    });
  }
}
