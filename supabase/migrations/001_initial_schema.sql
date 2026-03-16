-- ═══════════════════════════════════════════════════════════
-- SCS Risk Assessment Tool - Initial Schema Migration
-- Run this in Supabase SQL Editor to create all tables
-- ═══════════════════════════════════════════════════════════

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════
-- TABLE: admins
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    name TEXT,
    require_password_reset BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: cancer_types
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cancer_types (
    id TEXT PRIMARY KEY,
    name_en TEXT,
    name_zh TEXT,
    name_ms TEXT,
    name_ta TEXT,
    description_en TEXT,
    description_zh TEXT,
    description_ms TEXT,
    description_ta TEXT,
    family_label_en TEXT,
    family_label_zh TEXT,
    family_label_ms TEXT,
    family_label_ta TEXT,
    icon TEXT,
    family_weight NUMERIC DEFAULT 10,
    gender_filter TEXT DEFAULT 'all',
    age_risk_threshold INTEGER DEFAULT 50,
    age_risk_weight NUMERIC DEFAULT 0,
    ethnicity_risk_chinese NUMERIC DEFAULT 0,
    ethnicity_risk_malay NUMERIC DEFAULT 0,
    ethnicity_risk_indian NUMERIC DEFAULT 0,
    ethnicity_risk_caucasian NUMERIC DEFAULT 0,
    ethnicity_risk_others NUMERIC DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: questions
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    prompt_en TEXT,
    prompt_zh TEXT,
    prompt_ms TEXT,
    prompt_ta TEXT,
    explanationyes_en TEXT,
    explanationyes_zh TEXT,
    explanationyes_ms TEXT,
    explanationyes_ta TEXT,
    explanationno_en TEXT,
    explanationno_zh TEXT,
    explanationno_ms TEXT,
    explanationno_ta TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: question_assignments
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS question_assignments (
    id SERIAL PRIMARY KEY,
    questionid TEXT REFERENCES questions(id) ON DELETE CASCADE,
    assessmentid TEXT REFERENCES cancer_types(id) ON DELETE CASCADE,
    targetcancertype TEXT NOT NULL,
    weight NUMERIC NOT NULL,
    yesvalue NUMERIC DEFAULT 100,
    novalue NUMERIC DEFAULT 0,
    category TEXT,
    minage INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: settings
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: assessments
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    age INTEGER,
    gender TEXT,
    ethnicity TEXT,
    family_history BOOLEAN,
    contact_email TEXT,
    contact_phone TEXT,
    assessment_type TEXT NOT NULL,
    risk_score NUMERIC NOT NULL,
    risk_level TEXT NOT NULL,
    category_risks JSONB NOT NULL DEFAULT '{}',
    questions_answers JSONB NOT NULL DEFAULT '[]',
    completion_time INTEGER,
    anomaly_score NUMERIC DEFAULT 0,
    anomaly_flags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'valid',
    ml_prediction JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- TABLE: password_reset_tokens
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_question_assignments_assessment 
    ON question_assignments(assessmentid);

CREATE INDEX IF NOT EXISTS idx_question_assignments_question 
    ON question_assignments(questionid);

CREATE INDEX IF NOT EXISTS idx_assessments_type 
    ON assessments(assessment_type);

CREATE INDEX IF NOT EXISTS idx_assessments_created 
    ON assessments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessments_status 
    ON assessments(status);

CREATE INDEX IF NOT EXISTS idx_assessments_anomaly 
    ON assessments(anomaly_score);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token 
    ON password_reset_tokens(token);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on assessments (anonymized data)
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users (assessments are anonymized)
CREATE POLICY "Allow authenticated read access to assessments"
ON assessments FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all admin accounts
CREATE POLICY "Admins can read admin accounts"
ON admins FOR SELECT
TO authenticated
USING (true);

-- Policy: Only super_admins can modify admin accounts
CREATE POLICY "Super admins can modify admin accounts"
ON admins FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins a
        WHERE a.email = current_setting('app.current_user_email', TRUE)
        AND a.role = 'super_admin'
    )
);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS FOR updated_at
-- ═══════════════════════════════════════════════════════════

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cancer_types_updated_at
    BEFORE UPDATE ON cancer_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_assignments_updated_at
    BEFORE UPDATE ON question_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- INITIAL DATA
-- ═══════════════════════════════════════════════════════════

-- Insert default settings if not exists
INSERT INTO settings (key, value) VALUES
    ('theme', '{
        "primaryColor": "#4F46E5",
        "secondaryColor": "#10B981",
        "logoUrl": "",
        "faviconUrl": ""
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES
    ('pdpa', '{
        "enabled": true,
        "content_en": "I consent to the collection and use of my health information for cancer risk assessment purposes.",
        "content_zh": "我同意收集和使用我的健康信息进行癌症风险评估。",
        "content_ms": "Saya bersetuju dengan pengumpulan dan penggunaan maklumat kesihatan saya untuk tujuan penilaian risiko kanser.",
        "content_ta": "புற்றுநோய் அபாய மதிப்பீட்டு நோக்கங்களுக்காக எனது சுகாதார தகவல்களை சேகரிப்பதற்கும் பயன்படுத்துவதற்கும் நான் சம்மதிக்கிறேன்."
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════

-- Verify tables created
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
