#!/bin/bash

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="/tmp/backup_${DATE}.sql"
COMPRESSED_FILE="/tmp/backup_${DATE}.sql.gz"

echo "Iniciando backup: ${DATE}"

PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
    -h $POSTGRES_HOST \
    -U $POSTGRES_USER \
    -d $POSTGRES_DB \
    > $BACKUP_FILE

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

node /app/scripts/uploadBackup.js $COMPRESSED_FILE

if [ $? -ne 0 ]; then
    echo "Erro ao enviar backup para R2"
    exit 1
fi

echo "Backup concluido: ${DATE}"