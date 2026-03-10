import Link from 'next/link';
import { signUp } from '@/lib/auth/actions';

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
    const params = await searchParams;

    return (
        <main className="min-h-screen bg-[#0A0A0B] px-6 py-10 text-white">
            <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-8">
                <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Novo acesso</p>
                    <h1 className="text-4xl font-black tracking-tight">Criar conta</h1>
                    <p className="text-sm text-zinc-400">
                        Uma conta unica para estudar, criar programas e evoluir com a plataforma.
                    </p>
                </div>

                <form action={signUp} className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
                    <input type="hidden" name="redirect_to" value={params.redirectTo || '/dashboard'} />
                    <div className="space-y-2">
                        <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Nome
                        </label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            required
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Senha
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />
                    </div>

                    {params.error ? (
                        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                            {params.error}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        className="w-full rounded-2xl bg-emerald-300 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:bg-emerald-200"
                    >
                        Criar conta
                    </button>
                </form>

                <p className="text-sm text-zinc-500">
                    Ja tem conta?{' '}
                    <Link href={params.redirectTo ? `/login?redirectTo=${encodeURIComponent(params.redirectTo)}` : '/login'} className="font-bold text-zinc-200">
                        Entrar
                    </Link>
                </p>
            </div>
        </main>
    );
}
