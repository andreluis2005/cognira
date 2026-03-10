import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ensurePlatformUser } from '@/lib/db/account';
import { getLearnerProgramById } from '@/lib/db/queries';
import { upsertProgramReview } from '@/lib/reviews/actions';
import { createClient } from '@/lib/supabase/server';

function getStatus(score: number) {
    if (score < 50) return 'Base em construcao';
    if (score < 80) return 'Em evolucao';
    return 'Pronto para avancar';
}

function getTopicTone(status: string) {
    if (status === 'WEAK' || status === 'weak') {
        return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
    }

    if (status === 'EVOLVING' || status === 'evolving') {
        return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    }

    if (status === 'STRONG' || status === 'strong') {
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
    }

    return 'border-zinc-700 bg-zinc-900 text-zinc-200';
}

function getTopicStatusLabel(status: string) {
    if (status === 'WEAK' || status === 'weak') return 'Fragil';
    if (status === 'EVOLVING' || status === 'evolving') return 'Evoluindo';
    if (status === 'STRONG' || status === 'strong') return 'Forte';
    return 'Nao avaliado';
}

function getTopicPriorityScore(topic: {
    status: string;
    readinessScore: number;
    coverage: number;
    accuracy: number;
}) {
    const statusWeight = topic.status === 'WEAK' || topic.status === 'weak'
        ? 0
        : topic.status === 'EVOLVING' || topic.status === 'evolving'
            ? 1
            : topic.status === 'STRONG' || topic.status === 'strong'
                ? 3
                : 2;

    return (statusWeight * 1000) + (topic.readinessScore * 10) + topic.coverage + topic.accuracy;
}

export default async function LearnerProgramPage({
    params,
    searchParams,
}: {
    params: Promise<{ programId: string }>;
    searchParams: Promise<{ reviewSaved?: string; error?: string }>;
}) {
    const { programId } = await params;
    const query = await searchParams;
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        redirect('/login');
    }

    await ensurePlatformUser(data.user);
    const program = await getLearnerProgramById(data.user.id, programId);

    if (!program) {
        notFound();
    }

    const weakTopics = [...program.topicDetails]
        .sort((a, b) => a.readinessScore - b.readinessScore)
        .slice(0, 3);
    const nextRecommendedTopic = [...program.topicDetails]
        .sort((a, b) => getTopicPriorityScore(a) - getTopicPriorityScore(b))[0] || null;

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_24%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-4">
                        <Link href="/dashboard" className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                            Dashboard
                        </Link>
                        <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">{program.subjectArea}</p>
                            <h1 className="text-4xl font-black tracking-tight md:text-5xl">{program.title}</h1>
                            <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base">{program.shortDescription}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`/session?programId=${program.programId}&mode=smart`}
                                className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                Iniciar sessao
                            </Link>
                            {nextRecommendedTopic ? (
                                <Link
                                    href={`/session?programId=${program.programId}&mode=topic&target=${nextRecommendedTopic.id}`}
                                    className="rounded-2xl border border-sky-500/40 bg-sky-500/10 px-5 py-3 text-sm font-bold text-sky-100"
                                >
                                    Revisar proximo topico
                                </Link>
                            ) : null}
                            <Link
                                href={`/programs/${program.slug}`}
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Ver pagina publica
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Prontidao</p>
                            <p className="mt-3 text-4xl font-black">{program.readinessScore}%</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Acuracia</p>
                            <p className="mt-3 text-4xl font-black">{program.accuracy}%</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topicos</p>
                            <p className="mt-3 text-4xl font-black">{program.topicCount}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Estado</p>
                            <p className="mt-3 text-lg font-black">{getStatus(program.readinessScore)}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Meta imediata</p>
                        <p className="mt-3 text-lg font-black">
                            {nextRecommendedTopic ? `Revisar ${nextRecommendedTopic.title}.` : 'Retomar uma sessao cognitiva.'}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            {nextRecommendedTopic
                                ? 'Esse topico e o melhor ponto de retomada no momento, considerando prontidao, cobertura e acuracia.'
                                : 'Cada nova sessao atualiza sua prontidao e reapresenta os pontos que mais merecem reforco.'}
                        </p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Prioridade de revisao</p>
                        <p className="mt-3 text-lg font-black">
                            {weakTopics[0] ? weakTopics[0].title : 'Nenhum topico priorizado ainda'}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            Hoje o foco esta em consolidar os topicos com menor prontidao acumulada.
                        </p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Progresso salvo</p>
                        <p className="mt-3 text-lg font-black">
                            {program.latestSessionAt
                                ? `Ultima sessao em ${program.latestSessionAt.toLocaleDateString('pt-BR')}`
                                : 'Ainda sem sessao registrada'}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            O historico deste programa fica persistido para voce continuar de onde parou.
                        </p>
                    </div>
                </section>

                {query.reviewSaved ? (
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        Avaliacao salva com sucesso.
                    </div>
                ) : null}

                {query.error ? (
                    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                        {query.error}
                    </div>
                ) : null}

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topicos mais sensiveis</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight">Onde vale revisar primeiro</h2>

                        <div className="mt-6 space-y-3">
                            {weakTopics.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                    Os topicos vao aparecer aqui assim que houver progresso suficiente para priorizacao.
                                </div>
                            ) : (
                                weakTopics.map((topic) => (
                                    <div key={topic.id} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-black">{topic.title}</p>
                                                <p className="mt-1 text-sm text-zinc-500">
                                                    {topic.trailTitle || 'Sem trilha associada'}
                                                </p>
                                            </div>
                                            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getTopicTone(topic.status)}`}>
                                                {getTopicStatusLabel(topic.status)}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-3">
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Prontidao</p>
                                                <p className="mt-2 text-xl font-black">{topic.readinessScore}%</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cobertura</p>
                                                <p className="mt-2 text-xl font-black">{topic.coverage}%</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Acuracia</p>
                                                <p className="mt-2 text-xl font-black">{topic.accuracy}%</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <Link
                                                href={`/session?programId=${program.programId}&mode=topic&target=${topic.id}`}
                                                className="rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-200"
                                            >
                                                Revisar topico
                                            </Link>
                                            <Link
                                                href={`/session?programId=${program.programId}&mode=smart`}
                                                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-400"
                                            >
                                                Sessao smart
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Mapa por topico</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight">Visao detalhada do programa</h2>
                            </div>
                            <p className="text-sm text-zinc-500">{program.topicDetails.length} topicos mapeados</p>
                        </div>

                        <div className="mt-6 grid gap-4">
                            {program.topicDetails.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                    Este programa ainda nao possui topicos suficientes para detalhamento.
                                </div>
                            ) : (
                                program.topicDetails.map((topic) => (
                                    <div key={topic.id} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-lg font-black">{topic.title}</p>
                                                    {topic.examWeight ? (
                                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                            {topic.examWeight}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-1 text-sm text-zinc-500">{topic.trailTitle || 'Sem trilha associada'}</p>
                                                {topic.description ? (
                                                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{topic.description}</p>
                                                ) : null}
                                            </div>

                                            <span className={`self-start rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getTopicTone(topic.status)}`}>
                                                {getTopicStatusLabel(topic.status)}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Prontidao</p>
                                                <p className="mt-2 text-xl font-black">{topic.readinessScore}%</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cobertura</p>
                                                <p className="mt-2 text-xl font-black">{topic.coverage}%</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Acuracia</p>
                                                <p className="mt-2 text-xl font-black">{topic.accuracy}%</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tentativas</p>
                                                <p className="mt-2 text-xl font-black">{topic.attempts}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Questoes</p>
                                                <p className="mt-2 text-xl font-black">{topic.questionCount}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <Link
                                                href={`/session?programId=${program.programId}&mode=topic&target=${topic.id}`}
                                                className="rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-200"
                                            >
                                                Estudar este topico
                                            </Link>
                                            {nextRecommendedTopic?.id === topic.id ? (
                                                <span className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-sky-200">
                                                    Proxima melhor retomada
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <form action={upsertProgramReview} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                        <input type="hidden" name="program_id" value={program.programId} />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Sua avaliacao</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight">Como foi estudar este programa?</h2>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                            A nota ajuda o marketplace a destacar conteudos que realmente apoiam a retencao e a preparacao do aluno.
                        </p>

                        <div className="mt-5 space-y-4">
                            <select
                                name="rating"
                                defaultValue={program.ownReview?.rating ? String(program.ownReview.rating) : '5'}
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                            >
                                <option value="5">5 - Excelente</option>
                                <option value="4">4 - Muito bom</option>
                                <option value="3">3 - Bom</option>
                                <option value="2">2 - Regular</option>
                                <option value="1">1 - Fraco</option>
                            </select>
                            <input
                                name="title"
                                defaultValue={program.ownReview?.title || ''}
                                placeholder="Titulo da avaliacao"
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                            />
                            <textarea
                                name="body"
                                rows={4}
                                defaultValue={program.ownReview?.body || ''}
                                placeholder="O que mais ajudou ou o que pode melhorar?"
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                            />
                            <button className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                Salvar avaliacao
                            </button>
                        </div>
                    </form>

                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Reputacao do programa</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight">
                                    {program.avgRating ? `${program.avgRating}/5` : 'Sem nota ainda'}
                                </h2>
                            </div>
                            <p className="text-sm text-zinc-500">{program.reviewCount} avaliacoes</p>
                        </div>

                        <div className="mt-6 space-y-4">
                            {program.recentReviews.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                    Assim que os alunos avaliarem este programa, os depoimentos aparecerao aqui.
                                </div>
                            ) : (
                                program.recentReviews.map((review) => (
                                    <div key={review.id} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-lg font-black text-white">{review.title || 'Avaliacao do programa'}</p>
                                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                                                {review.rating}/5
                                            </span>
                                        </div>
                                        {review.body ? (
                                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{review.body}</p>
                                        ) : null}
                                        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                            {review.createdAt.toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
