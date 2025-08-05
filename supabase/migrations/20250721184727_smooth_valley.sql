-- Learning Accelerator Database Schema
-- PostgreSQL with Supabase extensions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE user_role AS ENUM ('learner', 'mentor', 'admin');
CREATE TYPE week_status AS ENUM ('pending', 'in_progress', 'complete', 'archived');
CREATE TYPE agent_type AS ENUM ('clo', 'socratic', 'alex', 'brand');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE job_type AS ENUM ('deep_dive', 'branding', 'socratic', 'voice_synthesis', 'kpi_analysis');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'trialing');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
CREATE TYPE plan_name AS ENUM ('Free', 'Pro', 'Enterprise');
CREATE TYPE review_depth AS ENUM ('standard', 'comprehensive', 'security_focused');
CREATE TYPE review_status AS ENUM ('queued', 'analyzing', 'completed', 'failed');

-- Core Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'learner',
    avatar_url TEXT,
    voice_preference VARCHAR(50) DEFAULT 'alloy',
    learning_preferences JSONB DEFAULT '{}',
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents configuration
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type agent_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly learning sessions
CREATE TABLE weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status week_status DEFAULT 'pending',
    focus_area VARCHAR(255),
    estimated_hours INTEGER DEFAULT 8,
    actual_hours INTEGER,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_number)
);

-- CLO (Curriculum Learning Officer) notes
CREATE TABLE clo_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    module_title VARCHAR(500) NOT NULL,
    learning_objectives TEXT[] DEFAULT '{}',
    key_concepts TEXT[] DEFAULT '{}',
    estimated_duration INTEGER, -- minutes
    prerequisites TEXT[] DEFAULT '{}',
    resources JSONB DEFAULT '[]',
    assessment_criteria TEXT[] DEFAULT '{}',
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Engineer (Alex) notes
CREATE TABLE engineer_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    repository_url TEXT,
    analysis_summary TEXT,
    code_quality_score INTEGER CHECK (code_quality_score >= 0 AND code_quality_score <= 100),
    recommendations JSONB DEFAULT '[]',
    technical_debt_items JSONB DEFAULT '[]',
    best_practices_followed TEXT[] DEFAULT '{}',
    areas_for_improvement TEXT[] DEFAULT '{}',
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Socratic dialogue sessions
CREATE TABLE socratic_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(500),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_questions INTEGER DEFAULT 0,
    insights_generated TEXT[] DEFAULT '{}',
    voice_enabled BOOLEAN DEFAULT false,
    session_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages within Socratic sessions
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES socratic_sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    audio_url TEXT,
    has_transcript BOOLEAN DEFAULT false,
    transcript TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand strategy packages
CREATE TABLE brand_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    mode VARCHAR(100) DEFAULT 'standard',
    content_themes TEXT[] DEFAULT '{}',
    kpi_metrics JSONB DEFAULT '[]',
    social_content_suggestions JSONB DEFAULT '[]',
    brand_voice_analysis TEXT,
    engagement_strategies TEXT[] DEFAULT '{}',
    assets JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI metrics tracking
CREATE TABLE kpi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    metric_category VARCHAR(100),
    current_value DECIMAL(12,2) NOT NULL,
    target_value DECIMAL(12,2),
    previous_value DECIMAL(12,2),
    delta DECIMAL(12,2),
    trend VARCHAR(20) CHECK (trend IN ('up', 'down', 'stable')),
    unit VARCHAR(50),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Code reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID REFERENCES weeks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_url TEXT NOT NULL,
    depth review_depth DEFAULT 'standard',
    status review_status DEFAULT 'queued',
    result_json JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Background job queue
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type job_type NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}',
    status job_status DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name plan_name UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly INTEGER NOT NULL, -- cents
    price_annual INTEGER, -- cents
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}', -- rate limits, storage limits, etc.
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_annual VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status subscription_status DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount_due INTEGER NOT NULL, -- cents
    amount_paid INTEGER DEFAULT 0, -- cents
    amount_remaining INTEGER DEFAULT 0, -- cents
    status invoice_status DEFAULT 'draft',
    invoice_date DATE NOT NULL,
    due_date DATE,
    pdf_url TEXT,
    hosted_invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment events (webhooks from Stripe)
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent assignments (many-to-many relationship)
CREATE TABLE agent_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_id UUID REFERENCES socratic_sessions(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CHECK (
        (session_id IS NOT NULL AND job_id IS NULL AND week_id IS NULL) OR
        (session_id IS NULL AND job_id IS NOT NULL AND week_id IS NULL) OR
        (session_id IS NULL AND job_id IS NULL AND week_id IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active);
CREATE INDEX idx_weeks_user_id ON weeks(user_id);
CREATE INDEX idx_weeks_status ON weeks(status);
CREATE INDEX idx_weeks_start_date ON weeks(start_date);
CREATE INDEX idx_clo_notes_week_id ON clo_notes(week_id);
CREATE INDEX idx_engineer_notes_week_id ON engineer_notes(week_id);
CREATE INDEX idx_socratic_sessions_user_id ON socratic_sessions(user_id);
CREATE INDEX idx_socratic_sessions_week_id ON socratic_sessions(week_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_brand_packages_week_id ON brand_packages(week_id);
CREATE INDEX idx_kpi_metrics_user_id ON kpi_metrics(user_id);
CREATE INDEX idx_kpi_metrics_week_id ON kpi_metrics(week_id);
CREATE INDEX idx_kpi_metrics_recorded_at ON kpi_metrics(recorded_at);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_at ON jobs(scheduled_at);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_payment_events_user_id ON payment_events(user_id);
CREATE INDEX idx_payment_events_processed ON payment_events(processed);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weeks_updated_at BEFORE UPDATE ON weeks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clo_notes_updated_at BEFORE UPDATE ON clo_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engineer_notes_updated_at BEFORE UPDATE ON engineer_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_socratic_sessions_updated_at BEFORE UPDATE ON socratic_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_packages_updated_at BEFORE UPDATE ON brand_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clo_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE socratic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own weeks" ON weeks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own weeks" ON weeks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weeks" ON weeks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own clo_notes" ON clo_notes FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM weeks WHERE weeks.id = clo_notes.week_id)
);
CREATE POLICY "Users can create own clo_notes" ON clo_notes FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM weeks WHERE weeks.id = clo_notes.week_id)
);

CREATE POLICY "Users can read own engineer_notes" ON engineer_notes FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM weeks WHERE weeks.id = engineer_notes.week_id)
);
CREATE POLICY "Users can create own engineer_notes" ON engineer_notes FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM weeks WHERE weeks.id = engineer_notes.week_id)
);

CREATE POLICY "Users can read own socratic_sessions" ON socratic_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own socratic_sessions" ON socratic_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own messages" ON messages FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM socratic_sessions WHERE socratic_sessions.id = messages.session_id)
);
CREATE POLICY "Users can create own messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM socratic_sessions WHERE socratic_sessions.id = messages.session_id)
);

CREATE POLICY "Users can read own brand_packages" ON brand_packages FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM weeks WHERE weeks.id = brand_packages.week_id)
);
CREATE POLICY "Users can create own brand_packages" ON brand_packages FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM weeks WHERE weeks.id = brand_packages.week_id)
);

CREATE POLICY "Users can read own kpi_metrics" ON kpi_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own kpi_metrics" ON kpi_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own invoices" ON invoices FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM subscriptions WHERE subscriptions.id = invoices.subscription_id)
);

-- Insert default plans
INSERT INTO plans (name, display_name, description, price_monthly, price_annual, features, limits) VALUES
('Free', 'Free Tier', 'Core weekly sessions with basic features', 0, 0, 
 '{"weekly_sessions": true, "socratic_chats": true, "basic_dashboards": true, "voice_synthesis": false}',
 '{"socratic_messages_per_week": 50, "code_reviews_per_month": 1, "storage_mb": 100}'),
('Pro', 'Pro Tier', 'Unlimited features with advanced analytics', 2900, 29000,
 '{"unlimited_sessions": true, "voice_synthesis": true, "code_reviews": true, "brand_packages": true, "advanced_analytics": true}',
 '{"socratic_messages_per_week": -1, "code_reviews_per_month": -1, "storage_mb": 1000}'),
('Enterprise', 'Enterprise Tier', 'All Pro features plus SSO and priority support', 9900, 99000,
 '{"all_pro_features": true, "sso_integration": true, "priority_support": true, "custom_sla": true, "dedicated_success_manager": true}',
 '{"socratic_messages_per_week": -1, "code_reviews_per_month": -1, "storage_mb": 10000}');

-- Insert default agents
INSERT INTO agents (type, name, description, config, version) VALUES
('clo', 'CLO - Curriculum Architect', 'Generates personalized weekly learning modules', '{"model": "gemini-1.5-pro", "temperature": 0.7}', '2.0'),
('socratic', 'Socratic Inquisitor', 'Facilitates learning through thoughtful questioning', '{"model": "gemini-1.5-pro", "temperature": 0.8}', '2.0'),
('alex', 'Alex - Lead Engineer', 'Provides code reviews and technical analysis', '{"model": "gemini-1.5-pro", "temperature": 0.6}', '2.2'),
('brand', 'Brand Strategist', 'Creates brand strategy and social content', '{"model": "gemini-1.5-pro", "temperature": 0.7}', '2.1');