import bcrypt from "bcryptjs";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/database.js";

export const hashPassword = async (senha) => {
  return await argon2.hash(senha, { type: argon2.argon2id });
};

export const comparePassword = async (senhaDigitada, hashSalvaNoBanco, userId = null) => {
  if (!hashSalvaNoBanco || !senhaDigitada) return false;

  const isBcrypt = hashSalvaNoBanco.startsWith("$2");

  if (isBcrypt) {
    const validBcrypt = await bcrypt.compare(senhaDigitada, hashSalvaNoBanco);
    
    if (validBcrypt && userId) {
      try {
        const novaHashArgon = await hashPassword(senhaDigitada);
        await pool.query("UPDATE usuarios SET senha = $1 WHERE id = $2", [novaHashArgon, userId]);
      } catch (e) {
        console.error("Erro na conversão transparente Argon2:", e);
      }
    }
    return validBcrypt;
  }

  try {
    return await argon2.verify(hashSalvaNoBanco, senhaDigitada);
  } catch (err) {
    return false;
  }
};


export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const getRefreshTokenExpiry = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  return expiryDate;
};

export const generatePasswordResetToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getPasswordResetTokenExpiry = () => {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 15);
  return expiryDate;
};

export const generateVendedorPassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
