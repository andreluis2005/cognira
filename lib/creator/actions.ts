'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateQuestionDrafts } from '@/lib/ai/draft-generator';
import { db } from '@/lib/db/client';
import { ensureCreatorProfile, requireReviewAccess } from '@/lib/db/account';
import { aiGenerationItems, aiGenerationJobs, programTrails, programs, questionOptions, questions, topics } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils/slugify';

function toSlugWithSuffix(base: string, suffix = 0) {
    return suffix === 0 ? base : `${base}-${suffix}`;
}

async function createUniqueProgramSlug(baseTitle: string, creatorProfileId: string) {
    const base = slugify(baseTitle) || 'programa';

    for (let suffix = 0; suffix < 100; suffix += 1) {
        const candidate = toSlugWithSuffix(base, suffix);
        const existing = await db.query.programs.findFirst({
            where: and(
                eq(programs.slug, candidate),
                eq(programs.creatorProfileId, creatorProfileId),
            ),
        });

        if (!existing) {
            return candidate;
        }
    }

    return `${base}-${Date.now()}`;
}

async function assertProgramOwnership(programId: string) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        redirect('/login');
    }

    const creatorProfile = await ensureCreatorProfile(data.user);

    const ownedProgram = await db.query.programs.findFirst({
        where: and(
            eq(programs.id, programId),
            eq(programs.creatorProfileId, creatorProfile.id),
        ),
    });

    if (!ownedProgram) {
        redirect('/creator?error=Programa%20nao%20encontrado');
    }

    return { user: data.user, creatorProfile, ownedProgram };
}

async function assertReviewAccessWithUser() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        redirect('/login');
    }

    try {
        const roles = await requireReviewAccess(data.user);
        return { user: data.user, roles };
    } catch {
        redirect('/creator?error=Voce%20nao%20tem%20permissao%20para%20aprovar%20publicacoes');
    }
}

async function assertTrailOwnership(programId: string, trailId: string) {
    await assertProgramOwnership(programId);

    const trail = await db.query.programTrails.findFirst({
        where: and(
            eq(programTrails.id, trailId),
            eq(programTrails.programId, programId),
        ),
    });

    if (!trail) {
        redirect(`/creator/programs/${programId}?error=Trilha%20nao%20encontrada`);
    }

    return trail;
}

async function assertTopicOwnership(programId: string, topicId: string) {
    await assertProgramOwnership(programId);

    const topic = await db.query.topics.findFirst({
        where: and(
            eq(topics.id, topicId),
            eq(topics.programId, programId),
        ),
    });

    if (!topic) {
        redirect(`/creator/programs/${programId}?error=Topico%20nao%20encontrado`);
    }

    return topic;
}

async function assertQuestionOwnership(programId: string, questionId: string) {
    const ownership = await assertProgramOwnership(programId);

    const question = await db.query.questions.findFirst({
        where: and(
            eq(questions.id, questionId),
            eq(questions.programId, programId),
        ),
    });

    if (!question) {
        redirect(`/creator/programs/${programId}?error=Questao%20nao%20encontrada`);
    }

    return { ...ownership, question };
}

async function assertAIGenerationJobOwnership(programId: string, jobId: string) {
    const { user } = await assertProgramOwnership(programId);

    const job = await db.query.aiGenerationJobs.findFirst({
        where: and(
            eq(aiGenerationJobs.id, jobId),
            eq(aiGenerationJobs.programId, programId),
            eq(aiGenerationJobs.userId, user.id),
        ),
    });

    if (!job) {
        redirect(`/creator/programs/${programId}?error=Brief%20de%20geracao%20nao%20encontrado`);
    }

    return { user, job };
}

async function assertAIGenerationItemOwnership(programId: string, itemId: string) {
    const { user } = await assertProgramOwnership(programId);

    const rows = await db
        .select({
            itemId: aiGenerationItems.id,
            draftPayloadJson: aiGenerationItems.draftPayloadJson,
            validationStatus: aiGenerationItems.validationStatus,
            jobId: aiGenerationJobs.id,
            topicId: aiGenerationJobs.topicId,
            trailId: aiGenerationJobs.trailId,
            providerName: aiGenerationJobs.providerName,
        })
        .from(aiGenerationItems)
        .innerJoin(aiGenerationJobs, eq(aiGenerationItems.jobId, aiGenerationJobs.id))
        .where(
            and(
                eq(aiGenerationItems.id, itemId),
                eq(aiGenerationJobs.programId, programId),
                eq(aiGenerationJobs.userId, user.id),
            ),
        )
        .limit(1);

    const item = rows[0];

    if (!item) {
        redirect(`/creator/programs/${programId}?error=Rascunho%20de%20IA%20nao%20encontrado`);
    }

    return { user, item };
}

function parseQuestionCount(promptText: string) {
    const match = promptText.match(/Quantidade alvo:\s*(\d+)/i);
    const count = match ? Number(match[1]) : 10;
    return Number.isFinite(count) ? Math.min(Math.max(count, 1), 20) : 10;
}

function extractPromptLine(promptText: string, prefix: string) {
    const line = promptText.split('\n').find((entry) => entry.startsWith(prefix));
    return line ? line.replace(prefix, '').trim() : '';
}

function createDraftPayloads({
    programTitle,
    topicId,
    topicTitle,
    trailTitle,
    promptText,
}: {
    programTitle: string;
    topicId: string | null;
    topicTitle: string;
    trailTitle?: string | null;
    promptText: string;
}) {
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

async function createUniqueTrailSlug(programId: string, baseTitle: string) {
    const base = slugify(baseTitle) || 'trilha';

    for (let suffix = 0; suffix < 100; suffix += 1) {
        const candidate = toSlugWithSuffix(base, suffix);
        const existing = await db.query.programTrails.findFirst({
            where: and(
                eq(programTrails.programId, programId),
                eq(programTrails.slug, candidate),
            ),
        });

        if (!existing) {
            return candidate;
        }
    }

    return `${base}-${Date.now()}`;
}

async function createUniqueTopicSlug(programId: string, baseTitle: string) {
    const base = slugify(baseTitle) || 'topico';

    for (let suffix = 0; suffix < 100; suffix += 1) {
        const candidate = toSlugWithSuffix(base, suffix);
        const existing = await db.query.topics.findFirst({
            where: and(
                eq(topics.programId, programId),
                eq(topics.slug, candidate),
            ),
        });

        if (!existing) {
            return candidate;
        }
    }

    return `${base}-${Date.now()}`;
}

export async function createProgram(formData: FormData) {
    const title = String(formData.get('title') || '').trim();
    const shortDescription = String(formData.get('short_description') || '').trim();
    const subjectArea = String(formData.get('subject_area') || '').trim();
    const examType = String(formData.get('exam_type') || '').trim();
    const monetizationType = String(formData.get('monetization_type') || 'free').trim();
    const visibility = String(formData.get('visibility') || 'public').trim();

    if (!title || !shortDescription || !subjectArea) {
        redirect('/creator/programs/new?error=Preencha%20titulo%2C%20descricao%20e%20area');
    }

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        redirect('/login');
    }

    const creatorProfile = await ensureCreatorProfile(data.user);
    const slug = await createUniqueProgramSlug(title, creatorProfile.id);

    await db.insert(programs).values({
        creatorProfileId: creatorProfile.id,
        title,
        slug,
        shortDescription,
        longDescription: shortDescription,
        subjectArea,
        examType: examType || null,
        monetizationType,
        visibility,
        status: 'draft',
        reviewStatus: 'draft',
    });

    revalidatePath('/creator');
    revalidatePath('/programs');
    redirect('/creator?created=1');
}

export async function updateProgram(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const title = String(formData.get('title') || '').trim();
    const shortDescription = String(formData.get('short_description') || '').trim();
    const longDescription = String(formData.get('long_description') || '').trim();
    const subjectArea = String(formData.get('subject_area') || '').trim();
    const examType = String(formData.get('exam_type') || '').trim();
    const monetizationType = String(formData.get('monetization_type') || 'free').trim();
    const visibility = String(formData.get('visibility') || 'public').trim();

    if (!programId || !title || !shortDescription || !subjectArea) {
        redirect(`/creator/programs/${programId}?error=Preencha%20os%20dados%20obrigatorios%20do%20programa`);
    }

    const { creatorProfile, ownedProgram } = await assertProgramOwnership(programId);

    await db
        .update(programs)
        .set({
            title,
            shortDescription,
            longDescription: longDescription || shortDescription,
            subjectArea,
            examType: examType || null,
            monetizationType,
            visibility,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(programs.id, programId),
                eq(programs.creatorProfileId, creatorProfile.id),
            ),
        );

    revalidatePath('/creator');
    revalidatePath(`/creator/programs/${programId}`);
    revalidatePath('/programs');
    revalidatePath(`/programs/${ownedProgram.slug}`);
    redirect(`/creator/programs/${programId}?programUpdated=1`);
}

export async function submitProgramForReview(formData: FormData) {
    const programId = String(formData.get('program_id') || '');

    if (!programId) {
        redirect('/creator?error=Programa%20invalido');
    }

    const { creatorProfile } = await assertProgramOwnership(programId);

    await db
        .update(programs)
        .set({
            status: 'draft',
            reviewStatus: 'submitted',
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(programs.id, programId),
                eq(programs.creatorProfileId, creatorProfile.id),
            ),
        );

    revalidatePath('/creator');
    revalidatePath('/admin/review');
    revalidatePath('/programs');
    redirect('/creator?submitted=1');
}

export async function unpublishProgram(formData: FormData) {
    const programId = String(formData.get('program_id') || '');

    if (!programId) {
        redirect('/creator?error=Programa%20invalido');
    }

    const { creatorProfile, ownedProgram } = await assertProgramOwnership(programId);

    await db
        .update(programs)
        .set({
            status: 'draft',
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(programs.id, programId),
                eq(programs.creatorProfileId, creatorProfile.id),
            ),
        );

    revalidatePath('/creator');
    revalidatePath('/programs');
    revalidatePath(`/programs/${ownedProgram.slug}`);
    redirect(`/creator/programs/${programId}?programUpdated=1`);
}

export async function archiveProgram(formData: FormData) {
    const programId = String(formData.get('program_id') || '');

    if (!programId) {
        redirect('/creator?error=Programa%20invalido');
    }

    const { creatorProfile, ownedProgram } = await assertProgramOwnership(programId);

    await db
        .update(programs)
        .set({
            status: 'archived',
            visibility: 'private',
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(programs.id, programId),
                eq(programs.creatorProfileId, creatorProfile.id),
            ),
        );

    revalidatePath('/creator');
    revalidatePath('/admin/review');
    revalidatePath('/programs');
    revalidatePath(`/programs/${ownedProgram.slug}`);
    redirect('/creator?archived=1');
}

export async function approveProgramPublication(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();

    if (!programId) {
        redirect('/admin/review?error=Programa%20invalido');
    }

    const { user } = await assertReviewAccessWithUser();

    const program = await db.query.programs.findFirst({
        where: eq(programs.id, programId),
    });

    if (!program) {
        redirect('/admin/review?error=Programa%20nao%20encontrado');
    }

    await db
        .update(programs)
        .set({
            status: 'published',
            reviewStatus: 'approved',
            publishedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(programs.id, programId));

    revalidatePath('/creator');
    revalidatePath('/admin/review');
    revalidatePath('/programs');
    revalidatePath(`/programs/${program.slug}`);
    redirect('/admin/review?approved=1');
}

export async function requestProgramChanges(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();

    if (!programId) {
        redirect('/admin/review?error=Programa%20invalido');
    }

    await assertReviewAccessWithUser();

    const program = await db.query.programs.findFirst({
        where: eq(programs.id, programId),
    });

    if (!program) {
        redirect('/admin/review?error=Programa%20nao%20encontrado');
    }

    await db
        .update(programs)
        .set({
            status: 'draft',
            reviewStatus: 'changes_requested',
            updatedAt: new Date(),
        })
        .where(eq(programs.id, programId));

    revalidatePath('/creator');
    revalidatePath('/admin/review');
    redirect('/admin/review?changesRequested=1');
}

export async function createTrail(formData: FormData) {
    const programId = String(formData.get('program_id') || '');
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();

    if (!programId || !title) {
        redirect('/creator?error=Dados%20invalidos%20para%20trilha');
    }

    await assertProgramOwnership(programId);

    const existingCount = await db.$count(programTrails, eq(programTrails.programId, programId));
    const slug = await createUniqueTrailSlug(programId, title);

    await db.insert(programTrails).values({
        programId,
        title,
        slug,
        description: description || null,
        position: existingCount,
    });

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?trailCreated=1`);
}

export async function updateTrail(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const trailId = String(formData.get('trail_id') || '').trim();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();

    if (!programId || !trailId || !title) {
        redirect(`/creator/programs/${programId}?error=Dados%20invalidos%20para%20editar%20trilha`);
    }

    await assertTrailOwnership(programId, trailId);

    await db
        .update(programTrails)
        .set({
            title,
            description: description || null,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(programTrails.id, trailId),
                eq(programTrails.programId, programId),
            ),
        );

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?trailUpdated=1`);
}

export async function deleteTrail(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const trailId = String(formData.get('trail_id') || '').trim();

    if (!programId || !trailId) {
        redirect(`/creator/programs/${programId}?error=Trilha%20invalida`);
    }

    await assertTrailOwnership(programId, trailId);

    await db
        .update(topics)
        .set({
            trailId: null,
            updatedAt: new Date(),
        })
        .where(and(eq(topics.programId, programId), eq(topics.trailId, trailId)));

    await db
        .update(questions)
        .set({
            trailId: null,
            updatedAt: new Date(),
        })
        .where(and(eq(questions.programId, programId), eq(questions.trailId, trailId)));

    await db
        .delete(programTrails)
        .where(and(eq(programTrails.id, trailId), eq(programTrails.programId, programId)));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?trailDeleted=1`);
}

export async function createTopic(formData: FormData) {
    const programId = String(formData.get('program_id') || '');
    const trailId = String(formData.get('trail_id') || '').trim();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const examWeight = String(formData.get('exam_weight') || '').trim();

    if (!programId || !title) {
        redirect('/creator?error=Dados%20invalidos%20para%20topico');
    }

    await assertProgramOwnership(programId);

    const existingCount = await db.$count(topics, eq(topics.programId, programId));
    const slug = await createUniqueTopicSlug(programId, title);

    await db.insert(topics).values({
        programId,
        trailId: trailId || null,
        title,
        slug,
        description: description || null,
        examWeight: examWeight || null,
        position: existingCount,
    });

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?topicCreated=1`);
}

export async function updateTopic(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const topicId = String(formData.get('topic_id') || '').trim();
    const trailId = String(formData.get('trail_id') || '').trim();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const examWeight = String(formData.get('exam_weight') || '').trim();

    if (!programId || !topicId || !title) {
        redirect(`/creator/programs/${programId}?error=Dados%20invalidos%20para%20editar%20topico`);
    }

    await assertTopicOwnership(programId, topicId);

    if (trailId) {
        await assertTrailOwnership(programId, trailId);
    }

    await db
        .update(topics)
        .set({
            trailId: trailId || null,
            title,
            description: description || null,
            examWeight: examWeight || null,
            updatedAt: new Date(),
        })
        .where(and(eq(topics.id, topicId), eq(topics.programId, programId)));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?topicUpdated=1`);
}

export async function deleteTopic(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const topicId = String(formData.get('topic_id') || '').trim();

    if (!programId || !topicId) {
        redirect(`/creator/programs/${programId}?error=Topico%20invalido`);
    }

    await assertTopicOwnership(programId, topicId);

    const questionCount = await db.$count(
        questions,
        and(eq(questions.programId, programId), eq(questions.topicId, topicId)),
    );

    if (questionCount > 0) {
        redirect(`/creator/programs/${programId}?error=Remova%20as%20questoes%20do%20topico%20antes%20de%20exclui-lo`);
    }

    await db
        .delete(topics)
        .where(and(eq(topics.id, topicId), eq(topics.programId, programId)));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?topicDeleted=1`);
}

export async function createQuestion(formData: FormData) {
    const programId = String(formData.get('program_id') || '');
    const topicId = String(formData.get('topic_id') || '').trim();
    const stem = String(formData.get('stem') || '').trim();
    const explanation = String(formData.get('explanation') || '').trim();
    const difficultyLevel = String(formData.get('difficulty_level') || 'medium').trim();
    const correctOption = String(formData.get('correct_option') || 'A').trim();

    const optionA = String(formData.get('option_a') || '').trim();
    const optionB = String(formData.get('option_b') || '').trim();
    const optionC = String(formData.get('option_c') || '').trim();
    const optionD = String(formData.get('option_d') || '').trim();

    if (!programId || !topicId || !stem || !explanation || !optionA || !optionB || !optionC || !optionD) {
        redirect(`/creator/programs/${programId}?error=Preencha%20todos%20os%20campos%20da%20questao`);
    }

    const { user } = await assertProgramOwnership(programId);

    const topic = await db.query.topics.findFirst({
        where: and(
            eq(topics.id, topicId),
            eq(topics.programId, programId),
        ),
    });

    if (!topic) {
        redirect(`/creator/programs/${programId}?error=Topico%20invalido`);
    }

    const inserted = await db.insert(questions).values({
        programId,
        trailId: topic.trailId,
        topicId,
        authorUserId: user.id,
        stem,
        explanation,
        difficultyLevel,
        status: 'draft',
        originType: 'manual',
    }).returning();

    const question = inserted[0];

    await db.insert(questionOptions).values([
        {
            questionId: question.id,
            label: 'A',
            body: optionA,
            isCorrect: correctOption === 'A',
            position: 0,
        },
        {
            questionId: question.id,
            label: 'B',
            body: optionB,
            isCorrect: correctOption === 'B',
            position: 1,
        },
        {
            questionId: question.id,
            label: 'C',
            body: optionC,
            isCorrect: correctOption === 'C',
            position: 2,
        },
        {
            questionId: question.id,
            label: 'D',
            body: optionD,
            isCorrect: correctOption === 'D',
            position: 3,
        },
    ]);

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?questionCreated=1`);
}

export async function updateQuestion(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const questionId = String(formData.get('question_id') || '').trim();
    const topicId = String(formData.get('topic_id') || '').trim();
    const stem = String(formData.get('stem') || '').trim();
    const explanation = String(formData.get('explanation') || '').trim();
    const difficultyLevel = String(formData.get('difficulty_level') || 'medium').trim();
    const correctOption = String(formData.get('correct_option') || 'A').trim();
    const optionA = String(formData.get('option_a') || '').trim();
    const optionB = String(formData.get('option_b') || '').trim();
    const optionC = String(formData.get('option_c') || '').trim();
    const optionD = String(formData.get('option_d') || '').trim();

    if (!programId || !questionId || !topicId || !stem || !explanation || !optionA || !optionB || !optionC || !optionD) {
        redirect(`/creator/programs/${programId}?error=Preencha%20todos%20os%20campos%20da%20questao`);
    }

    const { question } = await assertQuestionOwnership(programId, questionId);
    const topic = await assertTopicOwnership(programId, topicId);

    await db
        .update(questions)
        .set({
            topicId,
            trailId: topic.trailId,
            stem,
            explanation,
            difficultyLevel,
            updatedAt: new Date(),
        })
        .where(and(eq(questions.id, question.id), eq(questions.programId, programId)));

    await db.delete(questionOptions).where(eq(questionOptions.questionId, questionId));

    await db.insert(questionOptions).values([
        {
            questionId,
            label: 'A',
            body: optionA,
            isCorrect: correctOption === 'A',
            position: 0,
        },
        {
            questionId,
            label: 'B',
            body: optionB,
            isCorrect: correctOption === 'B',
            position: 1,
        },
        {
            questionId,
            label: 'C',
            body: optionC,
            isCorrect: correctOption === 'C',
            position: 2,
        },
        {
            questionId,
            label: 'D',
            body: optionD,
            isCorrect: correctOption === 'D',
            position: 3,
        },
    ]);

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?questionUpdated=1`);
}

export async function deleteQuestion(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const questionId = String(formData.get('question_id') || '').trim();

    if (!programId || !questionId) {
        redirect(`/creator/programs/${programId}?error=Questao%20invalida`);
    }

    await assertQuestionOwnership(programId, questionId);

    await db
        .delete(questions)
        .where(and(eq(questions.id, questionId), eq(questions.programId, programId)));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?questionDeleted=1`);
}

export async function createAIGenerationJob(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const topicId = String(formData.get('topic_id') || '').trim();
    const trailId = String(formData.get('trail_id') || '').trim();
    const objective = String(formData.get('objective') || '').trim();
    const providerName = String(formData.get('provider_name') || 'manual-brief').trim();
    const sourceMaterialUrl = String(formData.get('source_material_url') || '').trim();
    const sourceMaterialText = String(formData.get('source_material_text') || '').trim();
    const examType = String(formData.get('exam_type') || '').trim();
    const boardName = String(formData.get('board_name') || '').trim();
    const roleName = String(formData.get('role_name') || '').trim();
    const examYearRange = String(formData.get('exam_year_range') || '').trim();
    const priorityThemes = String(formData.get('priority_themes') || '').trim();
    const evidenceNotes = String(formData.get('evidence_notes') || '').trim();
    const difficultyMix = String(formData.get('difficulty_mix') || '').trim();
    const questionCount = String(formData.get('question_count') || '10').trim();

    if (!programId || !objective) {
        redirect(`/creator/programs/${programId}?error=Preencha%20o%20brief%20de%20geracao`);
    }

    const { user, ownedProgram } = await assertProgramOwnership(programId);

    if (topicId) {
        await assertTopicOwnership(programId, topicId);
    }

    if (trailId) {
        await assertTrailOwnership(programId, trailId);
    }

    const isConcurso = /concurso/i.test(examType || ownedProgram.examType || '') || /concurso/i.test(ownedProgram.subjectArea);

    const promptText = [
        `Objetivo do lote: ${objective}`,
        `Programa: ${ownedProgram.title}`,
        examType || ownedProgram.examType ? `Tipo de prova: ${examType || ownedProgram.examType}` : '',
        boardName ? `Banca: ${boardName}` : '',
        roleName ? `Cargo ou area: ${roleName}` : '',
        examYearRange ? `Janela historica para analise: ${examYearRange}` : '',
        priorityThemes ? `Temas com maior chance de incidencia: ${priorityThemes}` : '',
        evidenceNotes ? `Evidencias e padroes historicos: ${evidenceNotes}` : '',
        difficultyMix ? `Distribuicao de dificuldade desejada: ${difficultyMix}` : '',
        questionCount ? `Quantidade alvo: ${questionCount}` : '',
        isConcurso
            ? 'Instrucao adicional: priorizar padroes recorrentes em provas anteriores, topicos de alta incidencia e formulacoes proximas ao estilo de banca.'
            : 'Instrucao adicional: priorizar topicos centrais, objetivos de memorizacao e cobertura pedagógica do assunto.',
    ].filter(Boolean).join('\n');

    await db.insert(aiGenerationJobs).values({
        userId: user.id,
        programId,
        trailId: trailId || null,
        topicId: topicId || null,
        promptText,
        sourceMaterialUrl: sourceMaterialUrl || null,
        sourceMaterialText: sourceMaterialText || null,
        status: 'pending',
        providerName,
        generatedCount: 0,
    });

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?programUpdated=1`);
}

export async function generateAIDraftItems(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const jobId = String(formData.get('job_id') || '').trim();

    if (!programId || !jobId) {
        redirect(`/creator/programs/${programId}?error=Brief%20de%20geracao%20invalido`);
    }

    const { job } = await assertAIGenerationJobOwnership(programId, jobId);

    const existingItems = await db.$count(aiGenerationItems, eq(aiGenerationItems.jobId, jobId));
    if (existingItems > 0) {
        redirect(`/creator/programs/${programId}?error=Este%20brief%20ja%20possui%20rascunhos%20gerados`);
    }

    const [program, topic, trail] = await Promise.all([
        db.query.programs.findFirst({ where: eq(programs.id, programId) }),
        job.topicId ? db.query.topics.findFirst({ where: eq(topics.id, job.topicId) }) : null,
        job.trailId ? db.query.programTrails.findFirst({ where: eq(programTrails.id, job.trailId) }) : null,
    ]);

    if (!program) {
        redirect(`/creator/programs/${programId}?error=Programa%20nao%20encontrado`);
    }

    const fallbackTopic = topic || await db.query.topics.findFirst({
        where: eq(topics.programId, programId),
    });

    if (!fallbackTopic) {
        redirect(`/creator/programs/${programId}?error=Crie%20ao%20menos%20um%20topico%20antes%20de%20gerar%20rascunhos`);
    }

    const generatedDrafts = await generateQuestionDrafts({
        programTitle: program.title,
        topicId: fallbackTopic.id,
        topicTitle: fallbackTopic.title,
        trailTitle: trail?.title || null,
        promptText: job.promptText || '',
    });

    await db.insert(aiGenerationItems).values(
        generatedDrafts.payloads.map((payload) => ({
            jobId,
            draftPayloadJson: JSON.stringify(payload),
            validationStatus: 'pending',
        })),
    );

    await db
        .update(aiGenerationJobs)
        .set({
            status: 'completed',
            providerName: generatedDrafts.providerName,
            generatedCount: generatedDrafts.payloads.length,
            completedAt: new Date(),
        })
        .where(eq(aiGenerationJobs.id, jobId));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?programUpdated=1`);
}

export async function updateAIGenerationItem(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const itemId = String(formData.get('item_id') || '').trim();
    const topicId = String(formData.get('topic_id') || '').trim();
    const stem = String(formData.get('stem') || '').trim();
    const explanation = String(formData.get('explanation') || '').trim();
    const difficultyLevel = String(formData.get('difficulty_level') || 'medium').trim();
    const correctOption = String(formData.get('correct_option') || 'A').trim();
    const optionA = String(formData.get('option_a') || '').trim();
    const optionB = String(formData.get('option_b') || '').trim();
    const optionC = String(formData.get('option_c') || '').trim();
    const optionD = String(formData.get('option_d') || '').trim();

    if (!programId || !itemId || !topicId || !stem || !explanation || !optionA || !optionB || !optionC || !optionD) {
        redirect(`/creator/programs/${programId}?error=Preencha%20todos%20os%20campos%20do%20rascunho`);
    }

    await assertTopicOwnership(programId, topicId);
    const { item } = await assertAIGenerationItemOwnership(programId, itemId);

    const payload = {
        topicId,
        stem,
        explanation,
        difficultyLevel,
        options: [
            { label: 'A', body: optionA, isCorrect: correctOption === 'A' },
            { label: 'B', body: optionB, isCorrect: correctOption === 'B' },
            { label: 'C', body: optionC, isCorrect: correctOption === 'C' },
            { label: 'D', body: optionD, isCorrect: correctOption === 'D' },
        ],
    };

    await db
        .update(aiGenerationItems)
        .set({
            draftPayloadJson: JSON.stringify(payload),
            validationStatus: item.validationStatus === 'rejected' ? 'pending' : item.validationStatus,
        })
        .where(eq(aiGenerationItems.id, itemId));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?programUpdated=1`);
}

export async function approveAIGenerationItem(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const itemId = String(formData.get('item_id') || '').trim();

    if (!programId || !itemId) {
        redirect(`/creator/programs/${programId}?error=Rascunho%20invalido`);
    }

    const { user, item } = await assertAIGenerationItemOwnership(programId, itemId);
    const payload = JSON.parse(item.draftPayloadJson) as {
        topicId: string | null;
        stem: string;
        explanation: string;
        difficultyLevel: string;
        options: Array<{ label: string; body: string; isCorrect: boolean }>;
    };

    if (!payload.topicId) {
        redirect(`/creator/programs/${programId}?error=Rascunho%20sem%20topico%20associado`);
    }

    const topic = await assertTopicOwnership(programId, payload.topicId);

    const inserted = await db.insert(questions).values({
        programId,
        trailId: topic.trailId,
        topicId: topic.id,
        authorUserId: user.id,
        stem: payload.stem,
        explanation: payload.explanation,
        difficultyLevel: payload.difficultyLevel || 'medium',
        status: 'draft',
        originType: 'ai_generated',
    }).returning();

    await db.insert(questionOptions).values(
        payload.options.map((option, index) => ({
            questionId: inserted[0].id,
            label: option.label,
            body: option.body,
            isCorrect: option.isCorrect,
            position: index,
        })),
    );

    await db
        .update(aiGenerationItems)
        .set({
            validationStatus: 'approved',
            approvedByUserId: user.id,
            approvedAt: new Date(),
        })
        .where(eq(aiGenerationItems.id, itemId));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?questionCreated=1`);
}

export async function rejectAIGenerationItem(formData: FormData) {
    const programId = String(formData.get('program_id') || '').trim();
    const itemId = String(formData.get('item_id') || '').trim();

    if (!programId || !itemId) {
        redirect(`/creator/programs/${programId}?error=Rascunho%20invalido`);
    }

    await assertAIGenerationItemOwnership(programId, itemId);

    await db
        .update(aiGenerationItems)
        .set({
            validationStatus: 'rejected',
        })
        .where(eq(aiGenerationItems.id, itemId));

    revalidatePath(`/creator/programs/${programId}`);
    redirect(`/creator/programs/${programId}?programUpdated=1`);
}
