import Link from 'next/link';
import { redirect } from 'next/navigation';
import { submitProgramForReview } from '@/lib/creator/actions';
import { ensureCreatorProfile, listUserRoles } from '@/lib/db/account';
import { getCreatorStudioMetrics, listCreatorPrograms } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';

export default async function CreatorPage({
    searchParams,
}: {
    searchParams: Promise<{ created?: string; submitted?: string; archived?: string; error?: string }>;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const params = await searchParams;

    if (!data.user) {
        redirect('/login');
    }

    const creatorProfile = await ensureCreatorProfile(data.user);
    const [programs, creatorMetrics, roles] = await Promise.all([
        listCreatorPrograms(data.user.id),
        getCreatorStudioMetrics(data.user.id),
        listUserRoles(data.user.id),
    ]);
    const canReviewPrograms = roles.includes('admin') || roles.includes('reviewer');

    const ratingLabel = creatorMetrics?.avgRating
        ? `${creatorMetrics.avgRating.toFixed(1)}/5`
        : 'Sem nota ainda';
    const rankLabel = creatorMetrics?.leaderboardPosition
        ? `#${creatorMetrics.leaderboardPosition} de ${creatorMetrics.leaderboardSize}`
        : 'Aguardando sinais';

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_24%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Creator Studio</p>
                        <h1 className="text-4xl font-black tracking-tight md:text-6xl">Publique conhecimento em formato Cognira.</h1>
                        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                            Monte programas, organize trilhas, topicos e questoes em uma base pronta para virar estudo real.
                        </p>
                        <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Seu momento</p>
                            <p className="mt-2 text-lg font-black">
                                {creatorMetrics?.publishedPrograms
                                    ? `Voce ja tem ${creatorMetrics.publishedPrograms} programa${creatorMetrics.publishedPrograms > 1 ? 's' : ''} publicado${creatorMetrics.publishedPrograms > 1 ? 's' : ''}.`
                                    : 'Seu studio ja esta pronto para publicar o primeiro programa.'}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">
                                {creatorMetrics?.learnerCount
                                    ? `${creatorMetrics.learnerCount} aluno${creatorMetrics.learnerCount > 1 ? 's' : ''} ja estudam com seu conteudo.`
                                    : 'Assim que houver estudo real e avaliacoes, seu score e sua posicao no ranking ficam mais fortes.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/creator/programs/new"
                                className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                Novo programa
                            </Link>
                            <Link
                                href="/programs"
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Ver catalogo
                            </Link>
                            {canReviewPrograms ? (
                                <Link
                                    href="/admin/review"
                                    className="rounded-2xl border border-sky-500/40 px-5 py-3 text-sm font-bold text-sky-200"
                                >
                                    Fila de revisao
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Criador</p>
                            <p className="mt-3 text-xl font-black">{creatorProfile.displayName}</p>
                            <p className="mt-2 text-sm text-zinc-400">
                                {creatorMetrics?.headline || 'Perfil sincronizado com auth, banco e marketplace.'}
                            </p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Creator Score</p>
                            <p className="mt-3 text-4xl font-black">{Math.round(creatorMetrics?.creatorScore || 0)}</p>
                            <p className="mt-2 text-sm text-zinc-400">Leva em conta qualidade percebida, programas publicados e alunos ativos.</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Posicao</p>
                            <p className="mt-3 text-xl font-black">{rankLabel}</p>
                            <p className="mt-2 text-sm text-zinc-400">Ranking atual entre criadores com sinais publicos no marketplace.</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Programas ativos</p>
                        <p className="mt-3 text-3xl font-black">{creatorMetrics?.publishedPrograms || 0}</p>
                        <p className="mt-2 text-sm text-zinc-400">Conteudos publicados e visiveis no catalogo.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Rascunhos</p>
                        <p className="mt-3 text-3xl font-black">{creatorMetrics?.draftPrograms || 0}</p>
                        <p className="mt-2 text-sm text-zinc-400">Programas em construcao, prontos para refinamento editorial.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Avaliacao media</p>
                        <p className="mt-3 text-3xl font-black">{ratingLabel}</p>
                        <p className="mt-2 text-sm text-zinc-400">{creatorMetrics?.reviewCount || 0} avaliacao(oes) consolidadas.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Alunos ativos</p>
                        <p className="mt-3 text-3xl font-black">{creatorMetrics?.learnerCount || 0}</p>
                        <p className="mt-2 text-sm text-zinc-400">Pessoas matriculadas em programas publicados por voce.</p>
                    </div>
                </section>

                {params.created ? (
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        Programa criado com sucesso.
                    </div>
                ) : null}

                {params.submitted ? (
                    <div className="rounded-3xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
                        Programa enviado para revisao editorial.
                    </div>
                ) : null}

                {params.archived ? (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        Programa arquivado e removido da vitrine publica.
                    </div>
                ) : null}

                {params.error ? (
                    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                        {params.error}
                    </div>
                ) : null}

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Seus programas</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Base editorial</h2>
                        </div>
                        <p className="text-sm text-zinc-500">{programs.length} programas cadastrados</p>
                    </div>

                    {programs.length === 0 ? (
                        <div className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
                            <p className="text-lg font-bold">Nenhum programa criado ainda</p>
                            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                                Comece pelo primeiro programa. Depois voce consegue estruturar trilhas, topicos e questoes.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {programs.map((program) => (
                                <div key={program.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            {program.subjectArea}
                                        </span>
                                        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            {program.status}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-2xl font-black tracking-tight">{program.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{program.shortDescription}</p>

                                    <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.2em]">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
                                            {program.reviewStatus}
                                        </span>
                                        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-500">
                                            {program.monetizationType}
                                        </span>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Link
                                            href={`/creator/programs/${program.id}`}
                                            className="rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-200"
                                        >
                                            Estruturar
                                        </Link>
                                        {program.status !== 'published' && program.reviewStatus !== 'submitted' ? (
                                            <form action={submitProgramForReview}>
                                                <input type="hidden" name="program_id" value={program.id} />
                                                <button className="rounded-2xl bg-sky-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black">
                                                    Enviar para revisao
                                                </button>
                                            </form>
                                        ) : program.reviewStatus === 'submitted' ? (
                                            <span className="rounded-2xl border border-amber-500/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                                                Em revisao
                                            </span>
                                        ) : (
                                            <Link
                                                href={`/programs/${program.slug}`}
                                                className="rounded-2xl bg-zinc-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black"
                                            >
                                                Ver no catalogo
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
