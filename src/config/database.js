import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: process.env.DB_MAX_CONNECTIONS || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err, client) => {
  console.error("Erro inesperado no cliente do pool", err);
  process.exit(-1);
});

export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("Conexão com PostgreSQL estabelecida!");
    console.log("Server time:", result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error("Erro ao conectar no PostgreSQL:", error.message);
    return false;
  }
}

export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Query executada", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Erro na query:", error);
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  const releaseWithTimeout = () => {
    setTimeout(() => release(), 1000);
  };

  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };

  client.release = releaseWithTimeout;

  return client;
}

export default pool;
