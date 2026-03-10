<<<<<<< HEAD
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getProgramProgress } from '@/lib/program-storage';
import { getUserProgress } from '@/lib/storage';
import { TOPICS } from '@/lib/topics';
import { MacroDomain, TopicProgress, UserProgress } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
    STRONG: 'Forte',
    EVOLVING: 'Em evolucao',
    WEAK: 'Fraco',
    NOT_EVALUATED: 'Pendente',
};

const STATUS_COLORS: Record<string, string> = {
    STRONG: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    EVOLVING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    WEAK: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    NOT_EVALUATED: 'bg-zinc-800 text-zinc-500 border-zinc-700/30',
};

const MACRO_INFO: Record<MacroDomain, { label: string; id: string }> = {
    D1_CLOUD_CONCEPTS: { label: 'D1 - Conceitos de Nuvem', id: 'D1_CLOUD_CONCEPTS' },
    D2_SECURITY_COMPLIANCE: { label: 'D2 - Seguranca e Conformidade', id: 'D2_SECURITY_COMPLIANCE' },
    D3_TECHNOLOGY_SERVICES: { label: 'D3 - Tecnologia e Servicos em Nuvem', id: 'D3_TECHNOLOGY_SERVICES' },
    D4_BILLING_SUPPORT: { label: 'D4 - Cobranca, Preco e Suporte', id: 'D4_BILLING_SUPPORT' },
=======
// app/results/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserProgress } from '@/lib/storage';
import { TOPICS } from '@/lib/topics';
import { UserProgress, Topic, MacroDomain } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
    'STRONG': 'Forte',
    'EVOLVING': 'Em evolução',
    'WEAK': 'Fraco',
    'NOT_EVALUATED': 'Pendente'
};

const STATUS_COLORS: Record<string, string> = {
    'STRONG': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'EVOLVING': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'WEAK': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'NOT_EVALUATED': 'bg-zinc-800 text-zinc-500 border-zinc-700/30'
};

const MACRO_INFO: Record<MacroDomain, { label: string; id: string }> = {
    'D1_CLOUD_CONCEPTS': { label: 'D1 — Conceitos de Nuvem', id: 'D1_CLOUD_CONCEPTS' },
    'D2_SECURITY_COMPLIANCE': { label: 'D2 — Segurança e Conformidade', id: 'D2_SECURITY_COMPLIANCE' },
    'D3_TECHNOLOGY_SERVICES': { label: 'D3 — Tecnologia e Serviços em Nuvem', id: 'D3_TECHNOLOGY_SERVICES' },
    'D4_BILLING_SUPPORT': { label: 'D4 — Cobrança, Preço e Suporte', id: 'D4_BILLING_SUPPORT' }
};

const D3_SUBGROUPS: Record<string, string> = {
    'EC2': 'Compute',
    'LAMBDA': 'Compute',
    'S3': 'Storage',
    'EBS': 'Storage',
    'EFS': 'Storage',
    'RDS': 'Database',
    'DYNAMODB': 'Database',
    'VPC': 'Networking'
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
};

function ResultsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
<<<<<<< HEAD
    const correctCount = Number(searchParams.get('correct') || '0');
    const incorrectCount = Number(searchParams.get('incorrect') || '0');
    const programId = searchParams.get('programId');
    const programTitle = searchParams.get('programTitle');

    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [programTopics, setProgramTopics] = useState<Array<{ id: string; title: string; examWeight?: string | null }> | null>(null);

    useEffect(() => {
        setProgress(programId ? getProgramProgress(programId) : getUserProgress());
    }, [programId]);

    useEffect(() => {
        async function loadProgramTopics() {
            if (!programId) {
                setProgramTopics(null);
                return;
            }

            try {
                const response = await fetch(`/api/programs/${programId}/topics`);
                const data = await response.json() as { topics?: Array<{ id: string; title: string; examWeight?: string | null }> };
                setProgramTopics(data.topics || []);
            } catch (error) {
                console.error('Erro ao carregar topicos do programa:', error);
                setProgramTopics([]);
            }
        }

        loadProgramTopics();
    }, [programId]);

    const topicEntries = useMemo(() => {
        if (!progress) return [];
        return Object.values(progress.topics || {}) as TopicProgress[];
    }, [progress]);

    const weakTopics = topicEntries.filter((topic) => topic.status === 'WEAK');
    const evolvingTopics = topicEntries.filter((topic) => topic.status === 'EVOLVING');
    const pendingTopics = topicEntries.filter((topic) => topic.status === 'NOT_EVALUATED');
    const topicLabelMap = new Map((programTopics || []).map((topic) => [topic.id, topic.title]));
    const weakestNamedTopics = [...weakTopics]
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
        .map((topic) => ({
            ...topic,
            label: topicLabelMap.get(topic.topicId) || topic.topicId,
        }));
    const recommendedTopic = weakestNamedTopics[0]
        || [...evolvingTopics]
            .sort((a, b) => a.accuracy - b.accuracy)
            .map((topic) => ({
                ...topic,
                label: topicLabelMap.get(topic.topicId) || topic.topicId,
            }))[0]
        || null;
=======
    const correctCount = searchParams.get('correct') || '0';
    const incorrectCount = searchParams.get('incorrect') || '0';

    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        setProgress(getUserProgress());
    }, []);
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2

    if (!progress) return null;

    const getRecommendation = () => {
<<<<<<< HEAD
        if (programId) {
            if (weakTopics.length > 0) {
                return `Voce terminou a sessao, mas ainda ha ${weakTopics.length} topicos frageis neste programa. Retome o estudo enquanto o contexto ainda esta fresco.`;
            }
            if (evolvingTopics.length > 0) {
                return `Boa sessao. Ha ${evolvingTopics.length} topicos em evolucao; uma nova rodada de pratica tende a consolidar melhor a memorizacao.`;
            }
            return 'O programa ficou mais consistente depois desta sessao. Continue praticando para manter a prontidao alta.';
        }

        if (weakTopics.length > 0) return 'Priorize os topicos marcados como Fraco para melhorar sua prontidao.';
        if (evolvingTopics.length > 0) return 'Seu desempenho esta em evolucao. Continue reforcando esses topicos para consolidar o aprendizado.';
        if (pendingTopics.length > (TOPICS.length / 2)) return 'Avalie os topicos pendentes para obter um diagnostico mais preciso do seu conhecimento.';
        return 'Seu progresso esta consistente. Continue praticando para manter sua prontidao em alto nivel.';
    };

    if (programId) {
        return (
            <div className="mx-auto flex min-h-[90vh] w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
                <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">Analise da sessao</p>
                        <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                            {programTitle || 'Programa Cognira'}
                        </h1>
                        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                            {getRecommendation()}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Acertos</p>
                            <p className="mt-3 text-4xl font-black text-emerald-400">{correctCount}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Erros</p>
                            <p className="mt-3 text-4xl font-black text-rose-400">{incorrectCount}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Prontidao</p>
                            <p className="mt-3 text-4xl font-black text-white">{progress.readinessScore}%</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Foco imediato</p>
                            <p className="mt-3 text-lg font-black text-white">
                                {weakTopics.length > 0 ? `${weakTopics.length} topicos frageis` : 'Retencao em boa forma'}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topicos frageis</p>
                        <p className="mt-3 text-3xl font-black">{weakTopics.length}</p>
                        <p className="mt-2 text-sm text-zinc-400">Merecem reforco antes da proxima pausa longa.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Em evolucao</p>
                        <p className="mt-3 text-3xl font-black">{evolvingTopics.length}</p>
                        <p className="mt-2 text-sm text-zinc-400">Ja responderam bem, mas ainda podem consolidar melhor.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/60 p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Pendentes</p>
                        <p className="mt-3 text-3xl font-black">{pendingTopics.length}</p>
                        <p className="mt-2 text-sm text-zinc-400">Ainda sem base suficiente para avaliacao real.</p>
                    </div>
                </section>

                {weakestNamedTopics.length > 0 ? (
                    <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Topicos para revisar agora</p>
                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            {weakestNamedTopics.map((topic) => (
                                <div key={topic.topicId} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-5">
                                    <p className="text-lg font-black text-white">{topic.label}</p>
                                    <p className="mt-2 text-sm text-zinc-400">
                                        Acuracia atual de {topic.accuracy}% e sinal de fragilidade neste momento.
                                    </p>
                                    <button
                                        onClick={() => router.push(`/session?programId=${programId}&mode=topic&target=${topic.topicId}`)}
                                        className="mt-4 rounded-2xl border border-zinc-700 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-200"
                                    >
                                        Revisar este topico
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}

                <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Proximo passo sugerido</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                                {weakTopics.length > 0 ? 'Continue o programa para reforcar os pontos mais frageis.' : 'Mantenha o ritmo com uma nova sessao curta.'}
                            </h2>
                            {recommendedTopic ? (
                                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                                    Melhor retomada agora: <strong className="text-zinc-100">{recommendedTopic.label}</strong>.
                                </p>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {recommendedTopic ? (
                                <button
                                    onClick={() => router.push(`/session?programId=${programId}&mode=topic&target=${recommendedTopic.topicId}`)}
                                    className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-black"
                                >
                                    Revisar topico priorizado
                                </button>
                            ) : null}
                            <button
                                onClick={() => router.push(`/learn/programs/${programId}`)}
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Voltar ao programa
                            </button>
                            <button
                                onClick={() => router.push(`/session?programId=${programId}&mode=smart`)}
                                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-200"
                            >
                                Nova sessao
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    const macroKeys: MacroDomain[] = [
        'D1_CLOUD_CONCEPTS',
        'D2_SECURITY_COMPLIANCE',
        'D3_TECHNOLOGY_SERVICES',
        'D4_BILLING_SUPPORT',
=======
        const topics = Object.values(progress.topics);
        const hasWeak = topics.some(t => t.status === 'WEAK');
        const hasEvolving = topics.some(t => t.status === 'EVOLVING');
        const pendingCount = topics.filter(t => t.status === 'NOT_EVALUATED').length;

        if (hasWeak) return "Priorize os tópicos marcados como Fraco para melhorar sua prontidão.";
        if (hasEvolving) return "Seu desempenho está em evolução! Continue reforçando esses tópicos para consolidar o aprendizado.";
        if (pendingCount > (TOPICS.length / 2)) return "Avalie os tópicos pendentes para obter um diagnóstico mais preciso do seu conhecimento.";

        return "Seu progresso está consistente. Continue praticando para manter sua prontidão em alto nível.";
    };

    const macroKeys: MacroDomain[] = [
        "D1_CLOUD_CONCEPTS",
        "D2_SECURITY_COMPLIANCE",
        "D3_TECHNOLOGY_SERVICES",
        "D4_BILLING_SUPPORT"
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
    ];

    return (
        <div className="flex flex-col space-y-10 max-w-md mx-auto pt-10 pb-40 px-6">
            <h1 className="text-[2rem] font-bold tracking-tight text-white leading-tight">
<<<<<<< HEAD
                Analise da Sessao
            </h1>

=======
                Análise da Sessão
            </h1>

            {/* Performance Summary - Task 6 */}
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            <div className="grid grid-cols-2 gap-4">
                <div className="primary-card p-5 border-l-4 border-emerald-500">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Acertos</span>
                    <span className="text-2xl font-black text-emerald-400">{correctCount}</span>
                </div>
                <div className="primary-card p-5 border-l-4 border-rose-500">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Erros</span>
                    <span className="text-2xl font-black text-rose-400">{incorrectCount}</span>
                </div>
            </div>

<<<<<<< HEAD
            <div className="primary-card p-7 space-y-6">
                <div className="flex flex-col space-y-2">
                    <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Prontidao Atual</span>
=======
            {/* Hero Card */}
            <div className="primary-card p-7 space-y-6">
                <div className="flex flex-col space-y-2">
                    <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Prontidão Atual</span>
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                    <div className="text-[2.5rem] font-black text-white leading-none">
                        {progress.readinessScore}%
                    </div>
                </div>

                <div className="h-4 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/30">
                    <div
                        className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${progress.readinessScore}%` }}
                    />
                </div>

                <p className="text-zinc-300 text-[0.95rem] leading-relaxed font-medium">
                    {getRecommendation()}
                </p>
            </div>

<<<<<<< HEAD
=======
            {/* Impact por Granularidade */}
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            <section className="space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Impacto por Granularidade</h2>
                </div>

                <div className="space-y-12">
                    {macroKeys.map((mKey) => {
                        const domainInfo = MACRO_INFO[mKey];
<<<<<<< HEAD
                        const domainTopics = TOPICS.filter((t) => t.macroDomain === mKey);
=======
                        const domainTopics = TOPICS.filter(t => t.macroDomain === mKey);

                        const domainProgress = domainTopics.map(t => progress.topics[t.id]);
                        const hasWeakInDomain = domainProgress.some(p => p?.status === 'WEAK');
                        const macroData = progress.macroTopics?.[mKey];
                        const domainAccuracy = macroData?.accuracy || 0;
                        const showFoco = hasWeakInDomain || domainAccuracy < 70;

                        const groups = mKey === 'D3_TECHNOLOGY_SERVICES'
                            ? Array.from(new Set(Object.values(D3_SUBGROUPS)))
                            : [null];
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2

                        return (
                            <div key={mKey} className="space-y-6">
                                <div
                                    onClick={() => router.push(`/session?mode=domain&target=${mKey}`)}
                                    className="flex items-center justify-between cursor-pointer group border-l-4 border-blue-500/50 pl-4 py-1"
                                >
                                    <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest group-hover:text-blue-300 transition-colors">
                                        {domainInfo.label}
                                    </h3>
<<<<<<< HEAD
                                </div>

                                <div className="space-y-3">
                                    {domainTopics.map((topic) => {
                                        const prog = progress.topics[topic.id];
                                        const status = prog?.status || 'NOT_EVALUATED';
                                        const colorClass = STATUS_COLORS[status];
                                        const label = STATUS_LABELS[status];

                                        return (
                                            <div
                                                key={topic.id}
                                                onClick={() => router.push(`/session?mode=topic&target=${topic.id}`)}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all cursor-pointer group"
                                            >
                                                <div className="flex flex-col space-y-1">
                                                    <span className={`text-[0.95rem] font-bold transition-colors ${status === 'NOT_EVALUATED' ? 'text-zinc-500' : 'text-zinc-200 group-hover:text-white'}`}>
                                                        {topic.label}
                                                    </span>
                                                    {prog && prog.attempts > 0 ? (
                                                        <span className="text-[10px] font-bold text-zinc-600 uppercase">
                                                            Acuracia: {prog.accuracy}% - {prog.attempts} sessoes
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-zinc-700 uppercase">Pendente</span>
                                                    )}
                                                </div>

                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black border tracking-tight ${colorClass}`}>
                                                    {label.toUpperCase()}
=======
                                    <span className="text-[10px] text-zinc-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {showFoco ? 'FOCO →' : 'EXPLORAR →'}
                                    </span>
                                </div>

                                <div className="space-y-8">
                                    {groups.map((groupName, gIdx) => {
                                        const topicsInGroup = groupName
                                            ? domainTopics.filter(t => D3_SUBGROUPS[t.id] === groupName)
                                            : domainTopics;

                                        return (
                                            <div key={groupName || gIdx} className="space-y-4">
                                                {groupName && (
                                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                                                        {groupName}
                                                    </h4>
                                                )}
                                                <div className="space-y-3">
                                                    {topicsInGroup.map((topic) => {
                                                        const prog = progress.topics[topic.id];
                                                        const status = prog?.status || 'NOT_EVALUATED';
                                                        const colorClass = STATUS_COLORS[status];
                                                        const label = STATUS_LABELS[status];

                                                        return (
                                                            <div
                                                                key={topic.id}
                                                                onClick={() => router.push(`/session?mode=topic&target=${topic.id}`)}
                                                                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all cursor-pointer group"
                                                            >
                                                                <div className="flex flex-col space-y-1">
                                                                    <span className={`text-[0.95rem] font-bold transition-colors ${status === 'NOT_EVALUATED' ? 'text-zinc-500' : 'text-zinc-200 group-hover:text-white'}`}>
                                                                        {topic.label}
                                                                    </span>
                                                                    {prog && prog.attempts > 0 ? (
                                                                        <span className="text-[10px] font-bold text-zinc-600 uppercase">
                                                                            Acurácia: {prog.accuracy}% • {prog.attempts} sessões
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold text-zinc-700 uppercase">Pendente</span>
                                                                    )}
                                                                </div>

                                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black border tracking-tight ${colorClass}`}>
                                                                    {label.toUpperCase()}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

<<<<<<< HEAD
=======
            {/* Final CTA */}
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center justify-center w-full bg-white text-black font-black h-[4.5rem] rounded-full shadow-2xl active:scale-[0.97] transition-all text-lg"
                    >
<<<<<<< HEAD
                        Concluir Analise
                    </button>
=======
                        Concluir Análise
                    </button>
                    <p className="text-center text-[10px] text-zinc-600 mt-4 font-bold uppercase tracking-widest">
                        Dados persistidos localmente
                    </p>
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                </div>
            </div>
        </div>
    );
}

export default function ResultsPage() {
    return (
<<<<<<< HEAD
        <Suspense fallback={<div className="text-center p-20 text-slate-400">Carregando analise...</div>}>
=======
        <Suspense fallback={<div className="text-center p-20 text-slate-400">Carregando análise...</div>}>
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            <ResultsContent />
        </Suspense>
    );
}
