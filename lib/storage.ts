import { UserProgress } from './types';

const STORAGE_KEY = 'memorizacloud_progress';

const DEFAULT_PROGRESS: UserProgress = {
    userId: 'guest-user',
    readinessScore: 0,
    streak: 0,
    lastSessionDate: '',
    topics: {
        'compute': { mastery: 0, correctAnswers: 0, totalAttempts: 0 },
        'storage': { mastery: 0, correctAnswers: 0, totalAttempts: 0 },
        'database': { mastery: 0, correctAnswers: 0, totalAttempts: 0 },
        'iam': { mastery: 0, correctAnswers: 0, totalAttempts: 0 },
        'network': { mastery: 0, correctAnswers: 0, totalAttempts: 0 },
    },
    questionsHistory: {},
};

export const getUserProgress = (): UserProgress => {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PROGRESS;
};

export const saveUserProgress = (progress: UserProgress) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};
