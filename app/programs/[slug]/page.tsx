import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProgramEnrollmentState, getPublishedProgramBySlug } from '@/lib/db/queries';
import { enrollAndStartProgram } from '@/lib/programs/actions';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ProgramPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    let program: Awaited<ReturnType<typeof getPublishedProgramBySlug>> | null = null;
    let enrollmentState: Awaited<ReturnType<typeof getProgramEnrollmentState>> | null = null;

    try {
        program = await getPublishedProgramBySlug(slug);
        if (program && data.user) {
            enrollmentState = await getProgramEnrollmentState(data.user.id, program.id);
        }
    } catch {
        program = null;
    }

    if (!program) {
        notFound();
    }

    const primaryHref = !data.user
        ? `/signup?redirectTo=${encodeURIComponent(`/programs/${program.slug}`)}`
        : enrollmentState?.isEnrolled
            ? `/learn/programs/${program.id}`
            : null;

    const primaryLabel = !data.user
        ? 'Criar conta para estudar'
        : enrollmentState?.isEnrolled
            ? enrollmentState.hasStarted ? 'Continuar programa' : 'Abrir meu programa'
            : 'Entrar e comecar';

    const secondaryHref = !data.user
        ? `/login?redirectTo=${encodeURIComponent(`/programs/${program.slug}`)}`
        : `/session?programId=${program.id}&mode=smart`;

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.1),transparent_26%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <Link href="/programs" className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                            Marketplace
                        </Link>
                        <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">{program.subjectArea}</p>
                            <h1 className="text-4xl font-black tracking-tight md:text-6xl">{program.title}</h1>
                            <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base">
                                {program.longDescription || program.shortDescription}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {primaryHref ? (
                                <Link
                                    href={primaryHref}
                                    className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                                >
                                    {primaryLabel}
                                </Link>
                            ) : (
                                <form action={enrollAndStartProgram}>
                                    <input type="hidden" name="program_id" value={program.id} />
                                    <input type="hidden" name="program_slug" value={program.slug} />
                                    <button className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                        {primaryLabel}
                                    </button>
                                </form>
                            )}
                            <Link
                                href={secondaryHref}
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                {!data.user ? 'Ja tenho conta' : enrollmentState?.isEnrolled ? 'Nova sessao' : 'Quero ir direto para a sessao'}
                            </Link>
                        </div>

                        <div className="grid gap-3 pt-2 sm:grid-cols-3">
                            <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Trilhas</p>
                                <p className="mt-2 text-2xl font-black">{program.trailCount}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Topicos</p>
                                <p className="mt-2 text-2xl font-black">{program.topicCount}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Questoes</p>
                                <p className="mt-2 text-2xl font-black">{program.questionCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Criador</p>
                            <p className="mt-3 text-lg font-black">{program.creatorDisplayName || 'Criador Cognira'}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Formato</p>
                            <p className="mt-3 text-lg font-black">{program.examType || 'Programa livre'}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Acesso</p>
                            <p className="mt-3 text-lg font-black capitalize">{program.monetizationType}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Reputacao</p>
                            <p className="mt-3 text-lg font-black">
                                {program.avgRating ? `${program.avgRating}/5` : 'Sem nota ainda'}
                            </p>
                            <p className="mt-2 text-sm text-zinc-400">{program.reviewCount} avaliacoes registradas</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Proposta</p>
                            <p className="mt-3 text-lg font-black">Estudar para memorizar o que mais importa.</p>
                            <p className="mt-2 text-sm text-emerald-100/80">
                                Entre no programa, responda blocos curtos e use o reforco para consolidar os pontos mais importantes.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Como funciona</p>
                        <p className="mt-3 text-lg font-black">Sessao por questoes com reforco.</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            O estudo e guiado por desempenho e prontidao, sem transformar a experiencia em um quiz linear.
                        </p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Ideal para</p>
                        <p className="mt-3 text-lg font-black">Memorizar melhor antes da prova.</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            Use para consolidar pontos importantes, revisar erros e voltar ao estudo com contexto.
                        </p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Fluxo rapido</p>
                        <p className="mt-3 text-lg font-black">Abrir, responder, reforcar.</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            Inicie uma sessao, responda o bloco atual e retorne ao painel para acompanhar a evolucao.
                        </p>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">O que voce vai treinar</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Mapa inicial do programa</h2>
                        </div>
                        <p className="text-sm text-zinc-500">
                            {program.topicCount} topicos estruturados para estudo
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {program.topicPreview.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                This program does not have enough public topics yet to display an initial map.
                            </div>
                        ) : (
                            program.topicPreview.map((topic) => (
                                <div key={topic.id} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                                                {topic.trailTitle || 'Topico principal'}
                                            </p>
                                            <p className="mt-2 text-xl font-black text-white">{topic.title}</p>
                                        </div>
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                                            {topic.questionCount} questoes
                                        </span>
                                    </div>

                                    {topic.description ? (
                                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{topic.description}</p>
                                    ) : null}

                                    {topic.examWeight ? (
                                        <div className="mt-4">
                                            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                                                Peso de prova: {topic.examWeight}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">1. Entre</p>
                        <p className="mt-3 text-lg font-black">Comece por uma sessao curta</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            No need to wait until you are fully ready. The first session already creates context for Cognira to guide your next steps.
                        </p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">2. Observe</p>
                        <p className="mt-3 text-lg font-black">Veja onde esta forte e onde precisa voltar</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            O sistema transforma respostas em sinais de prontidao, cobertura e pontos frageis por topico.
                        </p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">3. Reforce</p>
                        <p className="mt-3 text-lg font-black">Retorne ao que realmente importa</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            The goal is not just answering more. It is memorizing better what can make a difference on exam day.
                        </p>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Avaliacoes recentes</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">O que os alunos estao dizendo</h2>
                        </div>
                        <p className="text-sm text-zinc-500">{program.reviewCount} avaliacoes</p>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {program.reviews.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                This program hasn't received public ratings yet.
                            </div>
                        ) : (
                            program.reviews.map((review, index) => (
                                <div key={`${review.createdAt.toISOString()}-${index}`} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-5">
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
                </section>
            </div>
        </main>
    );
}
