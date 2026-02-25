export type MacroDomain =
  | "D1_CLOUD_CONCEPTS"
  | "D2_SECURITY_COMPLIANCE"
  | "D3_TECHNOLOGY_SERVICES"
  | "D4_BILLING_SUPPORT";

export interface Topic {
  id: string;
  label: string;
  macroDomain: MacroDomain;
  examWeight: "LOW" | "MEDIUM" | "HIGH";
}

export interface Question {
  id: string;
  certification: string;
  topicId: string; // Updated from domain
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
  isReinforcement?: boolean;
}

/**
 * Topic States as defined in Step 2 of the logic correction.
 */
export type TopicStatus =
  | "NOT_EVALUATED"
  | "WEAK"
  | "EVOLVING"
  | "STRONG";

/**
 * Risk Zone classification for strategic study prioritization.
 * CRITICAL: High impact + low stability → needs immediate attention.
 * UNSTABLE: Oscillating or decaying performance.
 * SOLID: Consistent and reliable performance.
 */
export type RiskZone = 'CRITICAL' | 'UNSTABLE' | 'SOLID';

export interface TopicProgress {
  topicId: string;
  attempts: number;
  correct: number;
  accuracy: number; // calculated
  status: TopicStatus;
  masteryLevel: number; // Keep for SRS logic compatibility
  // ── Cognitive Extensions (optional, backward-compatible) ──
  riskScore?: number;         // [0, 100] — topic risk score
  riskZone?: RiskZone;        // CRITICAL | UNSTABLE | SOLID
  stabilityIndex?: number;    // CSI [0, 100] — cognitive stability
}

export interface QuestionHistory {
  lastAttempt: string;
  lastSeen: string;
  nextReview: string;
  masteryLevel: number; // 0-5
  consecutiveSuccesses: number;
  errorCount: number;
}

export interface UserProgress {
  userId: string;
  readinessScore: number;
  streak: number;
  lastSessionDate: string;
  topics: Record<string, TopicProgress>; // Source of truth: granular topics
  macroTopics?: Record<string, any>; // Pure aggregations (derived)
  questionsHistory: Record<string, QuestionHistory>;
  // ── Cognitive Extensions (optional, backward-compatible) ──
  avgCSI?: number;               // Average Cognitive Stability Index [0, 100]
  lastPressureScore?: number;    // Last pressure session score [0, 100]
  lastPressureDate?: string;     // ISO date of last pressure session
  confidenceIndex?: number;      // 0.7 × avgCSI + 0.3 × pressureScore [0, 100]
}

/**
 * Result of a Pressure Simulation session.
 */
export interface PressureSessionResult {
  /** Weighted score accounting for response time */
  pressureScore: number;        // ∈ [0, 100]
  /** Questions that timed out (memory blank indicator) */
  blankCount: number;
  /** Average response time in ms */
  avgResponseTime: number;
  /** Delta vs normal performance (negative = degradation under pressure) */
  pressureDelta: number;
  /** Topics that "broke" under pressure */
  fragileTopics: string[];
  /** Whether memory blank was detected */
  memoryBlankDetected: boolean;
}
