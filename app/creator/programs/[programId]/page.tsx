import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
    createQuestion,
    createTopic,
    createTrail,
    approveAIGenerationItem,
    createAIGenerationJob,
    archiveProgram,
    deleteQuestion,
    deleteTopic,
    deleteTrail,
    submitProgramForReview,
    rejectAIGenerationItem,
    generateAIDraftItems,
    unpublishProgram,
    updateAIGenerationItem,
    updateProgram,
    updateQuestion,
    updateTopic,
    updateTrail,
} from '@/lib/creator/actions';
import { getCreatorProgramById } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';

function getFlagMessage(query: Record<string, string | undefined>) {
    if (query.programUpdated) return 'Program updated successfully.';
    if (query.submitted) return 'Program sent for editorial review.';
    if (query.trailCreated) return 'Track created successfully.';
    if (query.trailUpdated) return 'Track updated successfully.';
    if (query.trailDeleted) return 'Track removed successfully.';
    if (query.topicCreated) return 'Topic created successfully.';
    if (query.topicUpdated) return 'Topic updated successfully.';
    if (query.topicDeleted) return 'Topic removed successfully.';
    if (query.questionCreated) return 'Question created successfully.';
    if (query.questionUpdated) return 'Question updated successfully.';
    if (query.questionDeleted) return 'Question removed successfully.';
    return null;
}

function getOptionValue(
    options: Array<{ label: string; body: string; isCorrect: boolean }>,
    label: string,
) {
    return options.find((option) => option.label === label)?.body || '';
}

function getCorrectOption(options: Array<{ label: string; body: string; isCorrect: boolean }>) {
    return options.find((option) => option.isCorrect)?.label || 'A';
}

function parseDraftPayload(payload: string) {
    try {
        return JSON.parse(payload) as {
            topicId?: string;
            stem: string;
            explanation: string;
            difficultyLevel: string;
            options: Array<{ label: string; body: string; isCorrect: boolean }>;
        };
    } catch {
        return null;
    }
}

export default async function CreatorProgramDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ programId: string }>;
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const { programId } = await params;
    const query = await searchParams;

    if (!data.user) {
        redirect('/login');
    }

    const program = await getCreatorProgramById(data.user.id, programId);

    if (!program) {
        notFound();
    }

    const successMessage = getFlagMessage(query);
    const isConcursoProgram = /concurso/i.test(program.examType || '') || /concurso/i.test(program.subjectArea || '');

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_28%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <Link href="/creator" className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
                                Creator Studio
                            </Link>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">{program.subjectArea}</p>
                                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{program.title}</h1>
                            </div>
                            <p className="max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base">
                                {program.shortDescription}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {program.status === 'published' ? (
                                <>
                                    <form action={unpublishProgram}>
                                        <input type="hidden" name="program_id" value={program.id} />
                                        <button className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200">
                                            Return to draft
                                        </button>
                                    </form>
                                    <form action={archiveProgram}>
                                        <input type="hidden" name="program_id" value={program.id} />
                                        <button className="rounded-2xl border border-amber-500/40 px-5 py-3 text-sm font-bold text-amber-200">
                                            Archive
                                        </button>
                                    </form>
                                </>
                            ) : program.reviewStatus === 'submitted' ? (
                                <span className="rounded-2xl border border-amber-500/40 px-5 py-3 text-sm font-bold text-amber-200">
                                    Under editorial review
                                </span>
                            ) : (
                                <form action={submitProgramForReview}>
                                    <input type="hidden" name="program_id" value={program.id} />
                                    <button className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                        Send for review
                                    </button>
                                </form>
                            )}

                            <Link
                                href={program.status === 'published' ? `/programs/${program.slug}` : '/programs'}
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                {program.status === 'published' ? 'See public page' : 'See catalog'}
                            </Link>
                        </div>
                    </div>
                </header>

                {successMessage ? (
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
                        {successMessage}
                    </div>
                ) : null}

                {query.error ? (
                    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
                        {query.error}
                    </div>
                ) : null}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Status</p>
                        <p className="mt-3 text-xl font-black capitalize">{program.status}</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Visibility</p>
                        <p className="mt-3 text-xl font-black capitalize">{program.visibility}</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tracks</p>
                        <p className="mt-3 text-xl font-black">{program.trails.length}</p>
                    </div>
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Questions</p>
                        <p className="mt-3 text-xl font-black">{program.questions.length}</p>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <form action={updateProgram} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <input type="hidden" name="program_id" value={program.id} />
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Program</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Main details</h2>
                                </div>
                                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Public slug: {program.slug}</p>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Title</span>
                                    <input
                                        name="title"
                                        required
                                        defaultValue={program.title}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Short description</span>
                                    <textarea
                                        name="short_description"
                                        required
                                        rows={3}
                                        defaultValue={program.shortDescription}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Long description</span>
                                    <textarea
                                        name="long_description"
                                        rows={5}
                                        defaultValue={program.longDescription || ''}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Subject area</span>
                                    <input
                                        name="subject_area"
                                        required
                                        defaultValue={program.subjectArea}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Exam type</span>
                                    <input
                                        name="exam_type"
                                        defaultValue={program.examType || ''}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Monetization</span>
                                    <select
                                        name="monetization_type"
                                        defaultValue={program.monetizationType}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    >
                                        <option value="free">Free</option>
                                        <option value="donation">Donation</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </label>

                                <label className="space-y-2">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Visibility</span>
                                    <select
                                        name="visibility"
                                        defaultValue={program.visibility}
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                        <option value="unlisted">Unlisted</option>
                                    </select>
                                </label>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Save changes
                                </button>
                                <Link href="/creator" className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200">
                                    Back to studio
                                </Link>
                            </div>
                        </form>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tracks</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Macro structure</h2>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{program.trails.length} registered</span>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {program.trails.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                        No track created yet.
                                    </div>
                                ) : (
                                    program.trails.map((trail) => (
                                        <form key={trail.id} action={updateTrail} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <input type="hidden" name="trail_id" value={trail.id} />
                                            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                                                <div className="space-y-4">
                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Track title</span>
                                                        <input
                                                            name="title"
                                                            required
                                                            defaultValue={trail.title}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                                        />
                                                    </label>
                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Description</span>
                                                        <textarea
                                                            name="description"
                                                            rows={3}
                                                            defaultValue={trail.description || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-col gap-3 md:justify-between">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {trail.status}
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <button className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                                            Save
                                                        </button>
                                                        <button
                                                            formAction={deleteTrail}
                                                            className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm font-bold text-rose-200"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topics</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Knowledge map</h2>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{program.topics.length} active</span>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {program.topics.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                        No topic created yet.
                                    </div>
                                ) : (
                                    program.topics.map((topic) => (
                                        <form key={topic.id} action={updateTopic} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <input type="hidden" name="topic_id" value={topic.id} />
                                            <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
                                                <div className="space-y-4 xl:col-span-2">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <label className="space-y-2 md:col-span-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topic title</span>
                                                            <input
                                                                name="title"
                                                                required
                                                                defaultValue={topic.title}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                            />
                                                        </label>

                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Track</span>
                                                            <select
                                                                name="trail_id"
                                                                defaultValue={topic.trailId || ''}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                            >
                                                                <option value="">No associated track</option>
                                                                {program.trails.map((trail) => (
                                                                    <option key={trail.id} value={trail.id}>
                                                                        {trail.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Exam weight</span>
                                                            <select
                                                                name="exam_weight"
                                                                defaultValue={topic.examWeight || ''}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                            >
                                                                <option value="">Undefined</option>
                                                                <option value="LOW">Low</option>
                                                                <option value="MEDIUM">Medium</option>
                                                                <option value="HIGH">High</option>
                                                            </select>
                                                        </label>
                                                    </div>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Description</span>
                                                        <textarea
                                                            name="description"
                                                            rows={3}
                                                            defaultValue={topic.description || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-col gap-3 xl:justify-between">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {topic.status}
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <button className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                                            Save
                                                        </button>
                                                        <button
                                                            formAction={deleteTopic}
                                                            className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm font-bold text-rose-200"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-7">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Questions</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight">Editable bank</h2>
                                </div>
                                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{program.questions.length} registered</span>
                            </div>

                            <div className="mt-6 grid gap-4">
                                {program.questions.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                                        No question created yet.
                                    </div>
                                ) : (
                                    program.questions.map((question, index) => (
                                        <form key={question.id} action={updateQuestion} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                            <input type="hidden" name="program_id" value={program.id} />
                                            <input type="hidden" name="question_id" value={question.id} />

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    Question {index + 1}
                                                </span>
                                                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    {question.status}
                                                </span>
                                            </div>

                                            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_auto]">
                                                <div className="space-y-4">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topic</span>
                                                            <select
                                                                name="topic_id"
                                                                required
                                                                defaultValue={question.topicId}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            >
                                                                {program.topics.map((topic) => (
                                                                    <option key={topic.id} value={topic.id}>
                                                                        {topic.title}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Difficulty</span>
                                                            <select
                                                                name="difficulty_level"
                                                                defaultValue={question.difficultyLevel}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            >
                                                                <option value="easy">Easy</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="hard">Hard</option>
                                                            </select>
                                                        </label>
                                                    </div>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Stem</span>
                                                        <textarea
                                                            name="stem"
                                                            rows={4}
                                                            required
                                                            defaultValue={question.stem}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                        />
                                                    </label>

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Option A</span>
                                                            <input
                                                                name="option_a"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'A')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Option B</span>
                                                            <input
                                                                name="option_b"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'B')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Option C</span>
                                                            <input
                                                                name="option_c"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'C')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                        <label className="space-y-2">
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Option D</span>
                                                            <input
                                                                name="option_d"
                                                                required
                                                                defaultValue={getOptionValue(question.options, 'D')}
                                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                            />
                                                        </label>
                                                    </div>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Correct Answer</span>
                                                        <select
                                                            name="correct_option"
                                                            defaultValue={getCorrectOption(question.options)}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                        >
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="C">C</option>
                                                            <option value="D">D</option>
                                                        </select>
                                                    </label>

                                                    <label className="space-y-2">
                                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Explanation</span>
                                                        <textarea
                                                            name="explanation"
                                                            rows={4}
                                                            required
                                                            defaultValue={question.explanation}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-col gap-3 xl:justify-between">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {question.difficultyLevel}
                                                    </span>
                                                    <div className="flex flex-col gap-3">
                                                        <button className="rounded-2xl bg-violet-300 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                                            Save
                                                        </button>
                                                        <button
                                                            formAction={deleteQuestion}
                                                            className="rounded-2xl border border-rose-500/40 px-4 py-3 text-sm font-bold text-rose-200"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <form action={createAIGenerationJob} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <input type="hidden" name="exam_type" value={program.examType || ''} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">AI Brief</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">
                                {isConcursoProgram ? 'Generation guided by test incidence' : 'Generation guided by pedagogical objective'}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                                {isConcursoProgram
                                    ? 'For civil service exams, the brief requests the board, role, historical patterns, and most frequent themes. This prepares the pipeline to generate questions prioritizing what is more likely to appear on the test.'
                                    : 'Use this brief to guide future batches of questions focusing on memorization, coverage, and student progression.'}
                            </p>

                            <div className="mt-5 space-y-4">
                                <textarea
                                    name="objective"
                                    required
                                    rows={3}
                                    placeholder="Batch objective: what should the AI prioritize in this set of questions?"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <select
                                        name="trail_id"
                                        defaultValue=""
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    >
                                        <option value="">No specific track</option>
                                        {program.trails.map((trail) => (
                                            <option key={trail.id} value={trail.id}>{trail.title}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="topic_id"
                                        defaultValue=""
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    >
                                        <option value="">No specific topic</option>
                                        {program.topics.map((topic) => (
                                            <option key={topic.id} value={topic.id}>{topic.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {isConcursoProgram ? (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <input
                                                name="board_name"
                                                placeholder="Board: CESPE, FGV, FCC..."
                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                            />
                                            <input
                                                name="role_name"
                                                placeholder="Role, area, or department"
                                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                            />
                                        </div>
                                        <input
                                            name="exam_year_range"
                                            placeholder="Previous exams range: e.g. 2020-2025"
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                        />
                                        <textarea
                                            name="priority_themes"
                                            rows={3}
                                            placeholder="Themes more likely to appear, subjects frequently tested, perceived recurrences..."
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                        />
                                        <textarea
                                            name="evidence_notes"
                                            rows={3}
                                            placeholder="Notes on previous exams, board style, testing patterns, and points that need more memorization"
                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                        />
                                    </>
                                ) : (
                                    <textarea
                                        name="priority_themes"
                                        rows={3}
                                        placeholder="Core concepts, recurring errors, or subjects that need more reinforcement"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    />
                                )}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <input
                                        name="difficulty_mix"
                                        placeholder="Distribution: 60% medium, 30% easy, 10% hard"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    />
                                    <input
                                        name="question_count"
                                        type="number"
                                        min="1"
                                        max="50"
                                        defaultValue="10"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                    />
                                </div>

                                <input
                                    name="source_material_url"
                                    placeholder="URL for syllabus, handout, or reference material"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                />
                                <textarea
                                    name="source_material_text"
                                    rows={4}
                                    placeholder="Important excerpts, summarized syllabus, or additional guidelines for generation"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                />
                                <input type="hidden" name="provider_name" value="manual-brief" />

                                <button className="w-full rounded-2xl bg-fuchsia-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Save generation brief
                                </button>
                            </div>
                        </form>

                        <form action={createTrail} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">New track</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Add macro step</h2>
                            <div className="mt-5 space-y-4">
                                <input
                                    name="title"
                                    required
                                    placeholder="e.g. Fundamentals, Final review..."
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                />
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Short description of the track"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                                />
                                <button className="w-full rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Create track
                                </button>
                            </div>
                        </form>

                        <form action={createTopic} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">New topic</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Add subject</h2>
                            <div className="mt-5 space-y-4">
                                <input
                                    name="title"
                                    required
                                    placeholder="e.g. IAM, Algebra, Comprehension..."
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                />
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="Short description of the topic"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                />
                                <select
                                    name="trail_id"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    defaultValue=""
                                >
                                    <option value="">No associated track</option>
                                    {program.trails.map((trail) => (
                                        <option key={trail.id} value={trail.id}>
                                            {trail.title}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    name="exam_weight"
                                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                                    defaultValue=""
                                >
                                    <option value="">Weight not defined</option>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                                <button className="w-full rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                    Create topic
                                </button>
                            </div>
                        </form>

                        <form action={createQuestion} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <input type="hidden" name="program_id" value={program.id} />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Nova questao</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Adicionar questao manual</h2>

                            {program.topics.length === 0 ? (
                                <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                                    Crie pelo menos um topico antes de cadastrar questoes.
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    <select
                                        name="topic_id"
                                        required
                                        defaultValue=""
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    >
                                        <option value="" disabled>Selecione um topico</option>
                                        {program.topics.map((topic) => (
                                            <option key={topic.id} value={topic.id}>
                                                {topic.title}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        name="difficulty_level"
                                        defaultValue="medium"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    >
                                        <option value="easy">Facil</option>
                                        <option value="medium">Media</option>
                                        <option value="hard">Dificil</option>
                                    </select>

                                    <textarea
                                        name="stem"
                                        required
                                        rows={4}
                                        placeholder="Enunciado da questao"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />

                                    <input
                                        name="option_a"
                                        required
                                        placeholder="Alternativa A"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />
                                    <input
                                        name="option_b"
                                        required
                                        placeholder="Alternativa B"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />
                                    <input
                                        name="option_c"
                                        required
                                        placeholder="Alternativa C"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />
                                    <input
                                        name="option_d"
                                        required
                                        placeholder="Alternativa D"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />

                                    <select
                                        name="correct_option"
                                        defaultValue="A"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    >
                                        <option value="A">Resposta correta: A</option>
                                        <option value="B">Resposta correta: B</option>
                                        <option value="C">Resposta correta: C</option>
                                        <option value="D">Resposta correta: D</option>
                                    </select>

                                    <textarea
                                        name="explanation"
                                        required
                                        rows={4}
                                        placeholder="Explicacao da resposta correta"
                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                    />

                                    <button className="w-full rounded-2xl bg-violet-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black">
                                        Criar questao
                                    </button>
                                </div>
                            )}
                        </form>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Fila de briefs</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Base para geracao futura</h2>
                            <div className="mt-5 space-y-3">
                                {program.aiJobs.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                                        Nenhum brief salvo ainda. Este painel vai acumular o contexto que usaremos para gerar questoes com IA.
                                    </div>
                                ) : (
                                    program.aiJobs.slice(0, 5).map((job) => (
                                        <div key={job.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{job.providerName || 'manual-brief'}</p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                                        {job.createdAt.toLocaleDateString('pt-BR')} · {job.status}
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    {job.generatedCount} itens
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{job.promptText || 'Sem prompt registrado.'}</p>
                                            <div className="mt-4">
                                                <form action={generateAIDraftItems}>
                                                    <input type="hidden" name="program_id" value={program.id} />
                                                    <input type="hidden" name="job_id" value={job.id} />
                                                    <button className="rounded-2xl bg-fuchsia-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black">
                                                        Gerar rascunhos
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Rascunhos de IA</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Revisar antes de virar questao</h2>
                            <div className="mt-5 space-y-4">
                                {program.aiItems.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
                                        Quando voce gerar rascunhos a partir de um brief, eles vao aparecer aqui para aprovacao.
                                    </div>
                                ) : (
                                    program.aiItems.slice(0, 10).map((item) => {
                                        const draft = parseDraftPayload(item.draftPayloadJson);

                                        if (!draft) {
                                            return (
                                                <div key={item.id} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                                                    Could not read this draft.
                                                </div>
                                            );
                                        }

                                        return (
                                            <form key={item.id} action={updateAIGenerationItem} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                                                <input type="hidden" name="program_id" value={program.id} />
                                                <input type="hidden" name="item_id" value={item.id} />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {draft.difficultyLevel}
                                                    </span>
                                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {item.validationStatus}
                                                    </span>
                                                </div>

                                                <div className="mt-4 space-y-4">
                                                    <select
                                                        name="topic_id"
                                                        defaultValue={draft.topicId || ''}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    >
                                                        {program.topics.map((topic) => (
                                                            <option key={topic.id} value={topic.id}>{topic.title}</option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        name="difficulty_level"
                                                        defaultValue={draft.difficultyLevel || 'medium'}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    >
                                                        <option value="easy">Facil</option>
                                                        <option value="medium">Media</option>
                                                        <option value="hard">Dificil</option>
                                                    </select>

                                                    <textarea
                                                        name="stem"
                                                        rows={4}
                                                        required
                                                        defaultValue={draft.stem}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    />

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <input
                                                            name="option_a"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'A')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                        <input
                                                            name="option_b"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'B')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                        <input
                                                            name="option_c"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'C')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                        <input
                                                            name="option_d"
                                                            required
                                                            defaultValue={draft.options.find((option) => option.label === 'D')?.body || ''}
                                                            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                        />
                                                    </div>

                                                    <select
                                                        name="correct_option"
                                                        defaultValue={draft.options.find((option) => option.isCorrect)?.label || 'A'}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    >
                                                        <option value="A">Resposta correta: A</option>
                                                        <option value="B">Resposta correta: B</option>
                                                        <option value="C">Resposta correta: C</option>
                                                        <option value="D">Resposta correta: D</option>
                                                    </select>

                                                    <textarea
                                                        name="explanation"
                                                        rows={4}
                                                        required
                                                        defaultValue={draft.explanation}
                                                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-fuchsia-400"
                                                    />
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-3">
                                                    <button className="rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-200">
                                                        Salvar rascunho
                                                    </button>
                                                    {item.validationStatus === 'pending' ? (
                                                        <>
                                                            <button
                                                                formAction={approveAIGenerationItem}
                                                                className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-black"
                                                            >
                                                                Aprovar como questao
                                                            </button>
                                                            <button
                                                                formAction={rejectAIGenerationItem}
                                                                className="rounded-2xl border border-rose-500/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-rose-200"
                                                            >
                                                                Rejeitar
                                                            </button>
                                                        </>
                                                    ) : null}
                                                </div>

                                                {item.validationStatus !== 'pending' ? (
                                                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                                                        Este rascunho ja foi marcado como {item.validationStatus}.
                                                    </p>
                                                ) : null}
                                            </form>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
