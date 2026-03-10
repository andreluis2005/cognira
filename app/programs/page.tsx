import Link from 'next/link';
import { listPublishedPrograms, listTopCreators } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

function normalizeValue(value?: string) {
    return value?.trim().toLowerCase() || '';
}

export default async function ProgramsPage({
    searchParams,
}: {
    searchParams: Promise<{
        q?: string;
        area?: string;
        exam?: string;
        monetization?: string;
    }>;
}) {
    const params = await searchParams;
    let programs = [] as Awaited<ReturnType<typeof listPublishedPrograms>>;
    let topCreators = [] as Awaited<ReturnType<typeof listTopCreators>>;
    let hasConnectionError = false;

    try {
        programs = await listPublishedPrograms();
        topCreators = await listTopCreators(5);
    } catch {
        hasConnectionError = true;
    }

    const searchTerm = normalizeValue(params.q);
    const areaFilter = normalizeValue(params.area);
    const examFilter = normalizeValue(params.exam);
    const monetizationFilter = normalizeValue(params.monetization);

    const areas = Array.from(new Set(programs.map((program) => program.subjectArea).filter(Boolean))).sort();
    const examTypes = Array.from(new Set(programs.map((program) => program.examType).filter(Boolean))).sort() as string[];
    const monetizationTypes = Array.from(new Set(programs.map((program) => program.monetizationType).filter(Boolean))).sort();

    const filteredPrograms = programs.filter((program) => {
        const matchesSearch = searchTerm
            ? `${program.title} ${program.shortDescription} ${program.subjectArea} ${program.creatorDisplayName || ''}`
                .toLowerCase()
                .includes(searchTerm)
            : true;
        const matchesArea = areaFilter ? normalizeValue(program.subjectArea) === areaFilter : true;
        const matchesExam = examFilter ? normalizeValue(program.examType || '') === examFilter : true;
        const matchesMonetization = monetizationFilter ? normalizeValue(program.monetizationType) === monetizationFilter : true;

        return matchesSearch && matchesArea && matchesExam && matchesMonetization;
    });

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_24%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">Marketplace Cognira</p>
                        <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
                            Encontre um programa para estudar de forma mais inteligente.
                        </h1>
                        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                            Catalogo multi-assunto para provas, concursos, certificacoes e trilhas autorais. O foco nao e
                            volume de questoes: e retencao real antes do dia da prova.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/creator"
                                className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                Publicar um programa
                            </Link>
                            <Link
                                href="/dashboard"
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Ir para meu painel
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Programas</p>
                            <p className="mt-3 text-3xl font-black">{programs.length}</p>
                            <p className="mt-2 text-sm text-zinc-400">Publicados e prontos para descoberta.</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Modelo</p>
                            <p className="mt-3 text-xl font-black">Multi-assunto</p>
                            <p className="mt-2 text-sm text-zinc-400">De AWS a portugues, ENEM, concursos e muito mais.</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Motor</p>
                            <p className="mt-3 text-xl font-black">Retencao cognitiva</p>
                            <p className="mt-2 text-sm text-zinc-400">Aprendizado com reforco e prontidao por topico.</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-5 md:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Descoberta guiada</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">Filtre o que faz sentido para sua prova</h2>
                        </div>
                        <p className="text-sm text-zinc-500">
                            {filteredPrograms.length} resultado(s) de {programs.length}
                        </p>
                    </div>

                    <form className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Buscar</span>
                            <input
                                type="text"
                                name="q"
                                defaultValue={params.q || ''}
                                placeholder="AWS, concurso INSS, matematica, portugues..."
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-500"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Assunto</span>
                            <select
                                name="area"
                                defaultValue={params.area || ''}
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500"
                            >
                                <option value="">Todas as areas</option>
                                {areas.map((area) => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tipo de prova</span>
                            <select
                                name="exam"
                                defaultValue={params.exam || ''}
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500"
                            >
                                <option value="">Todos os tipos</option>
                                {examTypes.map((exam) => (
                                    <option key={exam} value={exam}>{exam}</option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Acesso</span>
                            <select
                                name="monetization"
                                defaultValue={params.monetization || ''}
                                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500"
                            >
                                <option value="">Todos os modelos</option>
                                {monetizationTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </label>

                        <div className="flex flex-wrap gap-3 lg:col-span-4">
                            <button
                                type="submit"
                                className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                Aplicar filtros
                            </button>
                            <Link
                                href="/programs"
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Limpar
                            </Link>
                        </div>
                    </form>
                </section>

                {hasConnectionError ? (
                    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-200">
                        A conexao com o banco falhou. Verifique `DATABASE_URL`, migration e acesso ao projeto Supabase.
                    </div>
                ) : null}

                {!hasConnectionError && programs.length === 0 ? (
                    <div className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/50 p-10 text-center">
                        <p className="text-lg font-bold text-white">Nenhum programa publicado ainda</p>
                        <p className="mt-2 text-sm text-zinc-500">
                            Assim que um criador publicar conteudo, ele passa a aparecer aqui para estudo e descoberta.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/creator"
                                className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                Criar primeiro programa
                            </Link>
                        </div>
                    </div>
                ) : !hasConnectionError && filteredPrograms.length === 0 ? (
                    <div className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/50 p-10 text-center">
                        <p className="text-lg font-bold text-white">Nenhum programa encontrado com esse recorte</p>
                        <p className="mt-2 text-sm text-zinc-500">
                            Ajuste busca, assunto, tipo de prova ou modelo de acesso para ampliar a descoberta.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/programs"
                                className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                Ver todos os programas
                            </Link>
                        </div>
                    </div>
                ) : (
                    <section className="space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Catalogo aberto</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Programas publicados</h2>
                            </div>
                            <p className="text-sm text-zinc-500">{filteredPrograms.length} programas disponiveis</p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {filteredPrograms.map((program) => (
                                <Link
                                    key={program.id}
                                    href={`/programs/${program.slug}`}
                                    className="group rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 transition hover:border-sky-500/40 hover:bg-zinc-950"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            {program.subjectArea}
                                        </span>
                                        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            {program.monetizationType}
                                        </span>
                                    </div>

                                    <h3 className="mt-5 text-2xl font-black tracking-tight transition group-hover:text-sky-300">
                                        {program.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{program.shortDescription}</p>

                                    {program.examType ? (
                                        <div className="mt-4">
                                            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">
                                                {program.examType}
                                            </span>
                                        </div>
                                    ) : null}

                                    <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                        <span>{program.creatorDisplayName || 'Criador Cognira'}</span>
                                        <span>{program.avgRating ? `${program.avgRating}/5 - ${program.reviewCount} aval.` : 'Sem avaliacoes'}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {topCreators.length > 0 ? (
                    <section className="space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Ranking inicial</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Creators com melhor sinal de qualidade</h2>
                            </div>
                            <p className="text-sm text-zinc-500">Baseado em nota, alunos e programas publicados</p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
                            {topCreators.map((creator, index) => (
                                <div key={creator.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                                            #{index + 1}
                                        </span>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                                            {creator.creatorScore.toFixed(0)} pts
                                        </span>
                                    </div>
                                    <p className="mt-4 text-lg font-black text-white">{creator.displayName}</p>
                                    <p className="mt-2 text-sm text-zinc-400">{creator.headline || 'Criador ativo no marketplace Cognira.'}</p>
                                    <div className="mt-5 space-y-2 text-xs text-zinc-400">
                                        <p>{creator.publishedPrograms} programas publicados</p>
                                        <p>{creator.learnerCount} alunos ativos</p>
                                        <p>{creator.avgRating ? `${creator.avgRating}/5 em ${creator.reviewCount} avaliacoes` : 'Sem avaliacoes ainda'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </main>
    );
}
