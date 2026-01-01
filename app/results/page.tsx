'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserProgress } from '@/lib/storage';
import { UserProgress } from '@/lib/types';

export default function ResultsPage() {
    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        setProgress(getUserProgress());
    }, []);

    if (!progress) return null;

    return (
        <div className="flex flex-col space-y-10 max-w-md mx-auto pt-10 pb-40 px-6">
            <h1 className="text-[2rem] font-bold tracking-tight text-white leading-tight">
                Análise da Sessão
            </h1>

            {/* Hero Card */}
            <div className="primary-card p-6 space-y-5">
                <div className="text-zinc-500 text-[0.95rem] font-medium">
                    Progresso geral: {progress.readinessScore}%
                </div>
                <div className="h-4 w-full secondary-bar rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#5EADF7] glow-bar transition-all duration-1000 ease-out"
                        style={{ width: `${progress.readinessScore}%` }}
                    />
                </div>
                <div className="flex items-center space-x-3 text-emerald-400 text-[0.95rem] font-bold">
                    <span className="text-xl">⚡</span>
                    <span>Sua prontidão aumentou!</span>
                </div>
            </div>

            {/* Impact Card */}
            <section className="primary-card p-6 space-y-7">
                <h3 className="text-lg font-medium text-white">Impacto Identificado</h3>
                <div className="space-y-7">
                    <div className="space-y-2.5">
                        <div className="flex items-center space-x-3 text-[0.95rem] font-medium text-zinc-100">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>IAM melhorou</span>
                        </div>
                        <div className="h-2 w-full secondary-bar rounded-full overflow-hidden">
                            <div className="h-full bg-[#5EADF7]/40 w-[60%]" />
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex items-center space-x-3 text-[0.95rem] font-medium text-zinc-100">
                            <span className="text-red-500 font-bold">✗</span>
                            <span>VPC ainda crítico</span>
                        </div>
                        <div className="h-2 w-full secondary-bar rounded-full overflow-hidden">
                            <div className="h-full bg-[#5EADF7] glow-bar w-[35%]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <div className="fixed bottom-10 left-0 right-0 px-8 max-w-md mx-auto">
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center w-full bg-[#97D2FB] text-slate-900 font-bold py-5 rounded-full shadow-lg active:scale-[0.98] transition-all text-[1.05rem]"
                >
                    <span>Concluir Análise</span>
                </Link>
            </div>
        </div>
    );
}
