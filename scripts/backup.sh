#!/bin/bash

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/root/acai-gest-backend/backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_DIR}/backup_${DATE}.sql.gz"

echo "Iniciando backup: ${DATE}"

docker exec acai_gest_db pg_dump -U postgres acai_gest > $BACKUP_FILE

if [ $? -ne 0 ]; then
    echo "Erro ao fazer dump do PostgreSQL"
    exit 1
fi

gzip $BACKUP_FILE

if [ $? -ne 0 ]; then
    echo "Erro ao compactar backup"
    exit 1
fi

echo "Backup gerado: ${COMPRESSED_FILE}"

docker exec acai_gest_backend node /app/scripts/uploadBackup.js /app/backups/backup_${DATE}.sql.gz

if [ $? -ne 0 ]; then
    echo "Erro ao enviar backup para R2"
    exit 1
fi

echo "Backup concluido: ${DATE}"