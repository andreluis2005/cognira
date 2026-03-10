import { z } from 'zod';

const optionSchema = z.object({
    label: z.enum(['A', 'B', 'C', 'D']),
    body: z.string().min(1),
    isCorrect: z.boolean(),
});

const draftSchema = z.object({
    topicId: z.string().nullable().optional(),
    stem: z.string().min(1),
    explanation: z.string().min(1),
    difficultyLevel: z.enum(['easy', 'medium', 'hard']).default('medium'),
    options: z.array(optionSchema).length(4),
});

type DraftPayload = z.infer<typeof draftSchema>;

type DraftGeneratorInput = {
    promptText: string;
    programTitle: string;
    topicId: string | null;
    topicTitle: string;
    trailTitle?: string | null;
};

type DraftGeneratorResult = {
    providerName: string;
    payloads: DraftPayload[];
};

function parseQuestionCount(promptText: string) {
    const match = promptText.match(/Quantidade alvo:\s*(\d+)/i);
    const count = match ? Number(match[1]) : 10;
    return Number.isFinite(count) ? Math.min(Math.max(count, 1), 20) : 10;
}

function extractPromptLine(promptText: string, prefix: string) {
    const line = promptText.split('\n').find((entry) => entry.startsWith(prefix));
    return line ? line.replace(prefix, '').trim() : '';
}

function createLocalDraftPayloads(input: DraftGeneratorInput): DraftPayload[] {
    const { programTitle, topicId, topicTitle, trailTitle, promptText } = input;
    const total = parseQuestionCount(promptText);
    const objective = extractPromptLine(promptText, 'Objetivo do lote:');
    const themesText = extractPromptLine(promptText, 'Temas com maior chance de incidencia:')
        || extractPromptLine(promptText, 'Temas com maior chance de incidência:')
        || extractPromptLine(promptText, 'Evidencias e padroes historicos:')
        || extractPromptLine(promptText, 'Distribuicao de dificuldade desejada:');

    const themes = themesText
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean);

    const baseThemes = themes.length > 0 ? themes : [topicTitle, objective || 'conceitos centrais'];

    return Array.from({ length: total }, (_, index) => {
        const theme = baseThemes[index % baseThemes.length];
        const emphasis = objective || `memorizacao e retencao em ${topicTitle}`;
        const trailPrefix = trailTitle ? `${trailTitle} - ` : '';

        return {
            topicId,
            stem: `No contexto de ${programTitle}, considere o tema "${theme}". Qual afirmacao representa melhor o ponto mais relevante para ${emphasis}?`,
            explanation: `Este rascunho foi gerado para reforcar ${theme} dentro de ${trailPrefix}${topicTitle}. A alternativa correta resume o ponto mais cobravel ou memoravel do tema.`,
            difficultyLevel: index % 5 === 0 ? 'hard' : index % 2 === 0 ? 'medium' : 'easy',
            options: [
                {
                    label: 'A',
                    body: `Apresenta uma sintese correta e prioritaria sobre ${theme}, com foco em cobranca recorrente e memorizacao.`,
                    isCorrect: true,
                },
                {
                    label: 'B',
                    body: `Mistura ${theme} com um conceito periferico, gerando confusao comum em revisoes superficiais.`,
                    isCorrect: false,
                },
                {
                    label: 'C',
                    body: `Traz uma afirmacao plausivel, mas deslocada do foco central normalmente mais cobrado.`,
                    isCorrect: false,
                },
                {
                    label: 'D',
                    body: `Apresenta uma generalizacao incorreta sobre ${theme}, sem aderencia ao foco principal do estudo.`,
                    isCorrect: false,
                },
            ],
        };
    });
}

function normalizeRemoteDrafts(rawDrafts: unknown[], fallbackTopicId: string | null): DraftPayload[] {
    return rawDrafts.map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new Error('Remote draft item must be an object');
        }

        const parsed = draftSchema.parse({
            ...(item as Record<string, unknown>),
            topicId: typeof (item as { topicId?: unknown }).topicId === 'string'
                ? (item as { topicId: string }).topicId
                : fallbackTopicId,
        });

        const correctCount = parsed.options.filter((option) => option.isCorrect).length;
        if (correctCount !== 1) {
            throw new Error('Remote draft must contain exactly one correct option');
        }

        return parsed;
    });
}

async function generateWithOpenAICompatible(input: DraftGeneratorInput): Promise<DraftGeneratorResult | null> {
    const apiKey = process.env.AI_PROVIDER_API_KEY;
    const baseUrl = process.env.AI_PROVIDER_BASE_URL;
    const model = process.env.AI_PROVIDER_MODEL;

    if (!apiKey || !baseUrl || !model) {
        return null;
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Voce gera rascunhos de questoes de multipla escolha em JSON valido. Responda apenas com {"drafts":[...]} contendo exatamente 4 opcoes por questao e uma unica opcao correta.',
                },
                {
                    role: 'user',
                    content: [
                        `Programa: ${input.programTitle}`,
                        `Topico: ${input.topicTitle}`,
                        input.trailTitle ? `Trilha: ${input.trailTitle}` : '',
                        `Instrucoes editoriais:\n${input.promptText}`,
                        `Quantidade alvo: ${parseQuestionCount(input.promptText)}`,
                        'Gere um JSON com a chave "drafts". Cada draft deve ter: stem, explanation, difficultyLevel (easy|medium|hard), options [{label, body, isCorrect}].',
                    ].filter(Boolean).join('\n\n'),
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`AI provider error: ${response.status}`);
    }

    const data = await response.json() as {
        choices?: Array<{
            message?: {
                content?: string;
            };
        }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('AI provider returned empty content');
    }

    const parsed = JSON.parse(content) as { drafts?: unknown[] };
    if (!Array.isArray(parsed.drafts) || parsed.drafts.length === 0) {
        throw new Error('AI provider returned no drafts');
    }

    return {
        providerName: process.env.AI_PROVIDER_NAME || 'openai-compatible',
        payloads: normalizeRemoteDrafts(parsed.drafts, input.topicId),
    };
}

export async function generateQuestionDrafts(input: DraftGeneratorInput): Promise<DraftGeneratorResult> {
    try {
        const remoteResult = await generateWithOpenAICompatible(input);
        if (remoteResult) {
            return remoteResult;
        }
    } catch (error) {
        console.error('AI provider failed, falling back to local drafts:', error);
    }

    return {
        providerName: 'local-heuristic',
        payloads: createLocalDraftPayloads(input),
    };
}
