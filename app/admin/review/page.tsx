import Link from 'next/link';
import { redirect } from 'next/navigation';
import { approveProgramPublication, requestProgramChanges } from '@/lib/creator/actions';
import { ensurePlatformUser, requireReviewAccess } from '@/lib/db/account';
import { listProgramsForReview } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';

function getMessage(query: Record<string, string | undefined>) {
    if (query.approved) return 'Program successfully approved and published.';
    if (query.changesRequested) return 'Programa devolvido para ajustes.';
    if (query.error) return query.error;
    return null;
}

export default async function AdminReviewPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const query = await searchParams;

    if (!data.user) {
        redirect('/login');
    }

    await ensurePlatformUser(data.user);

    try {
        await requireReviewAccess(data.user);
    } catch {
        redirect('/creator?error=You%20do%20not%20have%20access%20to%20the%20review%20queue');
    }

    const programs = await listProgramsForReview();
    const message = getMessage(query);
    const isError = Boolean(query.error);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_24%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">Fila editorial</p>
                            <h1 className="text-4xl font-black tracking-tight md:text-6xl">Aprovacao de programas</h1>
                            <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base">
                                Aqui entram apenas programas enviados para revisao. Criador prepara; admin ou reviewer decide se publica ou se volta para ajustes.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/creator"
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Voltar ao studio
                            </Link>
                            <Link
                                href="/programs"
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Ver catalogo
                            </Link>
                        </div>
                    </div>
                </section>

                {message ? (
                    <div className={`rounded-3xl p-4 text-sm ${isError ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
                        {message}
                    </div>
                ) : null}

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Pendencias atuais</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Programas aguardando decisao</h2>
                        </div>
                        <p className="text-sm text-zinc-500">{programs.length} programa(s) na fila</p>
                    </div>

                    {programs.length === 0 ? (
                        <div className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
                            <p className="text-lg font-bold">Nenhum programa aguardando revisao.</p>
                            <p className="mt-2 text-sm text-zinc-500">
                                Quando um criador enviar um programa, ele aparece aqui para aprovacao ou devolucao com ajustes.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                            {programs.map((program) => (
                                <div key={program.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{program.subjectArea}</p>
                                            <h3 className="mt-3 text-2xl font-black tracking-tight">{program.title}</h3>
                                        </div>
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                                            {program.reviewStatus}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{program.shortDescription}</p>

                                    <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.2em]">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">
                                            {program.creatorDisplayName || 'Criador Cognira'}
                                        </span>
                                        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-500">
                                            {program.examType || 'Livre'}
                                        </span>
                                        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-500">
                                            {program.monetizationType}
                                        </span>
                                    </div>

                                    <p className="mt-5 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                        Atualizado em {program.updatedAt.toLocaleDateString('pt-BR')}
                                    </p>

                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <form action={approveProgramPublication}>
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <button className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black">
                                                Aprovar e publicar
                                            </button>
                                        </form>
                                        <form action={requestProgramChanges}>
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <button className="rounded-2xl border border-amber-500/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                                                Solicitar ajustes
                                            </button>
                                        </form>
                                        <Link
                                            href={`/creator/programs/${program.id}`}
                                            className="rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-200"
                                        >
                                            Abrir detalhes
                                        </Link>
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
