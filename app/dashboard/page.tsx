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
    );
}
