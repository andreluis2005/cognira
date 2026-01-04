// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TOPICS } from '@/lib/topics';
import { getUserProgress } from '@/lib/storage';
import { UserProgress, Topic, MacroDomain } from '@/lib/types';

const MACRO_LABELS: Record<string, string> = {
    'D1_CLOUD_CONCEPTS': 'D1 — Conceitos de Nuvem',
    'D2_SECURITY_COMPLIANCE': 'D2 — Segurança e Conformidade',
    'D3_TECHNOLOGY_SERVICES': 'D3 — Tecnologia e Serviços em Nuvem',
    'D4_BILLING_SUPPORT': 'D4 — Cobrança, Preço e Suporte'
};

const STATUS_MAP: Record<string, string> = {
    'NOT_EVALUATED': 'Pendente',
    'WEAK': 'Fraco',
    'EVOLVING': 'Em evolução',
    'STRONG': 'Forte'
};

const STATUS_COLORS: Record<string, string> = {
    'NOT_EVALUATED': 'bg-zinc-800 text-zinc-500 border-zinc-700/30',
    'WEAK': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    'EVOLVING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'STRONG': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
};

// Hierarquia completa para a Task 5
const DASHBOARD_HIERARCHY = [
    {
        id: 'D1_CLOUD_CONCEPTS',
        label: 'D1 — Conceitos de Nuvem',
        groups: [
            { name: 'Essenciais', topics: ['CLOUD_BENEFITS', 'SHARED_RESPONSIBILITY', 'WELL_ARCHITECTED'] },
            { name: 'Infraestrutura', topics: [{ label: 'Infraestrutura Global AWS', id: 'STATIC_GLOBAL' }, { label: 'Modelos de Implantação', id: 'STATIC_DEPLOYMENT' }] }
        ]
    },
    {
        id: 'D2_SECURITY_COMPLIANCE',
        label: 'D2 — Segurança e Conformidade',
        groups: [
            { name: 'Identidade e Acesso', topics: ['IAM', 'MFA'] },
            { name: 'Segurança de Rede e Dados', topics: ['SECURITY_GROUPS', { label: 'Criptografia (Repouso/Trânsito)', id: 'STATIC_ENCRYPT' }] }
        ]
    },
    {
        id: 'D3_TECHNOLOGY_SERVICES',
        label: 'D3 — Tecnologia e Serviços em Nuvem',
        groups: [
            { name: 'Compute', topics: ['EC2', 'LAMBDA', { label: 'ECS / EKS / Fargate', id: 'STATIC_CONTAINERS' }, { label: 'Lightsail / Beanstalk', id: 'STATIC_COMP_OTH' }] },
            { name: 'Storage', topics: ['S3', 'EBS', 'EFS', { label: 'AWS Glacier', id: 'STATIC_GLACIER' }] },
            { name: 'Database', topics: ['RDS', 'DYNAMODB', { label: 'Amazon Redshift', id: 'STATIC_REDSHIFT' }] },
            { name: 'Networking', topics: ['VPC', { label: 'Route 53', id: 'STATIC_R53' }, { label: 'Load Balancing', id: 'STATIC_ELB' }] },
            { name: 'Management & Monitoring', topics: [{ label: 'CloudWatch / CloudTrail', id: 'STATIC_OBS' }, { label: 'Trusted Advisor', id: 'STATIC_ADVISOR' }] }
        ]
    },
    {
        id: 'D4_BILLING_SUPPORT',
        label: 'D4 — Cobrança, Preço e Suporte',
        groups: [
            { name: 'Gestão Financeira', topics: ['PRICING_MODELS', 'BILLING_TOOLS'] },
            { name: 'Suporte e Organização', topics: ['SUPPORT_PLANS', { label: 'AWS Organizations', id: 'STATIC_ORG' }] }
        ]
    }
];

export default function Dashboard() {
    const router = useRouter();
    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        setProgress(getUserProgress());
    }, []);

    if (!progress) return null;

    const getOverallStatus = (score: number) => {
        if (score < 50) return { label: 'Em risco', icon: '⚠️' };
        if (score < 80) return { label: 'Em evolução', icon: '⚡' };
        return { label: 'Pronto', icon: '✅' };
    };

    const overallStatus = getOverallStatus(progress.readinessScore);

    const macroDomains = Object.entries(progress.macroTopics || {}).map(([key, data]) => ({
        id: key,
        name: MACRO_LABELS[key] || key,
        percentage: data.accuracy,
        isEvaluated: data.attempts > 0,
        status: data.status
    }));

    const weakAreas = Object.entries(progress.topics || {})
        .map(([id, data]) => {
            const topicInfo = TOPICS.find(t => t.id === id);
            return {
                name: topicInfo?.label || id,
                accuracy: data.accuracy,
                percentage: data.accuracy,
                attempts: data.attempts,
                isEvaluated: data.attempts > 0,
                status: data.status
            };
        })
        .filter(a => a.isEvaluated && a.status === 'WEAK')
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3);

    return (
        <div className="flex flex-col space-y-9 max-w-md mx-auto pt-7 pb-44 px-7">
            {/* Header */}
            <header className="flex justify-between items-center h-12">
                <button className="w-[3.25rem] h-[3.25rem] flex items-center justify-center primary-card !rounded-2xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400/80"><path d="M4 8h16M4 16h16" /></svg>
                </button>
                <h1 className="text-[1.15rem] font-bold tracking-tight text-white/95">MemorizaCloud</h1>
                <button className="w-[3.25rem] h-[3.25rem] flex items-center justify-center primary-card !rounded-2xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400/80"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                </button>
            </header>

            {/* Hero Status */}
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="flex items-center space-x-3.5 text-[1.95rem] font-black text-white tracking-tight">
                    <span className="text-[#FFD60A] drop-shadow-sm">{overallStatus.icon}</span>
                    <span>{overallStatus.label}</span>
                </div>
                <div className="text-zinc-500 text-[1rem] font-medium tracking-wide">
                    Prontidão para o Exame: {progress.readinessScore}%
                </div>
                <div className="w-full h-4.5 secondary-bar rounded-full overflow-hidden mt-4">
                    <div
                        className="h-full bg-[#5EADF7] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(94,173,247,0.4)]"
                        style={{ width: `${progress.readinessScore}%` }}
                    />
                </div>
            </div>

            {/* Macro Domains Progress */}
            <div className="grid grid-cols-2 gap-4">
                {macroDomains.map(domain => (
                    <div
                        key={domain.name}
                        onClick={() => router.push(`/session?mode=domain&target=${domain.id}`)}
                        className="primary-card p-4 space-y-3 cursor-pointer active:scale-95 transition-transform"
                    >
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter leading-tight block h-8 overflow-hidden">
                            {domain.name}
                        </span>
                        <div className="flex items-end justify-between">
                            <span className={`text-xl font-black ${domain.isEvaluated ? 'text-white' : 'text-zinc-600'}`}>
                                {domain.isEvaluated ? `${domain.percentage}%` : '---'}
                            </span>
                            {!domain.isEvaluated && <span className="text-[9px] text-zinc-600 font-bold mb-1 uppercase">Pendente</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Prioridades de Reforço */}
            {weakAreas.length > 0 && (
                <section className="primary-card p-7 space-y-7 border-l-4 border-rose-500/50">
                    <h3 className="text-[1.1rem] font-bold text-white/95">Prioridades de Reforço</h3>
                    <div className="space-y-8">
                        {weakAreas.map((area) => (
                            <div key={area.name} className="space-y-3.5">
                                <div className="flex justify-between items-center text-[0.98rem] font-bold">
                                    <div className="flex items-center space-x-3.5 text-rose-400">
                                        <span>{area.name}</span>
                                    </div>
                                    <span className="text-zinc-500/80 font-bold">{area.percentage}%</span>
                                </div>
                                <div className="h-2 w-full secondary-bar rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 transition-all duration-700"
                                        style={{ width: `${area.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Escopo da Certificação Hierárquico - Task 5 */}
            <section className="space-y-12">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <h3 className="text-[1.1rem] font-bold text-white/95 uppercase tracking-tight">Escopo da Certificação</h3>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{TOPICS.length} TÓPICOS ATIVOS</span>
                </div>

                <div className="space-y-12">
                    {DASHBOARD_HIERARCHY.map(domain => (
                        <div key={domain.id} className="space-y-6">
                            <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.1em] border-l-2 border-blue-500/50 pl-3">
                                {domain.label}
                            </h4>

                            <div className="space-y-8">
                                {domain.groups.map((group) => (
                                    <div key={group.name} className="space-y-4 ml-3">
                                        <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                            {group.name}
                                        </h5>
                                        <div className="space-y-3">
                                            {group.topics.map(tData => {
                                                const isStatic = typeof tData === 'object';
                                                const tId = isStatic ? tData.id : tData;
                                                const topic = TOPICS.find(t => t.id === tId);

                                                const prog = topic ? progress.topics[topic.id] : null;
                                                const status = prog?.status || 'NOT_EVALUATED';
                                                const colorClass = STATUS_COLORS[status];
                                                const label = topic ? topic.label : (isStatic ? (tData as any).label : tId);

                                                return (
                                                    <div
                                                        key={tId}
                                                        onClick={() => topic && router.push(`/session?mode=topic&target=${topic.id}`)}
                                                        className={`flex items-center justify-between p-4 rounded-xl transition-all ${topic ? 'bg-zinc-900/40 border border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer group active:scale-[0.98]' : 'bg-transparent border border-zinc-800/20 opacity-60'}`}
                                                    >
                                                        <span className={`text-sm font-bold ${topic ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-600'}`}>
                                                            {label}
                                                        </span>
                                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter border ${colorClass}`}>
                                                            {STATUS_MAP[status].toUpperCase()}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Floating CTA */}
            <div className="fixed bottom-11 left-0 right-0 px-8 max-w-md mx-auto z-50">
                <Link
                    href="/session?mode=smart"
                    className="flex items-center justify-center space-x-4 w-full bg-[#97D2FB] text-[#0A0A0B] font-black h-[4.5rem] rounded-full shadow-[0_12px_44px_-8px_rgba(94,173,247,0.25)] active:scale-[0.97] transition-all text-[1.15rem]"
                >
                    <span>Treinar agora (SMART)</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="mt-0.5"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
                </Link>
            </div>
        </div>
    );
}
