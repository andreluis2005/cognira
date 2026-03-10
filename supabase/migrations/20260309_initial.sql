CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    locale TEXT NOT NULL DEFAULT 'pt-BR',
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    display_name TEXT NOT NULL,
    bio TEXT,
    headline TEXT,
    website_url TEXT,
    donation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    creator_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT NOT NULL,
    long_description TEXT,
    subject_area TEXT NOT NULL,
    exam_type TEXT,
    language_code TEXT NOT NULL DEFAULT 'pt-BR',
    thumbnail_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'public',
    monetization_type TEXT NOT NULL DEFAULT 'free',
    price_cents INTEGER NOT NULL DEFAULT 0,
    currency_code TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'draft',
    review_status TEXT NOT NULL DEFAULT 'pending',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE program_trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (program_id, slug)
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id),
    trail_id UUID REFERENCES program_trails(id),
    parent_topic_id UUID REFERENCES topics(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    cognitive_weight NUMERIC(10, 2) NOT NULL DEFAULT 1,
    exam_weight TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (program_id, slug)
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id),
    trail_id UUID REFERENCES program_trails(id),
    topic_id UUID NOT NULL REFERENCES topics(id),
    author_user_id UUID REFERENCES users(id),
    origin_type TEXT NOT NULL DEFAULT 'manual',
    source_reference TEXT,
    stem TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty_level TEXT NOT NULL DEFAULT 'medium',
    language_code TEXT NOT NULL DEFAULT 'pt-BR',
    status TEXT NOT NULL DEFAULT 'draft',
    quality_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    body TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    program_id UUID NOT NULL REFERENCES programs(id),
    access_type TEXT NOT NULL DEFAULT 'owner',
    access_status TEXT NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE (user_id, program_id)
);

CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    program_id UUID REFERENCES programs(id),
    trail_id UUID REFERENCES program_trails(id),
    mode TEXT NOT NULL DEFAULT 'smart',
    target_topic_id UUID REFERENCES topics(id),
    engine_session_ref TEXT,
    session_status TEXT NOT NULL DEFAULT 'started',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE session_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE session_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    session_block_id UUID NOT NULL REFERENCES session_blocks(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    selected_option_id UUID REFERENCES question_options(id),
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    program_id UUID NOT NULL REFERENCES programs(id),
    topic_id UUID NOT NULL REFERENCES topics(id),
    attempts INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    accuracy NUMERIC(5, 2) NOT NULL DEFAULT 0,
    coverage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    readiness_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    mastery_level INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'not_evaluated',
    last_seen_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, program_id, topic_id)
);

CREATE TABLE question_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    program_id UUID NOT NULL REFERENCES programs(id),
    question_id UUID NOT NULL REFERENCES questions(id),
    attempts INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    consecutive_successes INTEGER NOT NULL DEFAULT 0,
    mastery_level INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, program_id, question_id)
);

CREATE TABLE program_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL,
    title TEXT,
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (program_id, user_id)
);

CREATE TABLE creator_metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id),
    snapshot_date DATE NOT NULL,
    creator_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
    active_learners INTEGER NOT NULL DEFAULT 0,
    avg_program_rating NUMERIC(5, 2) NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    retention_signal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    revenue_cents INTEGER NOT NULL DEFAULT 0,
    UNIQUE (creator_profile_id, snapshot_date)
);

CREATE TABLE sponsorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_user_id UUID NOT NULL REFERENCES users(id),
    beneficiary_user_id UUID REFERENCES users(id),
    program_id UUID NOT NULL REFERENCES programs(id),
    mode TEXT NOT NULL DEFAULT 'reward',
    funding_type TEXT NOT NULL DEFAULT 'fiat',
    budget_cents INTEGER,
    budget_crypto_amount NUMERIC(20, 8),
    crypto_symbol TEXT,
    reward_rule TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ
);

CREATE TABLE sponsorship_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsorship_id UUID NOT NULL REFERENCES sponsorships(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE question_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE question_tag_links (
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES question_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

CREATE TABLE ai_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    program_id UUID REFERENCES programs(id),
    trail_id UUID REFERENCES program_trails(id),
    topic_id UUID REFERENCES topics(id),
    prompt_text TEXT,
    source_material_url TEXT,
    source_material_text TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    provider_name TEXT,
    generated_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE ai_generation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ai_generation_jobs(id) ON DELETE CASCADE,
    draft_payload_json TEXT NOT NULL,
    validation_status TEXT NOT NULL DEFAULT 'pending',
    review_notes TEXT,
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ
);
