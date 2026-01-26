// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserProgress } from '@/lib/storage';
import { UserProgress } from '@/lib/types';

export default function Dashboard() {
    const router = useRouter();
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
        <div className="flex flex-col items-center justify-center min-h-[90vh] space-y-12 max-w-md mx-auto px-7 py-10">
            {/* Minimal Header */}
            <header className="absolute top-7 left-0 right-0 flex justify-center">
                <h1 className="text-[1.15rem] font-bold tracking-tight text-white/50">MemorizaCloud</h1>
            </header>

            {/* Cognitive State */}
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="flex flex-col items-center space-y-2">
                    <span className="text-6xl drop-shadow-2xl filter">{overallStatus.icon}</span>
                    <h2 className="text-2xl font-black text-white tracking-tight">{overallStatus.label}</h2>
                </div>

                <div className="space-y-4 w-full max-w-[280px]">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                        <span>Prontidão</span>
                        <span>{progress.readinessScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#5EADF7] transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(94,173,247,0.4)]"
                            style={{ width: `${progress.readinessScore}%` }}
                        />
                    </div>
                    <p className="text-sm text-zinc-400 font-medium">{overallStatus.message}</p>
                </div>
            </div>

            {/* Single Dominant CTA */}
            <div className="w-full space-y-6">
                <Link
                    href="/session?mode=smart"
                    className="flex flex-col items-center justify-center w-full bg-[#97D2FB] text-[#0A0A0B] font-black py-6 rounded-3xl shadow-[0_20px_60px_-12px_rgba(94,173,247,0.3)] hover:shadow-[0_20px_60px_-5px_rgba(94,173,247,0.4)] active:scale-[0.98] transition-all"
                >
                    <span className="text-xl tracking-tight">Treinar Agora</span>
                    <span className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">10 Minutos • Modo Smart</span>
                </Link>

                {/* Secondary Access */}
                <Link
                    href="/dashboard/details"
                    className="block text-center text-xs font-bold text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors py-4"
                >
                    Ver detalhes do progresso →
                </Link>
            </div>
        </div>
    );
}
