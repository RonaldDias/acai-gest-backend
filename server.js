import express from "express";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use("/api/auth", authRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Açaí Gest Backend rodando!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, senha } = req.body;
  console.log("Tentativa de login:", { email });

  if (!email || !senha) {
    return res.status(400).json({
      success: false,
      message: "Email e senha são obrigatórios",
    });
  }

  if (email === "admin@acaigest.com" && senha === "123456") {
    res.json({
      success: true,
      message: "Login realizado com sucesso",
      user: {
        id: 1,
        nome: "Administrador",
        email: email,
      },
      token: "mock_jwt_token_here",
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Email ou senha incorretos",
    });
  }
});

app.post("/api/auth/cadastro", (req, res) => {
  console.log("Dados do cadastro:", req.body);

  const { nome, email, senha, confirmaSenha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      success: false,
      message: "Nome, email e senha são obrigatórios",
    });
  }

  if (senha !== confirmaSenha) {
    return res.status(400).json({
      success: false,
      message: "Confirmação de senha não confere",
    });
  }

  res.status(201).json({
    success: true,
    message: "Cadastro realizado com sucesso!",
    user: {
      id: Date.now(),
      nome,
      email,
      createdAt: new Date(),
    },
    token: "mock_jwt_token_here",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada",
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Teste: http://localhost:${PORT}/api/health`);
});
