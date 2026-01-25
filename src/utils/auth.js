import bcrypt, { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const hashPassword = async (senha) => {
  const saltRounds = 12;
  return await bcrypt.hash(senha, saltRounds);
};

export const comparePassword = async (senha, hash) => {
  return await bcrypt.compare(senha, hash);
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
