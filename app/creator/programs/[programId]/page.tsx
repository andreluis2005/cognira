import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
    createQuestion,
    createTopic,
    createTrail,
    approveAIGenerationItem,
    createAIGenerationJob,
    archiveProgram,
    deleteQuestion,
    deleteTopic,
    deleteTrail,
    submitProgramForReview,
    rejectAIGenerationItem,
    generateAIDraftItems,
    unpublishProgram,
    updateAIGenerationItem,
    updateProgram,
    updateQuestion,
    updateTopic,
    updateTrail,
} from '@/lib/creator/actions';
import { getCreatorProgramById } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';

function getFlagMessage(query: Record<string, string | undefined>) {
    if (query.programUpdated) return 'Programa atualizado com sucesso.';
    if (query.submitted) return 'Programa enviado para revisao editorial.';
    if (query.trailCreated) return 'Trilha criada com sucesso.';
    if (query.trailUpdated) return 'Trilha atualizada com sucesso.';
    if (query.trailDeleted) return 'Trilha removida com sucesso.';
    if (query.topicCreated) return 'Topico criado com sucesso.';
    if (query.topicUpdated) return 'Topico atualizado com sucesso.';
    if (query.topicDeleted) return 'Topico removido com sucesso.';
    if (query.questionCreated) return 'Questao criada com sucesso.';
    if (query.questionUpdated) return 'Questao atualizada com sucesso.';
    if (query.questionDeleted) return 'Questao removida com sucesso.';
    return null;
}

function getOptionValue(
    options: Array<{ label: string; body: string; isCorrect: boolean }>,
    label: string,
) {
    return options.find((option) => option.label === label)?.body || '';
}

function getCorrectOption(options: Array<{ label: string; body: string; isCorrect: boolean }>) {
    return options.find((option) => option.isCorrect)?.label || 'A';
}

function parseDraftPayload(payload: string) {
    try {
        return JSON.parse(payload) as {
            topicId?: string;
            stem: string;
            explanation: string;
            difficultyLevel: string;
            options: Array<{ label: string; body: string; isCorrect: boolean }>;
        };
    } catch {
        return null;
    }
}

export default async function CreatorProgramDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ programId: string }>;
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const { programId } = await params;
    const query = await searchParams;

    if (!data.user) {
        redirect('/login');
    }

    const program = await getCreatorProgramById(data.user.id, programId);

    if (!program) {
        notFound();
    }

    const successMessage = getFlagMessage(query);
    const isConcursoProgram = /concurso/i.test(program.examType || '') || /concurso/i.test(program.subjectArea || '');

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_28%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Link href="/creator" className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                                Creator Studio
                            </Link>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">{program.subjectArea}</p>
                                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{program.title}</h1>
                            </div>
                            <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base">
                                {program.shortDescription}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {program.status === 'published' ? (
                                <>
                                    <form action={unpublishProgram}>
                                        <input type="hidden" name="program_id" value={program.id} />
                                        <button className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200">
                                            Voltar para rascunho
                                        </button>
                                    </form>
                                    <form action={archiveProgram}>
                                        <input type="hidden" name="program_id" value={program.id} />
                                        <button className="rounded-2xl border border-amber-500/40 px-5 py-3 text-sm font-bold text-amber-200">
                                            Arquivar
                                        </button>
                                    </form>
                                </>
                            ) : program.reviewStatus === 'submitted' ? (
                                <span className="rounded-2xl border border-amber-500/40 px-5 py-3 text-sm font-bold text-amber-200">
                                    Em revisao editorial
                                </span>
                            ) : (
                                <form action={submitProgramForReview}>
                                    <input type="hidden" name="program_id" value={program.id} />
                                    <button className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                        Enviar para revisao
                                    </button>
                                </form>
                            )}

                            <Link
                                href={program.status === 'published' ? `/programs/${program.slug}` : '/programs'}
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                {program.status === 'published' ? 'Ver pagina publica' : 'Ver catalogo'}
                            </Link>
                        </div>
                    </div>
                </header>

                {successMessage ? (
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
                        {successMessage}
                    </div>
                ) : null}

                {query.error ? (
                    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
                        {query.error}
                    </div>
                ) : null}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Status</p>
                        <p className="mt-3 text-xl font-black capitalize">{program.status}</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Visibilidade</p>
                        <p className="mt-3 text-xl font-black capitalize">{program.visibility}</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Trilhas</p>
                        <p className="mt-3 text-xl font-black">{program.trails.length}</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Questoes</p>
                        <p className="mt-3 text-xl font-black">{program.questions.length}</p>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <form action={updateProgram} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <input type="hidden" name="program_id" value={program.id} />
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Programa</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Dados principais</h2>
                                </div>
                                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Slug publico: {program.slug}</p>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Titulo</span>
                                    <input
                                        name="title"
                                        required
                                        defaultValue={program.title}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Descricao curta</span>
                                    <textarea
                                        name="short_description"
                                        required
                                        rows={3}
                                        defaultValue={program.shortDescription}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Descricao longa</span>
                                    <textarea
                                        name="long_description"
                                        rows={5}
                                        defaultValue={program.longDescription || ''}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Area</span>
                                    <input
                                        name="subject_area"
                                        required
                                        defaultValue={program.subjectArea}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tipo de prova</span>
                                    <input
                                        name="exam_type"
                                        defaultValue={program.examType || ''}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Monetizacao</span>
                                    <select
                                        name="monetization_type"
                                        defaultValue={program.monetizationType}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    >
                                        <option value="free">Gratis</option>
                                        <option value="donation">Doacao</option>
                                        <option value="paid">Pago</option>
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Visibilidade</span>
                                    <select
                                        name="visibility"
                                        defaultValue={program.visibility}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    >
                                        <option value="public">Publico</option>
                                        <option value="private">Privado</option>
                                        <option value="unlisted">Nao listado</option>
                                    </select>
                                </label>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Salvar ajustes
                                </button>
                                <Link href="/creator" className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200">
                                    Voltar para studio
                                </Link>
                            </div>
                        </form>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Trilhas</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Estrutura macro</h2>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{program.trails.length} registradas</span>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {program.trails.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                        Nenhuma trilha criada ainda.
                                    </div>
                                ) : (
                                    program.trails.map((trail) => (
                                        <form key={trail.id} action={updateTrail} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <input type="hidden" name="trail_id" value={trail.id} />
                                            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                                                <div className="space-y-4">
                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Titulo da trilha</span>
                                                        <input
                                                            name="title"
                                                            required
                                                            defaultValue={trail.title}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                                        />
                                                    </label>
                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Descricao</span>
                                                        <textarea
                                                            name="description"
                                                            rows={3}
                                                            defaultValue={trail.description || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-col gap-3 md:justify-between">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {trail.status}
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <button className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                                            Salvar
                                                        </button>
                                                        <button
                                                            formAction={deleteTrail}
                                                            className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm font-bold text-rose-200"
                                                        >
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topicos</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Mapa de conhecimento</h2>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{program.topics.length} ativos</span>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {program.topics.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                        Nenhum topico criado ainda.
                                    </div>
                                ) : (
                                    program.topics.map((topic) => (
                                        <form key={topic.id} action={updateTopic} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <input type="hidden" name="topic_id" value={topic.id} />
                                            <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
                                                <div className="space-y-4 xl:col-span-2">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <label className="space-y-2 md:col-span-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Titulo do topico</span>
                                                            <input
                                                                name="title"
                                                                required
                                                                defaultValue={topic.title}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                            />
                                                        </label>

                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Trilha</span>
                                                            <select
                                                                name="trail_id"
                                                                defaultValue={topic.trailId || ''}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                            >
                                                                <option value="">Sem trilha associada</option>
                                                                {program.trails.map((trail) => (
                                                                    <option key={trail.id} value={trail.id}>
                                                                        {trail.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Peso na prova</span>
                                                            <select
                                                                name="exam_weight"
                                                                defaultValue={topic.examWeight || ''}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                            >
                                                                <option value="">Nao definido</option>
                                                                <option value="LOW">Baixo</option>
                                                                <option value="MEDIUM">Medio</option>
                                                                <option value="HIGH">Alto</option>
                                                            </select>
                                                        </label>
                                                    </div>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Descricao</span>
                                                        <textarea
                                                            name="description"
                                                            rows={3}
                                                            defaultValue={topic.description || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-col gap-3 xl:justify-between">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {topic.status}
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <button className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                                            Salvar
                                                        </button>
                                                        <button
                                                            formAction={deleteTopic}
                                                            className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm font-bold text-rose-200"
                                                        >
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Questoes</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Banco editavel</h2>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{program.questions.length} cadastradas</span>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {program.questions.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                        Nenhuma questao criada ainda.
                                    </div>
                                ) : (
                                    program.questions.map((question, index) => (
                                        <form key={question.id} action={updateQuestion} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <input type="hidden" name="question_id" value={question.id} />

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    Questao {index + 1}
                                                </span>
                                                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    {question.status}
                                                </span>
                                            </div>

                                            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto]">
                                                <div className="space-y-4">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topico</span>
                                                            <select
                                                                name="topic_id"
                                                                required
                                                                defaultValue={question.topicId}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            >
                                                                {program.topics.map((topic) => (
                                                                    <option key={topic.id} value={topic.id}>
                                                                        {topic.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Dificuldade</span>
                                                            <select
                                                                name="difficulty_level"
                                                                defaultValue={question.difficultyLevel}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            >
                                                                <option value="easy">Facil</option>
                                                                <option value="medium">Media</option>
                                                                <option value="hard">Dificil</option>
                                                            </select>
                                                        </label>
                                                    </div>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Enunciado</span>
                                                        <textarea
                                                            name="stem"
                                                            rows={4}
                                                            required
                                                            defaultValue={question.stem}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                        />
                                                    </label>

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Alternativa A</span>
                                                            <input
                                                                name="option_a"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'A')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Alternativa B</span>
                                                            <input
                                                                name="option_b"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'B')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Alternativa C</span>
                                                            <input
                                                                name="option_c"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'C')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Alternativa D</span>
                                                            <input
                                                                name="option_d"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'D')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                    </div>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Resposta correta</span>
                                                        <select
                                                            name="correct_option"
                                                            defaultValue={getCorrectOption(question.options)}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                        >
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="C">C</option>
                                                            <option value="D">D</option>
                                                        </select>
                                                    </label>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Explicacao</span>
                                                        <textarea
                                                            name="explanation"
                                                            rows={4}
                                                            required
                                                            defaultValue={question.explanation}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-col gap-3 xl:justify-between">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {question.difficultyLevel}
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <button className="rounded-2xl bg-violet-300 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                                            Salvar
                                                        </button>
                                                        <button
                                                            formAction={deleteQuestion}
                                                            className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm font-bold text-rose-200"
                                                        >
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <form action={createAIGenerationJob} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <input type="hidden" name="exam_type" value={program.examType || ''} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Brief para IA</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">
                                {isConcursoProgram ? 'Geracao guiada por incidencia de prova' : 'Geracao guiada por objetivo pedagógico'}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                                {isConcursoProgram
                                    ? 'Para concursos, o brief pede banca, cargo, padroes historicos e temas mais incidentes. Isso prepara o pipeline para gerar questoes priorizando o que mais tende a cair.'
                                    : 'Use este brief para orientar futuros lotes de questoes com foco em memorizacao, cobertura e progressao do estudante.'}
                            </p>

                            <div className="mt-5 space-y-4">
                                <textarea
                                    name="objective"
                                    required
                                    rows={3}
                                    placeholder="Objetivo do lote: o que a IA deve priorizar neste conjunto de questoes?"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <select
                                        name="trail_id"
                                        defaultValue=""
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    >
                                        <option value="">Sem trilha especifica</option>
                                        {program.trails.map((trail) => (
                                            <option key={trail.id} value={trail.id}>{trail.title}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="topic_id"
                                        defaultValue=""
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    >
                                        <option value="">Sem topico especifico</option>
                                        {program.topics.map((topic) => (
                                            <option key={topic.id} value={topic.id}>{topic.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {isConcursoProgram ? (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <input
                                                name="board_name"
                                                placeholder="Banca: CESPE, FGV, FCC..."
                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                            />
                                            <input
                                                name="role_name"
                                                placeholder="Cargo, area ou orgao"
                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                            />
                                        </div>
                                        <input
                                            name="exam_year_range"
                                            placeholder="Recorte de provas anteriores: ex. 2020-2025"
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                        />
                                        <textarea
                                            name="priority_themes"
                                            rows={3}
                                            placeholder="Temas com maior chance de cair, assuntos mais cobrados, recorrencias percebidas..."
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                        />
                                        <textarea
                                            name="evidence_notes"
                                            rows={3}
                                            placeholder="Anotacoes sobre provas anteriores, estilo da banca, padroes de cobranca e pontos que merecem mais memorizacao"
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                        />
                                    </>
                                ) : (
                                    <textarea
                                        name="priority_themes"
                                        rows={3}
                                        placeholder="Conceitos centrais, erros recorrentes ou assuntos que merecem maior reforco"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    />
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <input
                                        name="difficulty_mix"
                                        placeholder="Distribuicao: 60% medio, 30% facil, 10% dificil"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    />
                                    <input
                                        name="question_count"
                                        type="number"
                                        min="1"
                                        max="50"
                                        defaultValue="10"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    />
                                </div>

                                <input
                                    name="source_material_url"
                                    placeholder="URL de edital, apostila ou material de referencia"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                />
                                <textarea
                                    name="source_material_text"
                                    rows={4}
                                    placeholder="Trechos importantes, edital resumido ou orientacoes adicionais para a geracao"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                />
                                <input type="hidden" name="provider_name" value="manual-brief" />

                                <button className="w-full rounded-2xl bg-fuchsia-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Salvar brief de geracao
                                </button>
                            </div>
                        </form>

                        <form action={createTrail} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Nova trilha</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Adicionar etapa macro</h2>
                            <div className="mt-5 space-y-4">
                                <input
                                    name="title"
                                    required
                                    placeholder="Ex.: Fundamentos, Revisao final..."
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                />
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Descricao curta da trilha"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                />
                                <button className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Criar trilha
                                </button>
                            </div>
                        </form>

                        <form action={createTopic} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Novo topico</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Adicionar assunto</h2>
                            <div className="mt-5 space-y-4">
                                <input
                                    name="title"
                                    required
                                    placeholder="Ex.: IAM, Algebra, Interpretacao..."
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                />
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Descricao curta do topico"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                />
                                <select
                                    name="trail_id"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    defaultValue=""
                                >
                                    <option value="">Sem trilha associada</option>
                                    {program.trails.map((trail) => (
                                        <option key={trail.id} value={trail.id}>
                                            {trail.title}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="exam_weight"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    defaultValue=""
                                >
                                    <option value="">Peso nao definido</option>
                                    <option value="LOW">Baixo</option>
                                    <option value="MEDIUM">Medio</option>
                                    <option value="HIGH">Alto</option>
                                </select>
                                <button className="w-full rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Criar topico
                                </button>
                            </div>
                        </form>

                        <form action={createQuestion} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Nova questao</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Adicionar questao manual</h2>

                            {program.topics.length === 0 ? (
                                <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                                    Crie pelo menos um topico antes de cadastrar questoes.
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    <select
                                        name="topic_id"
                                        required
                                        defaultValue=""
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    >
                                        <option value="" disabled>Selecione um topico</option>
                                        {program.topics.map((topic) => (
                                            <option key={topic.id} value={topic.id}>
                                                {topic.title}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        name="difficulty_level"
                                        defaultValue="medium"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    >
                                        <option value="easy">Facil</option>
                                        <option value="medium">Media</option>
                                        <option value="hard">Dificil</option>
                                    </select>

                                    <textarea
                                        name="stem"
                                        required
                                        rows={4}
                                        placeholder="Enunciado da questao"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />

                                    <input
                                        name="option_a"
                                        required
                                        placeholder="Alternativa A"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />
                                    <input
                                        name="option_b"
                                        required
                                        placeholder="Alternativa B"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />
                                    <input
                                        name="option_c"
                                        required
                                        placeholder="Alternativa C"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />
                                    <input
                                        name="option_d"
                                        required
                                        placeholder="Alternativa D"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />

                                    <select
                                        name="correct_option"
                                        defaultValue="A"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    >
                                        <option value="A">Resposta correta: A</option>
                                        <option value="B">Resposta correta: B</option>
                                        <option value="C">Resposta correta: C</option>
                                        <option value="D">Resposta correta: D</option>
                                    </select>

                                    <textarea
                                        name="explanation"
                                        required
                                        rows={4}
                                        placeholder="Explicacao da resposta correta"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />

                                    <button className="w-full rounded-2xl bg-violet-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                        Criar questao
                                    </button>
                                </div>
                            )}
                        </form>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Fila de briefs</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Base para geracao futura</h2>
                            <div className="mt-5 space-y-3">
                                {program.aiJobs.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                                        Nenhum brief salvo ainda. Este painel vai acumular o contexto que usaremos para gerar questoes com IA.
                                    </div>
                                ) : (
                                    program.aiJobs.slice(0, 5).map((job) => (
                                        <div key={job.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{job.providerName || 'manual-brief'}</p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                                        {job.createdAt.toLocaleDateString('pt-BR')} · {job.status}
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    {job.generatedCount} itens
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{job.promptText || 'Sem prompt registrado.'}</p>
                                            <div className="mt-4">
                                                <form action={generateAIDraftItems}>
                                                    <input type="hidden" name="program_id" value={program.id} />
                                                    <input type="hidden" name="job_id" value={job.id} />
                                                    <button className="rounded-2xl bg-fuchsia-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black">
                                                        Gerar rascunhos
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Rascunhos de IA</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Revisar antes de virar questao</h2>
                            <div className="mt-5 space-y-4">
                                {program.aiItems.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                                        Quando voce gerar rascunhos a partir de um brief, eles vao aparecer aqui para aprovacao.
                                    </div>
                                ) : (
                                    program.aiItems.slice(0, 10).map((item) => {
                                        const draft = parseDraftPayload(item.draftPayloadJson);

                                        if (!draft) {
                                            return (
                                                <div key={item.id} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                                                    Nao foi possivel ler este rascunho.
                                                </div>
                                            );
                                        }

                                        return (
                                            <form key={item.id} action={updateAIGenerationItem} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                                                <input type="hidden" name="program_id" value={program.id} />
                                                <input type="hidden" name="item_id" value={item.id} />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {draft.difficultyLevel}
                                                    </span>
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {item.validationStatus}
                                                    </span>
                                                </div>

                                                <div className="mt-4 space-y-4">
                                                    <select
                                                        name="topic_id"
                                                        defaultValue={draft.topicId || ''}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    >
                                                        {program.topics.map((topic) => (
                                                            <option key={topic.id} value={topic.id}>{topic.title}</option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        name="difficulty_level"
                                                        defaultValue={draft.difficultyLevel || 'medium'}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    >
                                                        <option value="easy">Facil</option>
                                                        <option value="medium">Media</option>
                                                        <option value="hard">Dificil</option>
                                                    </select>

                                                    <textarea
                                                        name="stem"
                                                        rows={4}
                                                        required
                                                        defaultValue={draft.stem}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    />

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <input
                                                            name="option_a"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'A')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                        <input
                                                            name="option_b"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'B')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                        <input
                                                            name="option_c"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'C')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                        <input
                                                            name="option_d"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'D')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                    </div>

                                                    <select
                                                        name="correct_option"
                                                        defaultValue={draft.options.find((option) => option.isCorrect)?.label || 'A'}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    >
                                                        <option value="A">Resposta correta: A</option>
                                                        <option value="B">Resposta correta: B</option>
                                                        <option value="C">Resposta correta: C</option>
                                                        <option value="D">Resposta correta: D</option>
                                                    </select>

                                                    <textarea
                                                        name="explanation"
                                                        rows={4}
                                                        required
                                                        defaultValue={draft.explanation}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    />
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <button className="rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
                                                        Salvar rascunho
                                                    </button>
                                                    {item.validationStatus === 'pending' ? (
                                                        <>
                                                            <button
                                                                formAction={approveAIGenerationItem}
                                                                className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black"
                                                            >
                                                                Aprovar como questao
                                                            </button>
                                                            <button
                                                                formAction={rejectAIGenerationItem}
                                                                className="rounded-2xl border border-rose-500/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-200"
                                                            >
                                                                Rejeitar
                                                            </button>
                                                        </>
                                                    ) : null}
                                                </div>

                                                {item.validationStatus !== 'pending' ? (
                                                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                                        Este rascunho ja foi marcado como {item.validationStatus}.
                                                    </p>
                                                ) : null}
                                            </form>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
