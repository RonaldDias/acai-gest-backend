import { verifyToken } from "../utils/auth.js";
import pool from "../config/database.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      empresaId: decoded.empresaId,
      pontoId: decoded.pontoId,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao validar token",
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Sem permissão para acessar este recurso",
      });
    }

    next();
  };
};

export const checkSubscription = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT status, data_vencimento FROM assinaturas WHERE empresa_id = $1`,
      [req.user.empresaId],
    );

    if (result.rows.length === 0) {
      return res.status(402).json({
        success: false,
        message: "Assinatura não encontrada",
      });
    }

    const assinatura = result.rows[0];

    if (
      assinatura.status !== "ativa" ||
      new Date(assinatura.data_vencimento) < new Date()
    ) {
      return res.status(402).json({
        success: false,
        message: "Assinatura vencida. Renove para continuar usando o sistema.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro ao verificar assinatura",
    });
  }
};
