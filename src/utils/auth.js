import bcrypt, { hash } from "bcryptjs";
import jwt from "jsonwebtoken";

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
