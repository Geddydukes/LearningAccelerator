#!/bin/bash
set -e

# Backup script for Supabase database
DATE=$(date +%Y-%m-%d)
BACKUP_FILE="backup-$DATE.sql.gz"

echo "Starting backup for $DATE..."

# Create backup
pg_dump $DATABASE_URL | gzip > /tmp/$BACKUP_FILE

# Upload to S3
aws s3 cp /tmp/$BACKUP_FILE s3://la-backups/$BACKUP_FILE

# Cleanup local file
rm /tmp/$BACKUP_FILE

# Verify backup exists
if aws s3 ls s3://la-backups/$BACKUP_FILE; then
    echo "Backup completed successfully: $BACKUP_FILE"
else
    echo "Backup failed: $BACKUP_FILE not found in S3"
    exit 1
fi

# Cleanup old backups (keep 30 days)
aws s3 ls s3://la-backups/ | while read -r line; do
    backup_date=$(echo $line | awk '{print $1}')
    backup_file=$(echo $line | awk '{print $4}')
    
    if [[ $(date -d "$backup_date" +%s) -lt $(date -d "30 days ago" +%s) ]]; then
        echo "Deleting old backup: $backup_file"
        aws s3 rm s3://la-backups/$backup_file
    fi
done

echo "Backup process completed."