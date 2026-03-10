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
        : 'No rating yet';
    const rankLabel = creatorMetrics?.leaderboardPosition
        ? `#${creatorMetrics.leaderboardPosition} of ${creatorMetrics.leaderboardSize}`
        : 'Waiting for signals';

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_24%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Creator Studio</p>
                        <h1 className="text-4xl font-black tracking-tight md:text-6xl">Publish knowledge in Cognira format.</h1>
                        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                            Build programs, organize tracks, topics, and questions into a base ready to become real study.
                        </p>
                        <div className="rounded-[1.75rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Your status</p>
                            <p className="mt-2 text-lg font-black">
                                {creatorMetrics?.publishedPrograms
                                    ? `You already have ${creatorMetrics.publishedPrograms} published program${creatorMetrics.publishedPrograms > 1 ? 's' : ''}.`
                                    : 'Your studio is ready to publish the first program.'}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-emerald-100/80">
                                {creatorMetrics?.learnerCount
                                    ? `${creatorMetrics.learnerCount} student${creatorMetrics.learnerCount > 1 ? 's' : ''} already study with your content.`
                                    : 'As soon as there is real study and ratings, your score and leaderboard position will grow stronger.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/creator/programs/new"
                                className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                New program
                            </Link>
                            <Link
                                href="/programs"
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                See catalog
                            </Link>
                            {canReviewPrograms ? (
                                <Link
                                    href="/admin/review"
                                    className="rounded-2xl border border-sky-500/40 px-5 py-3 text-sm font-bold text-sky-200"
                                >
                                    Review queue
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Creator</p>
                            <p className="mt-3 text-xl font-black">{creatorProfile.displayName}</p>
                            <p className="mt-2 text-sm text-zinc-400">
                                {creatorMetrics?.headline || 'Profile synced with auth, database, and marketplace.'}
                            </p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Creator Score</p>
                            <p className="mt-3 text-4xl font-black">{Math.round(creatorMetrics?.creatorScore || 0)}</p>
                            <p className="mt-2 text-sm text-zinc-400">Considers perceived quality, published programs, and active students.</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Position</p>
                            <p className="mt-3 text-xl font-black">{rankLabel}</p>
                            <p className="mt-2 text-sm text-zinc-400">Current ranking among creators with public signals on the marketplace.</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Active programs</p>
                        <p className="mt-3 text-3xl font-black">{creatorMetrics?.publishedPrograms || 0}</p>
                        <p className="mt-2 text-sm text-zinc-400">Published and visible content in the catalog.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Drafts</p>
                        <p className="mt-3 text-3xl font-black">{creatorMetrics?.draftPrograms || 0}</p>
                        <p className="mt-2 text-sm text-zinc-400">Programs under construction, ready for editorial refinement.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Average rating</p>
                        <p className="mt-3 text-3xl font-black">{ratingLabel}</p>
                        <p className="mt-2 text-sm text-zinc-400">{creatorMetrics?.reviewCount || 0} consolidated rating(s).</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Active students</p>
                        <p className="mt-3 text-3xl font-black">{creatorMetrics?.learnerCount || 0}</p>
                        <p className="mt-2 text-sm text-zinc-400">People enrolled in programs published by you.</p>
                    </div>
                </section>

                {params.created ? (
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                        Program successfully created.
                    </div>
                ) : null}

                {params.submitted ? (
                    <div className="rounded-3xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
                        Program sent for editorial review.
                    </div>
                ) : null}

                {params.archived ? (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        Program archived and removed from public storefront.
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
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Your programs</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Editorial base</h2>
                        </div>
                        <p className="text-sm text-zinc-500">{programs.length} registered programs</p>
                    </div>

                    {programs.length === 0 ? (
                        <div className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
                            <p className="text-lg font-bold">No program created yet</p>
                            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
                                Start with the first program. Then you can structure tracks, topics, and questions.
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
                                            Structure
                                        </Link>
                                        {program.status !== 'published' && program.reviewStatus !== 'submitted' ? (
                                            <form action={submitProgramForReview}>
                                                <input type="hidden" name="program_id" value={program.id} />
                                                <button className="rounded-2xl bg-sky-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black">
                                                    Send for review
                                                </button>
                                            </form>
                                        ) : program.reviewStatus === 'submitted' ? (
                                            <span className="rounded-2xl border border-amber-500/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                                                Under review
                                            </span>
                                        ) : (
                                            <Link
                                                href={`/programs/${program.slug}`}
                                                className="rounded-2xl bg-zinc-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black"
                                            >
                                                See in catalog
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
