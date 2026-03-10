import { redirect } from 'next/navigation';
import { signOut } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

export default async function AccountPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        redirect('/login');
    }

    return (
        <main className="min-h-screen bg-[#0A0A0B] px-6 py-10 text-white">
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Conta</p>
                    <h1 className="text-4xl font-black tracking-tight">{data.user.user_metadata.full_name || data.user.email}</h1>
                    <p className="text-sm text-zinc-400">{data.user.email}</p>
                </div>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Perfil</p>
                        <p className="mt-3 text-sm text-zinc-300">Base pronta para estudante, criador e patrocinador.</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Auth</p>
                        <p className="mt-3 text-sm text-zinc-300">Sessao gerenciada por Supabase no plano gratuito.</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Proximo passo</p>
                        <p className="mt-3 text-sm text-zinc-300">Ligar ownership e perfis de criador ao banco.</p>
                    </div>
                </section>

                <form action={signOut}>
                    <button className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:border-zinc-500">
                        Sair
                    </button>
                </form>
            </div>
        </main>
    );
}
