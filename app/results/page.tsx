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
};

function ResultsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const correctCount = searchParams.get('correct') || '0';
    const incorrectCount = searchParams.get('incorrect') || '0';

    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        setProgress(getUserProgress());
    }, []);

    if (!progress) return null;

    const getRecommendation = () => {
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
    ];

    return (
        <div className="flex flex-col space-y-10 max-w-md mx-auto pt-10 pb-40 px-6">
            <h1 className="text-[2rem] font-bold tracking-tight text-white leading-tight">
                Análise da Sessão
            </h1>

            {/* Performance Summary - Task 6 */}
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

            {/* Hero Card */}
            <div className="primary-card p-7 space-y-6">
                <div className="flex flex-col space-y-2">
                    <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Prontidão Atual</span>
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

            {/* Impact por Granularidade */}
            <section className="space-y-8">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Impacto por Granularidade</h2>
                </div>

                <div className="space-y-12">
                    {macroKeys.map((mKey) => {
                        const domainInfo = MACRO_INFO[mKey];
                        const domainTopics = TOPICS.filter(t => t.macroDomain === mKey);

                        const domainProgress = domainTopics.map(t => progress.topics[t.id]);
                        const hasWeakInDomain = domainProgress.some(p => p?.status === 'WEAK');
                        const macroData = progress.macroTopics?.[mKey];
                        const domainAccuracy = macroData?.accuracy || 0;
                        const showFoco = hasWeakInDomain || domainAccuracy < 70;

                        const groups = mKey === 'D3_TECHNOLOGY_SERVICES'
                            ? Array.from(new Set(Object.values(D3_SUBGROUPS)))
                            : [null];

                        return (
                            <div key={mKey} className="space-y-6">
                                <div
                                    onClick={() => router.push(`/session?mode=domain&target=${mKey}`)}
                                    className="flex items-center justify-between cursor-pointer group border-l-4 border-blue-500/50 pl-4 py-1"
                                >
                                    <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest group-hover:text-blue-300 transition-colors">
                                        {domainInfo.label}
                                    </h3>
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

            {/* Final CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center justify-center w-full bg-white text-black font-black h-[4.5rem] rounded-full shadow-2xl active:scale-[0.97] transition-all text-lg"
                    >
                        Concluir Análise
                    </button>
                    <p className="text-center text-[10px] text-zinc-600 mt-4 font-bold uppercase tracking-widest">
                        Dados persistidos localmente
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="text-center p-20 text-slate-400">Carregando análise...</div>}>
            <ResultsContent />
        </Suspense>
    );
}
