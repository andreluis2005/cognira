import { UserProgress, TopicProgress, MacroDomain } from './types';
import { TOPICS } from './topics';
import { deriveMacroTopics } from './engine';

const STORAGE_KEY = 'cognira_progress';

export function createInitialProgress(): TopicProgress[] {
    return TOPICS.map(topic => ({
        topicId: topic.id,
        attempts: 0,
        correct: 0,
        accuracy: 0,
        status: "NOT_EVALUATED",
        masteryLevel: 0
    }));
}

const DEFAULT_PROGRESS: UserProgress = {
    userId: 'guest-user',
    readinessScore: 0,
    streak: 0,
    lastSessionDate: '',
    topics: createInitialProgress().reduce((acc, t) => ({ ...acc, [t.topicId]: t }), {}),
    questionsHistory: {},
};

export const getUserProgress = (): UserProgress => {
    if (typeof window === 'undefined') return { ...DEFAULT_PROGRESS, macroTopics: deriveMacroTopics(DEFAULT_PROGRESS.topics) };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_PROGRESS, macroTopics: deriveMacroTopics(DEFAULT_PROGRESS.topics) };

    try {
        const parsed = JSON.parse(stored);

        // Mapeamento de migração de domínios antigos para tópicos oficiais
        const domainMap: Record<string, string> = {
            'compute': 'EC2',
            'storage': 'S3',
            'database': 'RDS',
            'iam': 'IAM',
            'network': 'VPC',
            'security': 'SECURITY_GROUPS',
            'billing': 'BILLING_TOOLS',
            'management': 'WELL_ARCHITECTED',
            'migration': 'EC2',
            'support': 'SUPPORT_PLANS',
            'cloud_concepts': 'CLOUD_BENEFITS'
        };

        const migrateTopic = (topic: any, topicId: string): TopicProgress => ({
            topicId,
            attempts: topic.attempts ?? topic.totalAttempts ?? 0,
            correct: topic.correct ?? topic.correctAnswers ?? 0,
            accuracy: topic.accuracy ?? (topic.totalAttempts > 0 ? Math.round((topic.correctAnswers / topic.totalAttempts) * 100) : 0),
            masteryLevel: topic.masteryLevel ?? topic.mastery ?? 0,
            status: topic.status ?? ((topic.attempts || topic.totalAttempts) > 0 ? 'WEAK' : 'NOT_EVALUATED')
        });

        const migratedTopics = {} as Record<string, TopicProgress>;

        // Inicializa com padrões para garantir que todos os novos TOPICS existam
        TOPICS.forEach(t => {
            migratedTopics[t.id] = {
                topicId: t.id,
                attempts: 0,
                correct: 0,
                accuracy: 0,
                status: "NOT_EVALUATED",
                masteryLevel: 0
            };
        });

        // Tenta migrar dados existentes
        if (parsed.topics) {
            Object.entries(parsed.topics).forEach(([key, value]: [string, any]) => {
                const targetId = domainMap[key] || key;
                if (migratedTopics[targetId]) {
                    const migrated = migrateTopic(value, targetId);
                    // Combina se múltiplos domínios antigos mapearem para o mesmo tópico
                    migratedTopics[targetId].attempts += migrated.attempts;
                    migratedTopics[targetId].correct += migrated.correct;
                    migratedTopics[targetId].masteryLevel = Math.max(migratedTopics[targetId].masteryLevel, migrated.masteryLevel);
                }
            });

            // Recalcula acurácia e status após soma
            Object.values(migratedTopics).forEach(t => {
                if (t.attempts > 0) {
                    t.accuracy = Math.round((t.correct / t.attempts) * 100);
                    if (t.accuracy < 40) t.status = 'WEAK';
                    else if (t.accuracy < 70) t.status = 'EVOLVING';
                    else t.status = 'STRONG';
                }
            });
        }

        const baseProgress: UserProgress = {
            ...DEFAULT_PROGRESS,
            ...parsed,
            topics: migratedTopics,
        };

        // Adiciona macroTopics DERIVADOS (não vêm do localStorage)
        return {
            ...baseProgress,
            macroTopics: deriveMacroTopics(baseProgress.topics)
        };
    } catch (e) {
        console.error('Error parsing stored progress:', e);
        return { ...DEFAULT_PROGRESS, macroTopics: deriveMacroTopics(DEFAULT_PROGRESS.topics) };
    }
};

export const saveUserProgress = (progress: UserProgress) => {
    if (typeof window === 'undefined') return;
    // Strip derived macroTopics before saving to enforce "no independent state"
    const { macroTopics, ...toSave } = progress;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
};
