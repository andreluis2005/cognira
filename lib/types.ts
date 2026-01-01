export type Domain = 'compute' | 'storage' | 'database' | 'iam' | 'network';

export interface Question {
  id: string;
  certification: string;
  domain: Domain;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
  isReinforcement?: boolean;
}

export interface TopicProgress {
  mastery: number;
  correctAnswers: number;
  totalAttempts: number;
}

export interface QuestionHistory {
  lastAttempt: string;
  interval: number;
  lastResult: 'correct' | 'incorrect';
  consecutiveSuccesses: number;
}

export interface UserProgress {
  userId: string;
  readinessScore: number;
  streak: number;
  lastSessionDate: string;
  topics: Record<string, TopicProgress>;
  questionsHistory: Record<string, QuestionHistory>;
}
