import Link from 'next/link';
import { listRecommendedPrograms, listTopCreators } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    let topCreators = [] as Awaited<ReturnType<typeof listTopCreators>>;
    let recommendedPrograms = [] as Awaited<ReturnType<typeof listRecommendedPrograms>>;

    try {
        [topCreators, recommendedPrograms] = await Promise.all([
            listTopCreators(3),
            listRecommendedPrograms(3),
        ]);
    } catch {
        topCreators = [];
        recommendedPrograms = [];
    }

    return (
        <main className="min-h-[88vh] bg-[radial-gradient(circle_at_top,rgba(94,173,247,0.18),transparent_28%),linear-gradient(180deg,#0A0A0B_0%,#09090B_100%)] text-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-12 px-2 py-8 md:px-4 lg:flex-row lg:items-center lg:justify-between lg:py-20">
                <section className="max-w-3xl space-y-7">
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-400">Retencao cognitiva</p>
                    <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                        Aprender para lembrar no dia da prova.
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
                        O Cognira conecta criadores e estudantes em uma plataforma de estudo por questoes com foco em
                        reforco, memorizacao e prontidao real.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={data.user ? '/programs' : '/signup'}
                            className="rounded-2xl bg-sky-300 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-black"
                        >
                            {data.user ? 'Explorar programas' : 'Criar conta'}
                        </Link>
                        <Link
                            href="/creator"
                            className="rounded-2xl border border-zinc-700 px-6 py-4 text-sm font-bold text-zinc-200"
                        >
                            Publicar conteudo
                        </Link>
                    </div>
                </section>

                <section className="grid w-full max-w-xl gap-4 md:grid-cols-2">
                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Aluno</p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight">Sessao adaptativa</h2>
                        <p className="mt-3 text-sm text-zinc-400">
                            Estude programas reais, acompanhe prontidao e retome os pontos mais importantes.
                        </p>
                    </div>
                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Criador</p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight">Studio de programas</h2>
                        <p className="mt-3 text-sm text-zinc-400">
                            Crie programas, organize topicos e monte bancos de questoes para qualquer assunto.
                        </p>
                    </div>
                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:col-span-2">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Marketplace</p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight">Multi-assunto por design</h2>
                        <p className="mt-3 text-sm text-zinc-400">
                            AWS foi apenas o ponto de partida. A estrutura do produto foi montada para suportar cursos,
                            certificacoes, vestibulares, concursos e qualquer trilha baseada em questoes.
                        </p>
                    </div>
                </section>
            </div>

            <section className="mx-auto w-full max-w-6xl px-2 pb-12 md:px-4">
                <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Comece com clareza</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Escolha a entrada que combina com seu objetivo</h2>
                        </div>
                        <p className="text-sm text-zinc-500">Menos atrito para entrar, mais foco para memorizar</p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Link
                            href="/programs?exam=concurso"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-sky-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Quero estudar</p>
                            <p className="mt-3 text-2xl font-black">Concursos</p>
                            <p className="mt-2 text-sm text-zinc-400">Veja programas focados em recorrencia de temas, banca e incidencia historica.</p>
                        </Link>
                        <Link
                            href="/programs?exam=certificacao"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-sky-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Quero estudar</p>
                            <p className="mt-3 text-2xl font-black">Certificacoes</p>
                            <p className="mt-2 text-sm text-zinc-400">Encontre trilhas tecnicas com reforco progressivo e prontidao visivel.</p>
                        </Link>
                        <Link
                            href="/programs?exam=vestibular"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-sky-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Quero estudar</p>
                            <p className="mt-3 text-2xl font-black">Vestibulares</p>
                            <p className="mt-2 text-sm text-zinc-400">Monte base por assunto e acompanhe os pontos que mais precisam voltar.</p>
                        </Link>
                        <Link
                            href="/creator"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-emerald-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Quero publicar</p>
                            <p className="mt-3 text-2xl font-black">Criar programa</p>
                            <p className="mt-2 text-sm text-zinc-400">Monte sua trilha, gere rascunhos com IA e publique com seu ranking.</p>
                        </Link>
                    </div>
                </div>
            </section>

            {recommendedPrograms.length > 0 ? (
                <section className="mx-auto w-full max-w-6xl px-2 pb-12 md:px-4">
                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Sugestoes de entrada</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Programas bons para comecar hoje</h2>
                            </div>
                            <Link href="/programs" className="text-sm font-bold text-zinc-300">
                                Ver mais programas
                            </Link>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {recommendedPrograms.map((program) => (
                                <Link
                                    key={program.id}
                                    href={`/programs/${program.slug}`}
                                    className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-sky-500/40"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                                            {program.subjectArea}
                                        </span>
                                        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            {program.examType || 'Livre'}
                                        </span>
                                    </div>
                                    <p className="mt-4 text-xl font-black text-white">{program.title}</p>
                                    <p className="mt-2 text-sm text-zinc-400">{program.shortDescription}</p>
                                    <div className="mt-5 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                        <span>{program.creatorDisplayName || 'Criador Cognira'}</span>
                                        <span>{program.avgRating ? `${program.avgRating}/5` : 'Sem nota'}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {topCreators.length > 0 ? (
                <section className="mx-auto w-full max-w-6xl px-2 pb-16 md:px-4">
                    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Creators em destaque</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Quem esta puxando o nivel do marketplace</h2>
                            </div>
                            <Link href="/programs" className="text-sm font-bold text-zinc-300">
                                Ver catalogo completo
                            </Link>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {topCreators.map((creator, index) => (
                                <div key={creator.id} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                                            #{index + 1}
                                        </span>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                                            {creator.creatorScore.toFixed(0)} pts
                                        </span>
                                    </div>
                                    <p className="mt-4 text-xl font-black text-white">{creator.displayName}</p>
                                    <p className="mt-2 text-sm text-zinc-400">{creator.headline || 'Criador em crescimento na plataforma.'}</p>
                                    <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        <span className="rounded-full border border-zinc-700 px-3 py-1">{creator.publishedPrograms} programas</span>
                                        <span className="rounded-full border border-zinc-700 px-3 py-1">{creator.learnerCount} alunos</span>
                                        <span className="rounded-full border border-zinc-700 px-3 py-1">
                                            {creator.avgRating ? `${creator.avgRating}/5` : 'Sem nota'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}
        </main>
    );
}
