import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createProgram } from '@/lib/creator/actions';
import { createClient } from '@/lib/supabase/server';

export default async function NewProgramPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const params = await searchParams;

    if (!data.user) {
        redirect('/login');
    }

    return (
        <main className="min-h-screen bg-[#0A0A0B] px-6 py-10 text-white">
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="space-y-3">
                    <Link href="/creator" className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                        Creator Studio
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight">Novo programa</h1>
                    <p className="text-sm text-zinc-400">
                        Primeiro CRUD real do Cognira. A ideia aqui e criar a casca do programa sem encostar na engine.
                    </p>
                </div>

                <form action={createProgram} className="space-y-5 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Titulo
                        </label>
                        <input
                            id="title"
                            name="title"
                            required
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="short_description" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Descricao curta
                        </label>
                        <textarea
                            id="short_description"
                            name="short_description"
                            required
                            rows={4}
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="subject_area" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Area
                            </label>
                            <input
                                id="subject_area"
                                name="subject_area"
                                required
                                placeholder="AWS, ENEM, Portugues, Matematica..."
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="exam_type" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Tipo de prova
                            </label>
                            <input
                                id="exam_type"
                                name="exam_type"
                                placeholder="Certificacao, concurso, vestibular..."
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="monetization_type" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Monetizacao
                            </label>
                            <select
                                id="monetization_type"
                                name="monetization_type"
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            >
                                <option value="free">Gratis</option>
                                <option value="donation">Doacao</option>
                                <option value="paid">Pago</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="visibility" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                Visibilidade
                            </label>
                            <select
                                id="visibility"
                                name="visibility"
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                            >
                                <option value="public">Publico</option>
                                <option value="private">Privado</option>
                                <option value="unlisted">Nao listado</option>
                            </select>
                        </div>
                    </div>

                    {params.error ? (
                        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                            {params.error}
                        </p>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                        >
                            Criar programa
                        </button>
                        <Link href="/creator" className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200">
                            Voltar
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}
