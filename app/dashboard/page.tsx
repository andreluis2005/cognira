'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserProgress } from '@/lib/storage';
import { UserProgress } from '@/lib/types';

export default function Dashboard() {
    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        setProgress(getUserProgress());
    }, []);

    if (!progress) return null;

    const getStatus = (score: number) => {
        if (score < 50) return { label: 'Em risco', icon: '⚠️' };
        if (score < 80) return { label: 'Evoluindo', icon: '⚡' };
        return { label: 'Pronto', icon: '✅' };
    };

    const status = getStatus(progress.readinessScore || 40);
    const weakAreas = [
        { name: 'IAM', percentage: 25 },
        { name: 'EC2', percentage: 50 },
        { name: 'Billing', percentage: 60 }
    ];

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
                    <span className="text-[#FFD60A] drop-shadow-sm">{status.icon}</span>
                    <span>{status.label}</span>
                </div>
                <div className="text-zinc-500 text-[1rem] font-medium tracking-wide">
                    Progresso geral: {progress.readinessScore || 40}%
                </div>
                <div className="w-full h-4.5 secondary-bar rounded-full overflow-hidden mt-4">
                    <div
                        className="h-full bg-[#5EADF7] transition-all duration-1000 ease-out"
                        style={{ width: `${progress.readinessScore || 40}%` }}
                    />
                </div>
            </div>

            {/* Pontos fracos */}
            <section className="primary-card p-7 space-y-7">
                <h3 className="text-[1.1rem] font-bold text-white/95">Pontos fracos</h3>
                <div className="space-y-8">
                    {weakAreas.map((area) => (
                        <div key={area.name} className="space-y-3.5">
                            <div className="flex justify-between items-center text-[0.98rem] font-bold">
                                <div className="flex items-center space-x-3.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFD60A]" />
                                    <span className="text-zinc-200/90">{area.name}</span>
                                </div>
                                <span className="text-zinc-500/80 font-bold">{area.percentage}%</span>
                            </div>
                            <div className="h-2 w-full secondary-bar rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#5EADF7] transition-all duration-700"
                                    style={{ width: `${area.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sessão anterior */}
            <section className="primary-card p-7 space-y-7">
                <h3 className="text-[1.1rem] font-bold text-white/95 leading-none">Sessão anterior:</h3>
                <div className="space-y-8">
                    <div className="space-y-3.5">
                        <div className="flex items-center space-x-3.5 text-[1rem] font-bold text-zinc-100/95">
                            <span className="text-[#FFD60A] text-[1.15rem] leading-none">✓</span>
                            <span>S3 melhorou</span>
                        </div>
                        <div className="h-2 w-full secondary-bar rounded-full overflow-hidden">
                            <div className="h-full bg-[#5EADF7]/35 w-[45%]" />
                        </div>
                    </div>
                    <div className="space-y-3.5">
                        <div className="flex items-center space-x-3.5 text-[1rem] font-bold text-zinc-100/95">
                            <span className="text-[#FF453A] text-[1.15rem] leading-none">✗</span>
                            <span>EC2 ainda crítico</span>
                        </div>
                        <div className="h-2 w-full secondary-bar rounded-full overflow-hidden">
                            <div className="h-full bg-[#5EADF7] w-[35%]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Floating CTA */}
            <div className="fixed bottom-11 left-0 right-0 px-8 max-w-md mx-auto z-50">
                <Link
                    href="/session"
                    className="flex items-center justify-center space-x-4 w-full bg-[#97D2FB] text-[#0A0A0B] font-black h-[4.5rem] rounded-full shadow-[0_12px_44px_-8px_rgba(94,173,247,0.25)] active:scale-[0.97] transition-all text-[1.15rem]"
                >
                    <span>Treinar agora (10 minutos)</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="mt-0.5"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
                </Link>
            </div>
        </div>
    );
}
