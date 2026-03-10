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

export interface TopicProgress {
  topicId: string;
  attempts: number;
  correct: number;
  accuracy: number; // calculated
  status: TopicStatus;
  masteryLevel: number; // Keep for SRS logic compatibility
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
}
