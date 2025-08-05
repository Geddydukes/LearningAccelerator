# Operations Runbook - Learning Accelerator

## Deployment Flow

### Standard Deployment (main branch)
1. **Pre-deployment**: Lint, test, build artifacts
2. **Lighthouse CI**: Performance/accessibility validation
3. **Frontend**: Vercel automatic deployment
4. **Backend**: Fly.io rolling deployment with health checks
5. **Post-deployment**: DB migrations + health verification

### Rollback Procedures

#### Frontend (Vercel)
```bash
# List recent deployments
vercel ls learning-accelerator

# Promote previous deployment
vercel promote <deployment-url> --scope=<team>
```

#### Backend (Fly.io)
```bash
# List releases
flyctl releases -a learning-accelerator-api

# Rollback to previous release
flyctl releases rollback <version> -a learning-accelerator-api

# Emergency stop all machines
flyctl machine stop --all -a learning-accelerator-api
```

### Emergency Procedures

#### Database Issues
```bash
# Connect to production DB
flyctl postgres connect -a learning-accelerator-db

# Restore from backup
aws s3 cp s3://la-backups/$(date +%Y-%m-%d).sql.gz /tmp/
gunzip /tmp/$(date +%Y-%m-%d).sql.gz
psql < /tmp/$(date +%Y-%m-%d).sql
```

#### API Outage
```bash
# Scale up machines
flyctl scale count 3 -a learning-accelerator-api

# Check logs
flyctl logs -a learning-accelerator-api

# Restart all machines
flyctl machine restart --all -a learning-accelerator-api
```

## Monitoring & Alerts

### SLO Targets
- **Availability**: 99.5% uptime (3.6h downtime/month)
- **Performance**: p95 response time < 500ms
- **Error Rate**: < 1% of requests
- **Recovery Time**: < 15 minutes for P0 incidents

### Alert Escalation
1. **Level 1**: Automated recovery (auto-scaling, circuit breakers)
2. **Level 2**: PagerDuty → On-call engineer (5 min response)
3. **Level 3**: Team lead notification (15 min response)
4. **Level 4**: Executive escalation (30 min response)

### Key Metrics Dashboard
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database connection pool health
- Fly.io machine CPU/memory utilization
- Vercel function execution times

## Backup & Recovery

### Automated Backups
```bash
#!/bin/bash
# supabase.backup.sh (runs nightly via cron)
DATE=$(date +%Y-%m-%d)
pg_dump $DATABASE_URL | gzip > /tmp/backup-$DATE.sql.gz
aws s3 cp /tmp/backup-$DATE.sql.gz s3://la-backups/
rm /tmp/backup-$DATE.sql.gz
```

### Quarterly Restore Test
```bash
# Test restore to staging
aws s3 cp s3://la-backups/$(date +%Y-%m-%d).sql.gz /tmp/
gunzip /tmp/$(date +%Y-%m-%d).sql.gz
psql $STAGING_DATABASE_URL < /tmp/$(date +%Y-%m-%d).sql
```

## On-Call Rotation

### Primary On-Call (Week rotation)
- **Week 1**: Senior Engineer A
- **Week 2**: Senior Engineer B  
- **Week 3**: Tech Lead
- **Week 4**: Senior Engineer C

### Secondary On-Call (Month rotation)
- **Month 1**: Engineering Manager
- **Month 2**: Principal Engineer
- **Month 3**: CTO

### Incident Response
1. **Acknowledge**: PagerDuty alert within 5 minutes
2. **Assess**: Determine severity (P0-P3)
3. **Communicate**: Update status page + Slack
4. **Resolve**: Apply fix + verify resolution
5. **Document**: Post-incident review within 24h

## Security Procedures

### Key Rotation (Quarterly)
```bash
# Rotate API keys
gh secret set OPENAI_API_KEY --body="<new-key>"
gh secret set ELEVENLABS_API_KEY --body="<new-key>"

# Update Fly secrets
flyctl secrets set OPENAI_API_KEY=<new-key> -a learning-accelerator-api
flyctl secrets set ELEVENLABS_API_KEY=<new-key> -a learning-accelerator-api

# Update Vercel environment variables
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

### Security Incident Response
1. **Isolate**: Scale down affected services
2. **Assess**: Determine scope of breach
3. **Contain**: Rotate compromised credentials
4. **Notify**: Legal/compliance team within 1 hour
5. **Remediate**: Apply security patches
6. **Review**: Security audit within 72 hours

## Maintenance Windows

### Scheduled Maintenance (Monthly - 2nd Sunday 2-4 AM EST)
- Database maintenance and optimization
- Security patches and updates
- Performance tuning and cleanup

### Emergency Maintenance
- Immediate security vulnerabilities
- Critical performance issues
- Data corruption incidents

## Contact Information

### Engineering Team
- **Tech Lead**: tech-lead@learningaccelerator.com
- **On-Call**: +1-555-ONCALL (PagerDuty)
- **Engineering Manager**: eng-manager@learningaccelerator.com

### External Vendors
- **Fly.io Support**: support@fly.io
- **Vercel Support**: support@vercel.com  
- **Supabase Support**: support@supabase.com