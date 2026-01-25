import pool from "../config/database.js";

export const cpfExists = async (cpf) => {
  const cpfLimpo = cpf.replace(/\D/g, "");
  const result = await pool.query("SELECT id FROM usuarios WHERE cpf = $1", [
    cpfLimpo,
  ]);
  return result.rows.length > 0;
};

export const emailExists = async (email) => {
  const result = await pool.query("SELECT id FROM usuarios WHERE email = $1", [
    email,
  ]);
  return result.rows.length > 0;
};
