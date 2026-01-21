import bcrypt, { hash } from "bcryptjs";

export const hashPassword = async (senha) => {
  const saltRounds = 12;
  return await bcrypt.hash(senha, saltRounds);
};

export const comparePassword = async (senha, hash) => {
  return await bcrypt.compare(senha, hash);
};
