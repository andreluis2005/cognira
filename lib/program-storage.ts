import { UserProgress } from '@/lib/types';

const PROGRAM_STORAGE_PREFIX = 'cognira_program_progress';

function createEmptyProgress(userId: string): UserProgress {
    return {
        userId,
        readinessScore: 0,
        streak: 0,
        lastSessionDate: '',
        topics: {},
        questionsHistory: {},
    };
}

export function getProgramProgress(programId: string, userId = 'guest-user'): UserProgress {
    if (typeof window === 'undefined') {
        return createEmptyProgress(userId);
    }

    const stored = localStorage.getItem(`${PROGRAM_STORAGE_PREFIX}:${programId}`);
    if (!stored) {
        return createEmptyProgress(userId);
    }

    try {
        const parsed = JSON.parse(stored) as UserProgress;
        return {
            ...createEmptyProgress(userId),
            ...parsed,
        };
    } catch {
        return createEmptyProgress(userId);
    }
}

export function saveProgramProgress(programId: string, progress: UserProgress) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${PROGRAM_STORAGE_PREFIX}:${programId}`, JSON.stringify(progress));
}
