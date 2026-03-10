<<<<<<< HEAD
import Link from 'next/link';
import { ensurePlatformUser } from '@/lib/db/account';
import { listLearnerPrograms, listRecommendedPrograms } from '@/lib/db/queries';
import { createClient } from '@/lib/supabase/server';
import LegacyDashboard from '@/app/dashboard/LegacyDashboard';

function getOverallStatus(score: number) {
    if (score < 50) {
        return {
            label: 'Em risco',
            tone: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
            message: 'Foque nas bases e retome seus programas com mais frequencia.',
        };
    }

    if (score < 80) {
        return {
            label: 'Em evolucao',
            tone: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
            message: 'Bom ritmo. Continue reforcando os programas em andamento.',
        };
    }

    return {
        label: 'Pronto para avancar',
        tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
        message: 'Seu historico mostra boa retencao nos programas ativos.',
    };
}

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
        return <LegacyDashboard />;
    }

    await ensurePlatformUser(data.user);
    const learnerPrograms = await listLearnerPrograms(data.user.id);

    if (learnerPrograms.length === 0) {
        const recommendedPrograms = await listRecommendedPrograms(4);

        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_22%),#0A0A0B] text-white">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                    <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">Primeiro passo</p>
                            <h1 className="text-4xl font-black tracking-tight md:text-6xl">Vamos montar sua base de estudo.</h1>
                            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                                Sua conta ja esta pronta. Agora falta escolher um programa para o Cognira comecar a medir
                                prontidao, reforcar topicos importantes e organizar sua rotina de revisao.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/programs"
                                    className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                                >
                                    Explorar programas
                                </Link>
                                <Link
                                    href="/programs?exam=concurso"
                                    className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                                >
                                    Ver concursos
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">1. Escolha um alvo</p>
                                <p className="mt-3 text-lg font-black">Prova, curso ou certificacao</p>
                                <p className="mt-2 text-sm text-zinc-400">Entre em um programa alinhado ao que voce quer memorizar.</p>
                            </div>
                            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">2. Faca uma sessao</p>
                                <p className="mt-3 text-lg font-black">O progresso comeca aqui</p>
                                <p className="mt-2 text-sm text-zinc-400">Basta uma primeira sessao para o painel ganhar contexto real.</p>
                            </div>
                            <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">3. Volte sempre</p>
                                <p className="mt-3 text-lg font-black">Reforco vira rotina</p>
                                <p className="mt-2 text-sm text-zinc-400">Depois da primeira trilha, o Cognira passa a orientar a retomada.</p>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Link
                            href="/programs?exam=concurso"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-sky-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Comecar por</p>
                            <p className="mt-3 text-2xl font-black">Concursos</p>
                            <p className="mt-2 text-sm text-zinc-400">Priorize bancas, temas recorrentes e carga de incidencia.</p>
                        </Link>
                        <Link
                            href="/programs?exam=certificacao"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-sky-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Comecar por</p>
                            <p className="mt-3 text-2xl font-black">Certificacoes</p>
                            <p className="mt-2 text-sm text-zinc-400">AWS e outros programas tecnicos com revisao guiada.</p>
                        </Link>
                        <Link
                            href="/programs?exam=vestibular"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-sky-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Comecar por</p>
                            <p className="mt-3 text-2xl font-black">Vestibulares</p>
                            <p className="mt-2 text-sm text-zinc-400">Monte consistencia antes da prova com estudo em blocos.</p>
                        </Link>
                        <Link
                            href="/creator"
                            className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-emerald-500/40"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Se preferir</p>
                            <p className="mt-3 text-2xl font-black">Criar um programa</p>
                            <p className="mt-2 text-sm text-zinc-400">Tambem da para entrar pelo lado de autor e montar seu proprio acervo.</p>
                        </Link>
                    </section>

                    {recommendedPrograms.length > 0 ? (
                        <section className="space-y-4">
                            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Sugestoes do momento</p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Bons programas para destravar seu inicio</h2>
                                </div>
                                <Link href="/programs" className="text-sm font-bold text-zinc-300">
                                    Ver catalogo completo
                                </Link>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                                {recommendedPrograms.map((program) => (
                                    <Link
                                        key={program.id}
                                        href={`/programs/${program.slug}`}
                                        className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/70 p-5 transition hover:border-sky-500/40"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                                                {program.subjectArea}
                                            </span>
                                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                                {program.examType || 'Livre'}
                                            </span>
                                        </div>
                                        <p className="mt-4 text-xl font-black">{program.title}</p>
                                        <p className="mt-2 text-sm text-zinc-400">{program.shortDescription}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            </main>
        );
    }

    const recommendedPrograms = await listRecommendedPrograms(3, {
        excludeProgramIds: learnerPrograms.map((program) => program.programId),
    });
    const overallReadiness = Math.round(
        learnerPrograms.reduce((sum, item) => sum + item.readinessScore, 0) / learnerPrograms.length,
    );
    const overallStatus = getOverallStatus(overallReadiness);
    const spotlight = learnerPrograms[0];

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_22%),#0A0A0B] text-white">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
                <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">Minha aprendizagem</p>
                        <h1 className="text-4xl font-black tracking-tight md:text-6xl">Seu painel Cognira</h1>
                        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                            Aqui voce acompanha prontidao, retoma programas ativos e transforma estudo em rotina.
                        </p>
                        <div className={`inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${overallStatus.tone}`}>
                            {overallStatus.label}
                        </div>
                        <p className="text-sm text-zinc-400">{overallStatus.message}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Prontidao geral</p>
                            <p className="mt-3 text-4xl font-black">{overallReadiness}%</p>
                            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                                <div
                                    className="h-full bg-sky-400 transition-all duration-700"
                                    style={{ width: `${overallReadiness}%` }}
                                />
                            </div>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Programas ativos</p>
                            <p className="mt-3 text-4xl font-black">{learnerPrograms.length}</p>
                            <p className="mt-2 text-sm text-zinc-400">Catalogos que ja fazem parte da sua rotina.</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Proximo passo</p>
                            <p className="mt-3 text-lg font-black">{spotlight.title}</p>
                            <p className="mt-2 text-sm text-zinc-400">Continue esse programa para atualizar seu progresso.</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Retomar agora</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{spotlight.title}</h2>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{spotlight.shortDescription}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`/learn/programs/${spotlight.programId}`}
                                className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                            >
                                Continuar
                            </Link>
                            <Link
                                href={`/session?programId=${spotlight.programId}&mode=smart`}
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Nova sessao
                            </Link>
                            <Link
                                href="/programs"
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Explorar catalogo
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Programas matriculados</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Sua base de estudo</h2>
                        </div>
                        <p className="text-sm text-zinc-500">{learnerPrograms.length} programas com progresso salvo</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {learnerPrograms.map((program) => (
                            <Link
                                key={program.programId}
                                href={`/learn/programs/${program.programId}`}
                                className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 transition hover:border-sky-500/40"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{program.subjectArea}</p>
                                        <h3 className="mt-3 text-2xl font-black tracking-tight">{program.title}</h3>
                                    </div>
                                    <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {program.monetizationType}
                                    </span>
                                </div>

                                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{program.shortDescription}</p>

                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Prontidao</p>
                                        <p className="mt-2 text-xl font-black">{program.readinessScore}%</p>
                                    </div>
                                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Acuracia</p>
                                        <p className="mt-2 text-xl font-black">{program.accuracy}%</p>
                                    </div>
                                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Topicos</p>
                                        <p className="mt-2 text-xl font-black">{program.topicCount}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                    <span>
                                        {program.latestSessionAt
                                            ? `Ultima sessao ${program.latestSessionAt.toLocaleDateString('pt-BR')}`
                                            : 'Sem sessao ainda'}
                                    </span>
                                    <span>{program.avgRating ? `${program.avgRating}/5` : 'Sem nota'}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {recommendedPrograms.length > 0 ? (
                    <section className="space-y-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Expandir repertorio</p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Outros programas que podem combinar com voce</h2>
                            </div>
                            <Link href="/programs" className="text-sm font-bold text-zinc-300">
                                Explorar mais
                            </Link>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            {recommendedPrograms.map((program) => (
                                <Link
                                    key={program.id}
                                    href={`/programs/${program.slug}`}
                                    className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 transition hover:border-sky-500/40"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{program.subjectArea}</p>
                                            <h3 className="mt-3 text-2xl font-black tracking-tight">{program.title}</h3>
                                        </div>
                                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            {program.examType || 'Livre'}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{program.shortDescription}</p>

                                    <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                        <span>{program.creatorDisplayName || 'Criador Cognira'}</span>
                                        <span>{program.avgRating ? `${program.avgRating}/5` : 'Sem nota'}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </main>
=======
import React from 'react';
import Link from 'next/link';

export default function Dashboard() {
    return (
        <div className="px-4 py-8 md:py-12">
            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-black/5 border border-slate-100 p-5 md:p-8 flex flex-col text-slate-900 relative">

                    {/* Subtle background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-32 bg-gradient-to-b from-slate-50 to-transparent -z-10 blur-xl opacity-60"></div>

                    {/* Header */}
                    <div className="mb-6 md:mb-8 text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-1 md:mb-2">
                            Áreas Prioritárias
                        </h1>
                        <p className="text-[0.85rem] md:text-[0.9rem] font-medium text-slate-500 leading-relaxed max-w-[90%] mx-auto md:mx-0">
                            O sistema organiza seus tópicos por estabilidade cognitiva.
                        </p>
                    </div>

                    {/* Content Grid container: 1 col on mobile, 3 cols on desktop */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">

                        {/* Seção 1 — Críticos */}
                        <section className="bg-red-50/60 rounded-3xl p-4 md:p-5 border border-red-100/60 flex flex-col">
                            <header className="mb-4">
                                <h2 className="text-base font-bold text-red-800 tracking-tight flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    Críticos
                                </h2>
                                <p className="text-[0.75rem] font-semibold text-red-600/80 mt-1 leading-snug">
                                    Alto risco de erro sob pressão. Recomendado revisar.
                                </p>
                            </header>
                            <ul className="space-y-2 mt-auto">
                                <li className="bg-white/80 backdrop-blur-sm px-3.5 py-2.5 md:py-3 rounded-2xl text-[0.85rem] font-bold text-slate-800 shadow-sm shadow-red-900/5 border border-red-50 flex items-center justify-between">
                                    IAM
                                </li>
                                <li className="bg-white/80 backdrop-blur-sm px-3.5 py-2.5 md:py-3 rounded-2xl text-[0.85rem] font-bold text-slate-800 shadow-sm shadow-red-900/5 border border-red-50 flex items-center justify-between">
                                    Modelos de Precificação
                                </li>
                            </ul>
                        </section>

                        {/* Seção 2 — Instáveis */}
                        <section className="bg-amber-50/60 rounded-3xl p-4 md:p-5 border border-amber-100/60 flex flex-col">
                            <header className="mb-4">
                                <h2 className="text-base font-bold text-amber-800 tracking-tight flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                                    Instáveis
                                </h2>
                                <p className="text-[0.75rem] font-semibold text-amber-700/80 mt-1 leading-snug">
                                    Oscilações recentes de desempenho.
                                </p>
                            </header>
                            <ul className="space-y-2 mt-auto">
                                <li className="bg-white/80 backdrop-blur-sm px-3.5 py-2.5 md:py-3 rounded-2xl text-[0.85rem] font-bold text-slate-800 shadow-sm shadow-amber-900/5 border border-amber-50 flex items-center">
                                    EC2
                                </li>
                                <li className="bg-white/80 backdrop-blur-sm px-3.5 py-2.5 md:py-3 rounded-2xl text-[0.85rem] font-bold text-slate-800 shadow-sm shadow-amber-900/5 border border-amber-50 flex items-center">
                                    S3
                                </li>
                            </ul>
                        </section>

                        {/* Seção 3 — Sólidos */}
                        <section className="bg-emerald-50/60 rounded-3xl p-4 md:p-5 border border-emerald-100/60 flex flex-col">
                            <header className="mb-4">
                                <h2 className="text-base font-bold text-emerald-800 tracking-tight flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    Sólidos
                                </h2>
                                <p className="text-[0.75rem] font-semibold text-emerald-700/80 mt-1 leading-snug">
                                    Desempenho consistente garantido.
                                </p>
                            </header>
                            <ul className="space-y-2 mt-auto">
                                <li className="bg-white/80 backdrop-blur-sm px-3.5 py-2.5 md:py-3 rounded-2xl text-[0.85rem] font-bold text-slate-800 shadow-sm shadow-emerald-900/5 border border-emerald-50 flex items-center">
                                    VPC
                                </li>
                                <li className="bg-white/80 backdrop-blur-sm px-3.5 py-2.5 md:py-3 rounded-2xl text-[0.85rem] font-bold text-slate-800 shadow-sm shadow-emerald-900/5 border border-emerald-50 flex items-center">
                                    RDS
                                </li>
                            </ul>
                        </section>

                    </div>

                    {/* Footer / CTA */}
                    <div className="mt-auto">
                        <Link
                            href="/session"
                            className="flex items-center justify-center w-full md:w-1/2 md:mx-auto bg-slate-900 text-white font-bold text-[1rem] py-4 rounded-2xl shadow-[0_8px_20px_rgba(15,23,42,0.2)] hover:bg-slate-800 hover:shadow-[0_12px_25px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 ease-out"
                        >
                            Iniciar Sessão Focada
                        </Link>
                    </div>

                </div>
            </div>
        </div>
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
    );
}
