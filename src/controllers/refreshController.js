import pool from "../config/database.js";
import { generateToken } from "../utils/auth.js";

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token não fornecido",
      });
    }

    const result = await pool.query(
      `SELECT rt.user_id, rt.expires_at, u.email, u.role, u.empresa_id, u.ponto_id
        FROM refresh_tokens rt
        INNER JOIN usuarios u ON rt.user_id = u.id
        WHERE rt.token = $1`,
      [refreshToken],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Refresh token inválido",
      });
    }

    const tokenData = result.rows[0];

    if (new Date(tokenData.expires_at) < new Date()) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [
        refreshToken,
      ]);
      return res.status(401).json({
        success: false,
        message: "Refresh token expirado",
      });
    }

    const newAccessToken = generateToken({
      userId: tokenData.user_id,
      email: tokenData.email,
      role: tokenData.role,
      empresaId: tokenData.empresa_id,
      pontoId: tokenData.ponto_id,
    });

    res.json({
      success: true,
      message: "Token renovado com sucesso",
      token: newAccessToken,
    });
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
};
