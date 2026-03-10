'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserProgress } from '@/lib/storage';
import { UserProgress } from '@/lib/types';

export default function LegacyDashboard() {
    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        setProgress(getUserProgress());
    }, []);

    if (!progress) return null;

    const getOverallStatus = (score: number) => {
        if (score < 50) return { label: 'Em risco', icon: '⚠️', message: 'Foque nos conceitos básicos.' };
        if (score < 80) return { label: 'Em evolução', icon: '⚡', message: 'Ótimo ritmo, continue assim.' };
        return { label: 'Pronto', icon: '✅', message: 'Você está dominando o conteúdo!' };
    };

    const overallStatus = getOverallStatus(progress.readinessScore);

    return (
        <div className="mx-auto flex min-h-[90vh] max-w-md flex-col items-center justify-center space-y-12 px-7 py-10">
            <header className="absolute left-0 right-0 top-7 flex justify-center">
                <h1 className="text-[1.15rem] font-bold tracking-tight text-white/50">Cognira</h1>
            </header>

            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="flex flex-col items-center space-y-2">
                    <span className="filter text-6xl drop-shadow-2xl">{overallStatus.icon}</span>
                    <h2 className="text-2xl font-black tracking-tight text-white">{overallStatus.label}</h2>
                </div>

                <div className="w-full max-w-[280px] space-y-4">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                        <span>Prontidão</span>
                        <span>{progress.readinessScore}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                            className="h-full bg-[#5EADF7] shadow-[0_0_15px_rgba(94,173,247,0.4)] transition-all duration-1000 ease-out"
                            style={{ width: `${progress.readinessScore}%` }}
                        />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">{overallStatus.message}</p>
                </div>
            </div>

            <div className="w-full space-y-6">
                <Link
                    href="/session?mode=smart"
                    className="flex w-full flex-col items-center justify-center rounded-3xl bg-[#97D2FB] py-5 font-black text-[#0A0A0B] shadow-[0_20px_60px_-12px_rgba(94,173,247,0.3)] transition-all hover:shadow-[0_20px_60px_-5px_rgba(94,173,247,0.4)] active:scale-[0.98]"
                >
                    <span className="text-lg tracking-tight">Treinar Agora</span>
                    <span className="mt-1 text-xs font-bold uppercase tracking-widest opacity-80">10 Minutos • Modo Smart</span>
                </Link>

                <Link
                    href="/dashboard/details"
                    className="block py-4 text-center text-xs font-bold uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-400"
                >
                    Ver detalhes do progresso →
                </Link>
            </div>
        </div>
    );
}
