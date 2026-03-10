import Link from 'next/link';
import { listUserRoles } from '@/lib/db/account';
import { createClient } from '@/lib/supabase/server';

const navItems = [
    { href: '/programs', label: 'Programs' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/creator', label: 'Creator' },
];

export default async function SiteHeader() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const roles = data.user ? await listUserRoles(data.user.id) : [];
    const canReviewPrograms = roles.includes('admin') || roles.includes('reviewer');

    return (
        <header className="sticky top-0 z-40 -mx-4 border-b border-zinc-800/80 bg-[#0A0A0B]/90 px-4 py-4 backdrop-blur md:-mx-6 md:px-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="text-lg font-black tracking-tight text-white md:text-xl">
                        Cognira
                    </Link>
                    <Link
                        href={data.user ? '/session?mode=smart' : '/signup'}
                        className="rounded-full bg-sky-300 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-black md:hidden"
                    >
                        {data.user ? 'Study' : 'Log in'}
                    </Link>
                </div>

                <nav className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="rounded-full px-3 py-2 transition hover:bg-zinc-900 hover:text-white"
                        >
                            {item.label}
                        </Link>
                    ))}

                    {canReviewPrograms ? (
                        <Link
                            href="/admin/review"
                            className="rounded-full px-3 py-2 transition hover:bg-zinc-900 hover:text-white"
                        >
                            Review
                        </Link>
                    ) : null}

                    {data.user ? (
                        <>
                            <Link
                                href="/account"
                                className="rounded-full border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                            >
                                Account
                            </Link>
                            <Link
                                href="/session?mode=smart"
                                className="hidden rounded-full bg-sky-300 px-4 py-2 text-black md:inline-flex"
                            >
                                Study
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-full border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/signup"
                                className="hidden rounded-full bg-sky-300 px-4 py-2 text-black md:inline-flex"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
