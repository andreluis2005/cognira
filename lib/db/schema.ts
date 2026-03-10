import {
    boolean,
    integer,
    numeric,
    pgTable,
    primaryKey,
    text,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name').notNull(),
    avatarUrl: text('avatar_url'),
    locale: text('locale').notNull().default('pt-BR'),
    timezone: text('timezone').notNull().default('America/Sao_Paulo'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable('user_roles', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    grantedByUserId: uuid('granted_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueUserRole: unique().on(table.userId, table.role),
}));

export const creatorProfiles = pgTable('creator_profiles', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    displayName: text('display_name').notNull(),
    bio: text('bio'),
    headline: text('headline'),
    websiteUrl: text('website_url'),
    donationEnabled: boolean('donation_enabled').notNull().default(false),
    creatorScore: numeric('creator_score', { precision: 10, scale: 2 }).notNull().default('0'),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueUserId: unique().on(table.userId),
}));

export const programs = pgTable('programs', {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorProfileId: uuid('creator_profile_id').notNull().references(() => creatorProfiles.id),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    shortDescription: text('short_description').notNull(),
    longDescription: text('long_description'),
    subjectArea: text('subject_area').notNull(),
    examType: text('exam_type'),
    languageCode: text('language_code').notNull().default('pt-BR'),
    thumbnailUrl: text('thumbnail_url'),
    visibility: text('visibility').notNull().default('public'),
    monetizationType: text('monetization_type').notNull().default('free'),
    priceCents: integer('price_cents').notNull().default(0),
    currencyCode: text('currency_code').notNull().default('BRL'),
    status: text('status').notNull().default('draft'),
    reviewStatus: text('review_status').notNull().default('pending'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const programTrails = pgTable('program_trails', {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id').notNull().references(() => programs.id),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    position: integer('position').notNull().default(0),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueProgramSlug: unique().on(table.programId, table.slug),
}));

export const topics = pgTable('topics', {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id').notNull().references(() => programs.id),
    trailId: uuid('trail_id').references(() => programTrails.id),
    parentTopicId: uuid('parent_topic_id'),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    cognitiveWeight: numeric('cognitive_weight', { precision: 10, scale: 2 }).notNull().default('1'),
    examWeight: text('exam_weight'),
    position: integer('position').notNull().default(0),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueProgramTopicSlug: unique().on(table.programId, table.slug),
}));

export const questions = pgTable('questions', {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id').notNull().references(() => programs.id),
    trailId: uuid('trail_id').references(() => programTrails.id),
    topicId: uuid('topic_id').notNull().references(() => topics.id),
    authorUserId: uuid('author_user_id').references(() => users.id),
    originType: text('origin_type').notNull().default('manual'),
    sourceReference: text('source_reference'),
    stem: text('stem').notNull(),
    explanation: text('explanation').notNull(),
    difficultyLevel: text('difficulty_level').notNull().default('medium'),
    languageCode: text('language_code').notNull().default('pt-BR'),
    status: text('status').notNull().default('draft'),
    qualityScore: numeric('quality_score', { precision: 10, scale: 2 }).notNull().default('0'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const questionOptions = pgTable('question_options', {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    body: text('body').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    position: integer('position').notNull().default(0),
});

export const enrollments = pgTable('enrollments', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    programId: uuid('program_id').notNull().references(() => programs.id),
    accessType: text('access_type').notNull().default('owner'),
    accessStatus: text('access_status').notNull().default('active'),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
    uniqueEnrollment: unique().on(table.userId, table.programId),
}));

export const studySessions = pgTable('study_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    programId: uuid('program_id').references(() => programs.id),
    trailId: uuid('trail_id').references(() => programTrails.id),
    mode: text('mode').notNull().default('smart'),
    targetTopicId: uuid('target_topic_id').references(() => topics.id),
    engineSessionRef: text('engine_session_ref'),
    sessionStatus: text('session_status').notNull().default('started'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
});

export const sessionBlocks = pgTable('session_blocks', {
    id: uuid('id').defaultRandom().primaryKey(),
    studySessionId: uuid('study_session_id').notNull().references(() => studySessions.id, { onDelete: 'cascade' }),
    blockType: text('block_type').notNull(),
    position: integer('position').notNull().default(0),
    totalQuestions: integer('total_questions').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
});

export const sessionAnswers = pgTable('session_answers', {
    id: uuid('id').defaultRandom().primaryKey(),
    studySessionId: uuid('study_session_id').notNull().references(() => studySessions.id, { onDelete: 'cascade' }),
    sessionBlockId: uuid('session_block_id').notNull().references(() => sessionBlocks.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id),
    selectedOptionId: uuid('selected_option_id').references(() => questionOptions.id),
    isCorrect: boolean('is_correct').notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
    responseTimeMs: integer('response_time_ms'),
    orderIndex: integer('order_index').notNull().default(0),
});

export const topicProgress = pgTable('topic_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    programId: uuid('program_id').notNull().references(() => programs.id),
    topicId: uuid('topic_id').notNull().references(() => topics.id),
    attempts: integer('attempts').notNull().default(0),
    correctCount: integer('correct_count').notNull().default(0),
    accuracy: numeric('accuracy', { precision: 5, scale: 2 }).notNull().default('0'),
    coverage: numeric('coverage', { precision: 5, scale: 2 }).notNull().default('0'),
    readinessScore: numeric('readiness_score', { precision: 5, scale: 2 }).notNull().default('0'),
    masteryLevel: integer('mastery_level').notNull().default(0),
    status: text('status').notNull().default('not_evaluated'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueProgress: unique().on(table.userId, table.programId, table.topicId),
}));

export const questionProgress = pgTable('question_progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    programId: uuid('program_id').notNull().references(() => programs.id),
    questionId: uuid('question_id').notNull().references(() => questions.id),
    attempts: integer('attempts').notNull().default(0),
    correctCount: integer('correct_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    consecutiveSuccesses: integer('consecutive_successes').notNull().default(0),
    masteryLevel: integer('mastery_level').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    nextReviewAt: timestamp('next_review_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueQuestionProgress: unique().on(table.userId, table.programId, table.questionId),
}));

export const programReviews = pgTable('program_reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    programId: uuid('program_id').notNull().references(() => programs.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    rating: integer('rating').notNull(),
    title: text('title'),
    body: text('body'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueReview: unique().on(table.programId, table.userId),
}));

export const creatorMetricsSnapshots = pgTable('creator_metrics_snapshots', {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorProfileId: uuid('creator_profile_id').notNull().references(() => creatorProfiles.id),
    snapshotDate: timestamp('snapshot_date', { mode: 'date' }).notNull(),
    creatorScore: numeric('creator_score', { precision: 10, scale: 2 }).notNull().default('0'),
    activeLearners: integer('active_learners').notNull().default(0),
    avgProgramRating: numeric('avg_program_rating', { precision: 5, scale: 2 }).notNull().default('0'),
    completionRate: numeric('completion_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    retentionSignal: numeric('retention_signal', { precision: 10, scale: 2 }).notNull().default('0'),
    revenueCents: integer('revenue_cents').notNull().default(0),
}, (table) => ({
    uniqueSnapshot: unique().on(table.creatorProfileId, table.snapshotDate),
}));

export const sponsorships = pgTable('sponsorships', {
    id: uuid('id').defaultRandom().primaryKey(),
    sponsorUserId: uuid('sponsor_user_id').notNull().references(() => users.id),
    beneficiaryUserId: uuid('beneficiary_user_id').references(() => users.id),
    programId: uuid('program_id').notNull().references(() => programs.id),
    mode: text('mode').notNull().default('reward'),
    fundingType: text('funding_type').notNull().default('fiat'),
    budgetCents: integer('budget_cents'),
    budgetCryptoAmount: numeric('budget_crypto_amount', { precision: 20, scale: 8 }),
    cryptoSymbol: text('crypto_symbol'),
    rewardRule: text('reward_rule'),
    status: text('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
});

export const sponsorshipLinks = pgTable('sponsorship_links', {
    id: uuid('id').defaultRandom().primaryKey(),
    sponsorshipId: uuid('sponsorship_id').notNull().references(() => sponsorships.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    status: text('status').notNull().default('active'),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const questionTags = pgTable('question_tags', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
});

export const questionTagLinks = pgTable('question_tag_links', {
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').notNull().references(() => questionTags.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.questionId, table.tagId] }),
}));

export const aiGenerationJobs = pgTable('ai_generation_jobs', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    programId: uuid('program_id').references(() => programs.id),
    trailId: uuid('trail_id').references(() => programTrails.id),
    topicId: uuid('topic_id').references(() => topics.id),
    promptText: text('prompt_text'),
    sourceMaterialUrl: text('source_material_url'),
    sourceMaterialText: text('source_material_text'),
    status: text('status').notNull().default('pending'),
    providerName: text('provider_name'),
    generatedCount: integer('generated_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const aiGenerationItems = pgTable('ai_generation_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    jobId: uuid('job_id').notNull().references(() => aiGenerationJobs.id, { onDelete: 'cascade' }),
    draftPayloadJson: text('draft_payload_json').notNull(),
    validationStatus: text('validation_status').notNull().default('pending'),
    reviewNotes: text('review_notes'),
    approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
});
