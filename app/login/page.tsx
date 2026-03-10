import Link from 'next/link';
import { signIn } from '@/lib/auth/actions';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
    const params = await searchParams;

    return (
        <main className="min-h-screen bg-[#0A0A0B] px-6 py-10 text-white">
            <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-8">
                <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">Cognira</p>
                    <h1 className="text-4xl font-black tracking-tight">Log in</h1>
                    <p className="text-sm text-zinc-400">
                        Simple access for students and creators with Supabase on the free plan.
                    </p>
                </div>

                <form action={signIn} className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6">
                    <input type="hidden" name="redirect_to" value={params.redirectTo || '/dashboard'} />
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                        />
                    </div>

                    {params.error ? (
                        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                            {params.error}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        className="w-full rounded-2xl bg-sky-300 px-4 py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition hover:bg-sky-200"
                    >
                        Log in
                    </button>
                </form>

                <p className="text-sm text-zinc-500">
                    Don't have an account yet?{' '}
                    <Link href={params.redirectTo ? `/signup?redirectTo=${encodeURIComponent(params.redirectTo)}` : '/signup'} className="font-bold text-zinc-200">
                        Sign up
                    </Link>
                </p>
            </div>
        </main>
    );
}
