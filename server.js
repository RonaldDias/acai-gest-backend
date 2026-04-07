import dotenv from "dotenv";
import express from "express";
import { testConnection } from "./src/config/database.js";
import { testMercadoPagoConnection } from "./src/config/mercadopago.js";
import passport from "./src/config/passport.js";
import { startSubscriptionJob } from "./src/jobs/assinaturaJob.js";
import { corsMiddleware } from "./src/middleware/cors.js";
import { loggerMiddleware } from "./src/middleware/logger.js";
import { globalLimiter } from "./src/middleware/rateLimiter.js";
import authRoutes from "./src/routes/auth/auth.js";
import socialRoutes from "./src/routes/auth/social.js";
import empresasRoutes from "./src/routes/empresas.js";
import pontosRoutes from "./src/routes/gestao/pontos.js";
import productsRoutes from "./src/routes/gestao/products.js";
import salesRoutes from "./src/routes/gestao/sales.js";
import vendedoresRoutes from "./src/routes/gestao/vendedores.js";
import despesasRoutes from "./src/routes/gestao/despesas.js";
import usuariosRoutes from "./src/routes/gestao/usuarios.js";
import pagamentosRoutes from "./src/routes/mercadoPago/pagamentos.js";
import webhooksRoutes from "./src/routes/mercadoPago/webhooks.js";
import auditLogsRoutes from "./src/routes/relatorios/auditLogs.js";
import relatoriosRoutes from "./src/routes/relatorios/relatorios.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

testConnection();
testMercadoPagoConnection();
startSubscriptionJob();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(loggerMiddleware);
app.use(globalLimiter);
app.use(passport.initialize());

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Açaí Gest Backend rodando!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

if (process.env.NODE_ENV !== "production") {
  const { default: swaggerUi } = await import("swagger-ui-express");
  const { swaggerSpec } = await import("./src/config/swagger.js");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📄 Docs: http://localhost:${PORT}/api-docs`);
}

app.use("/api/auth", authRoutes);
app.use("/api/auth", socialRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/vendedores", vendedoresRoutes);
app.use("/api/despesas", despesasRoutes);
app.use("/api/relatorios", relatoriosRoutes);
app.use("/api/pontos", pontosRoutes);
app.use("/api/empresas", empresasRoutes);
app.use("/api/pagamentos", pagamentosRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/usuarios", usuariosRoutes);

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
