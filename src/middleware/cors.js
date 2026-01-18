export function corsMiddleware(req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_URL || "http://localhost:300"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Acces-Control-ALlow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
}
