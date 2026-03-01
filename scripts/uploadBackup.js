import pkg from "@aws-sdk/client-s3";
import { readFileSync, unlinkSync } from "fs";
import { basename } from "path";
import dotenv from "dotenv";

dotenv.config();

const { S3Client, PutObjectCommand } = pkg;
const filePath = process.argv[2];

if (!filePath) {
  console.error("Caminho do arquivo não informado");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

try {
  const fileContent = readFileSync(filePath);
  const fileName = basename(filePath);

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `backups/${fileName}`,
    Body: fileContent,
    ContentType: "application/gzip",
  });

  await client.send(command);
  console.log(`Backup enviado para R2: ${fileName}`);

  unlinkSync(filePath);
  console.log("Arquivo local removido");
} catch (error) {
  console.error("Erro ao enviar backup:", error);
  process.exit(1);
}
