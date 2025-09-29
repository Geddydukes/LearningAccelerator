# Security Documentation

## Overview

The Wisely platform implements comprehensive security measures to protect user data, API keys, and system integrity. This document outlines our security policies, implementation details, and monitoring procedures.

## 🔐 Core Security Principles

### 1. Server-Side Only Secrets
- **API Keys**: Never exposed to client-side code
- **Prompts**: Stored server-side only, accessed via secure proxy
- **Service Keys**: Used only in Edge Functions with service role permissions

### 2. Row Level Security (RLS)
All user data is protected by PostgreSQL Row Level Security policies ensuring users can only access their own data.

### 3. Rate Limiting & Abuse Prevention
Comprehensive rate limiting prevents abuse and ensures fair resource usage.

## 🛡️ Authentication & Authorization

### Supabase Auth Integration
- **JWT Tokens**: Secure authentication with automatic refresh
- **Protected Routes**: All learning content requires authentication
- **User Sessions**: Managed by Supabase with automatic expiration

### RLS Policies

#### User Data Protection
```sql
-- Users can only access their own education sessions
CREATE POLICY "Users can view their own education sessions" ON education_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own program plans
CREATE POLICY "Users can insert their own program plans" ON program_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can access agent events for observability
CREATE POLICY "Service role can access agent events" ON agent_events
  FOR ALL USING (auth.role() = 'service_role');
```

#### Data Isolation
- Each user's data is completely isolated
- No cross-user data access possible
- Service role has limited, audited access for system operations

## 🚦 Rate Limiting Policies

### Per-User Limits
- **Education Agent**: 30 calls/minute, 200 calls/day
- **Individual Agents**: 4-8 calls/minute (varies by agent complexity)
- **Coding Workspace**: 10 calls/minute (higher due to code execution)

### Global Limits
- **System-wide**: 1000 calls/minute across all users
- **Emergency Throttling**: Automatic scaling during high load

### Implementation
```typescript
// Token bucket rate limiting example
async function checkRateLimit(userId: string, endpoint: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 30; // 30 requests per minute per user
  
  // Check recent requests and enforce limits
  // Returns retry-after time if limit exceeded
}
```

## 🔄 Idempotency & Reliability

### Idempotency Keys
- **60-second window**: Duplicate requests within 60 seconds return cached results
- **Automatic generation**: Based on user, event, week, day
- **Cost savings**: Prevents duplicate LLM calls

### Implementation
```typescript
// Idempotency check with 60s dedupe window
async function checkIdempotency(idempotencyKey: string): Promise<{ isDuplicate: boolean; result?: any }> {
  const existing = await supabase
    .from('idempotency_keys')
    .select('result')
    .eq('key', idempotencyKey)
    .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString())
    .single();
    
  return { isDuplicate: !!existing, result: existing?.result };
}
```

## 📊 Observability & Monitoring

### Agent Event Logging
Every agent call is logged with:
- **Correlation ID**: Track requests across services
- **Duration**: Performance monitoring
- **Token Usage**: Cost tracking
- **Status**: Success/failure rates
- **Error Messages**: Debugging information

### Security Monitoring
- **Failed Authentication**: Tracked and alerted
- **Rate Limit Violations**: Logged for abuse detection
- **Unusual Patterns**: Anomaly detection for suspicious activity

## 🔒 Data Protection

### Encryption
- **In Transit**: HTTPS/TLS for all communications
- **At Rest**: Supabase handles database encryption
- **API Keys**: Encrypted in environment variables

### Data Minimization
- **Prompt Security**: Prompts never sent to client
- **User Data**: Only necessary data collected
- **Retention**: Automatic cleanup of old logs and sessions

### Privacy Controls
- **User Control**: Users can delete their data
- **Data Export**: Users can export their learning progress
- **Anonymization**: Personal data anonymized in analytics

## 🚨 Incident Response

### Security Incident Procedures
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Immediate impact evaluation
3. **Containment**: Isolate affected systems
4. **Investigation**: Root cause analysis
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Lessons learned and improvements

### Contact Information
- **Security Team**: security@wisely.com
- **Emergency Response**: Available 24/7
- **Bug Reports**: security@wisely.com

## 🔍 Security Testing

### Automated Testing
- **Unit Tests**: Security-focused test coverage
- **Integration Tests**: End-to-end security validation
- **Penetration Testing**: Regular third-party security audits

### Manual Reviews
- **Code Reviews**: Security-focused peer reviews
- **Architecture Reviews**: Security design validation
- **Threat Modeling**: Regular security assessment

## 📋 Compliance

### Data Protection Regulations
- **GDPR**: European data protection compliance
- **CCPA**: California privacy law compliance
- **SOC 2**: Security and availability controls

### Audit Trail
- **User Actions**: All user actions logged
- **System Changes**: Infrastructure changes tracked
- **Access Logs**: Database access monitoring

## 🛠️ Security Tools & Technologies

### Infrastructure Security
- **Supabase**: Managed database with built-in security
- **Edge Functions**: Serverless execution with isolation
- **CDN**: Global content delivery with DDoS protection

### Application Security
- **Input Validation**: All inputs sanitized and validated
- **Output Encoding**: XSS prevention
- **CSRF Protection**: Cross-site request forgery prevention

### Monitoring Tools
- **Supabase Dashboard**: Real-time monitoring
- **Custom Logging**: Application-specific security events
- **Alerting**: Automated security incident notifications

## 📈 Security Metrics

### Key Performance Indicators
- **Authentication Success Rate**: >99.9%
- **Rate Limit Effectiveness**: <0.1% false positives
- **Security Incident Response Time**: <15 minutes
- **Data Breach Incidents**: 0 (target)

### Regular Reporting
- **Monthly Security Reports**: Executive summary
- **Quarterly Reviews**: Comprehensive security assessment
- **Annual Audits**: Third-party security validation

---

## 🔗 Related Documentation

- [Architecture Overview](architecture.md)
- [API Documentation](api-specification.yaml)
- [Deployment Guide](ops-runbook.md)
- [Incident Response Plan](ops-runbook.md#incident-response)

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Review Schedule**: Quarterly
