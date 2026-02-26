// app/session/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Question, UserProgress } from '@/lib/types';
import { getUserProgress, saveUserProgress } from '@/lib/storage';
import { TOPICS } from '@/lib/topics';

const MACRO_LABELS: Record<string, string> = {
    'D1_CLOUD_CONCEPTS': 'D1 — Conceitos de Nuvem',
    'D2_SECURITY_COMPLIANCE': 'D2 — Segurança e Conformidade',
    'D3_TECHNOLOGY_SERVICES': 'D3 — Tecnologia e Serviços em Nuvem',
    'D4_BILLING_SUPPORT': 'D4 — Cobrança, Preço e Suporte'
};

interface SessionHistoryItem {
    questionId: string;
    isCorrect: boolean;
    phase: 'MAIN' | 'REINFORCEMENT';
}

interface AnswerResponse {
    isCorrect: boolean;
    explanation: string;
    correctOptionId: string;
    nextQuestion: Question | null;
    updatedProgress: UserProgress;
    totalQuestions?: number;
}

function SessionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'smart';
    const targetId = searchParams.get('target');

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [history, setHistory] = useState<SessionHistoryItem[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState<AnswerResponse | null>(null);
    const [totalQuestions, setTotalQuestions] = useState(15);
    const [reinforcementPlan, setReinforcementPlan] = useState<{ total: number; count: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function start() {
            try {
                const progress = getUserProgress();
                const res = await fetch('/api/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        progress,
                        mode,
                        targetId: targetId || undefined
                    })
                });
                const data = await res.json();
                setSessionId(data.sessionId);
                setCurrentQuestion(data.firstQuestion);
                if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
            } catch (error) {
                console.error('Erro ao iniciar sessão:', error);
            } finally {
                setLoading(false);
            }
        }
        start();
    }, [mode, targetId]);

    const handleSelect = (id: string) => {
        if (isAnswered) return;
        setSelectedOptionId(id);
    };

    const handleConfirm = async () => {
        if (!selectedOptionId || isAnswered || !currentQuestion || !sessionId) return;

        try {
            const progress = getUserProgress();
            const res = await fetch('/api/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    questionId: currentQuestion.id,
                    selectedOptionId,
                    history,
                    progress,
                    mode,
                    targetId: targetId || undefined
                })
            });
            const data: AnswerResponse = await res.json();

            if (data.updatedProgress) {
                saveUserProgress(data.updatedProgress);
            }

            setAnswerFeedback(data);
            setIsAnswered(true);

            if (data.totalQuestions) setTotalQuestions(data.totalQuestions);

            setHistory(prev => [...prev, {
                questionId: currentQuestion.id,
                isCorrect: data.isCorrect,
                phase: reinforcementPlan ? 'REINFORCEMENT' : 'MAIN'
            }]);

        } catch (error) {
            console.error('Erro ao processar resposta:', error);
        }
    };

    const handleNext = () => {
        if (answerFeedback?.nextQuestion) {
            const isMainPhaseDone = !reinforcementPlan && history.length === totalQuestions;

            if (isMainPhaseDone) {
                const mainErrors = history.filter(h => !h.isCorrect).length;
                if (mainErrors > 0) {
                    setReinforcementPlan({
                        total: mainErrors,
                        count: 0
                    });
                }
            } else if (reinforcementPlan) {
                setReinforcementPlan(prev => prev ? { ...prev, count: prev.count + 1 } : null);
            }

            setCurrentQuestion(answerFeedback.nextQuestion);
            setSelectedOptionId(null);
            setIsAnswered(false);
            setAnswerFeedback(null);
        } else {
            const mainHistory = history.filter(h => h.phase === 'MAIN');
            const correct = mainHistory.filter(h => h.isCorrect).length;
            const incorrect = mainHistory.length - correct;
            router.push(`/results?correct=${correct}&incorrect=${incorrect}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium tracking-wide">Iniciando ambiente focado...</p>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-rose-400">
                Sessão encerrada ou erro.
            </div>
        );
    }

    const isReinforcementPhase = !!reinforcementPlan;
    const uiTotal = isReinforcementPhase ? reinforcementPlan.total : totalQuestions;
    const uiCurrent = isReinforcementPhase
        ? reinforcementPlan.count + 1
        : (isAnswered ? history.length : history.length + 1);

    const progressPercentage = Math.min(100, (uiCurrent / uiTotal) * 100);

    return (
        <div className="bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30 flex flex-col min-h-screen">
            <div className="w-full max-w-3xl mx-auto px-4 py-4 md:py-6 flex flex-col flex-1 backdrop-blur-[1px]">

                {/* Header / Top Bar */}
                <header className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="flex flex-col space-y-0.5">
                        <span className="text-[0.65rem] md:text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest">
                            {isReinforcementPhase ? "Fase de Reforço" : "Treino Inteligente"}
                        </span>
                        <span className="text-xs md:text-sm font-medium text-slate-300">
                            Questão <span className="text-white font-bold">{uiCurrent}</span> de {uiTotal}
                        </span>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-[0.7rem] md:text-xs font-semibold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors px-2.5 md:px-3 py-1.5 rounded-md hover:bg-slate-900 border border-transparent hover:border-slate-800"
                    >
                        Sair
                    </button>
                </header>

                {/* Minimal Progress Bar */}
                <div className="w-full bg-slate-900 h-[0.15rem] md:h-[0.2rem] rounded-full overflow-hidden mb-4 md:mb-6">
                    <div
                        className={`h-full transition-all duration-700 ease-out bg-slate-400`}
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                {/* Main Content Area */}
                <main className="flex-1">
                    <div className={isAnswered ? "lg:flex lg:gap-8 lg:items-start" : ""}>
                        {/* Coluna Esquerda: Pergunta e Opções */}
                        <div className={isAnswered ? "lg:w-[65%]" : ""}>
                            {/* Question Statement */}
                            <div className="mb-5 md:mb-8 flex-shrink-0">
                                {(() => {
                                    const topic = TOPICS.find(t => t.id === currentQuestion.topicId);
                                    if (!topic) return null;
                                    return (
                                        <div className="text-[0.6rem] md:text-[0.7rem] font-bold text-blue-400/80 mb-2 md:mb-2.5 tracking-wide flex items-center gap-2">
                                            <span className="w-1 h-2.5 md:h-3 bg-blue-500/50 rounded-sm inline-block"></span>
                                            {MACRO_LABELS[topic.macroDomain]} • {topic.label}
                                        </div>
                                    );
                                })()}

                                <h1 className="text-lg md:text-[1.25rem] text-slate-50 font-medium leading-relaxed md:leading-snug">
                                    {currentQuestion.text}
                                </h1>
                            </div>

                            {/* Options Grid */}
                            <div className="flex flex-col gap-1.5 md:gap-2 mb-4 flex-shrink-0">
                                {currentQuestion.options.map((option) => {
                                    const isSelected = selectedOptionId === option.id;
                                    const isCorrect = isAnswered && option.id === answerFeedback?.correctOptionId;
                                    const isWrongSelection = isAnswered && isSelected && !answerFeedback?.isCorrect;

                                    // Base styling
                                    let buttonStyles = "bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700";
                                    let iconOrLetter = null;

                                    if (isAnswered) {
                                        if (isCorrect) {
                                            buttonStyles = "bg-emerald-950/30 border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.05)]";
                                            iconOrLetter = <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[0.65rem] md:text-xs font-bold ml-3">✓</span>;
                                        } else if (isWrongSelection) {
                                            buttonStyles = "bg-rose-950/30 border-rose-500/50 text-rose-100";
                                            iconOrLetter = <span className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[0.65rem] md:text-xs font-bold ml-3">✕</span>;
                                        } else {
                                            buttonStyles = "bg-slate-950 border-slate-900 text-slate-600 opacity-50";
                                        }
                                    } else if (isSelected) {
                                        buttonStyles = "bg-blue-900/20 border-blue-500/50 text-blue-50";
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSelect(option.id)}
                                            disabled={isAnswered}
                                            className={`w-full text-left p-3 md:p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between group outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${buttonStyles}`}
                                        >
                                            <span className="text-[0.8rem] md:text-[0.9rem] leading-snug break-words pr-2">{option.text}</span>
                                            {iconOrLetter}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Confirm Button (Only shown when not answered) */}
                            {!isAnswered && (
                                <div className="mt-auto md:mt-2 pt-1 md:pt-2 pb-1 shrink-0">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={!selectedOptionId}
                                        className={`w-full font-bold text-[0.8rem] md:text-[0.9rem] tracking-wide py-3 md:py-3.5 rounded-xl transition-all active:scale-[0.98] ${selectedOptionId
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                                            }`}
                                    >
                                        CONFIRMAR ESTA OPÇÃO
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Coluna Direita: Feedback e Botão Próxima (Somente quando respondido) */}
                        {isAnswered && answerFeedback && (
                            <div className="mt-6 lg:mt-0 lg:w-[35%] animate-in slide-in-from-bottom-2 lg:slide-in-from-right-2 fade-in duration-300">
                                <div className="space-y-4 md:space-y-5">
                                    {/* Professional Feedback Card */}
                                    <div className="p-3.5 md:p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h3 className={`font-bold text-[0.65rem] md:text-[0.7rem] tracking-wide ${answerFeedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {answerFeedback.isCorrect ? 'RESPOSTA CORRETA' : 'ANÁLISE DE CONCEITO'}
                                            </h3>
                                        </div>
                                        <p className="text-slate-300 text-[0.8rem] md:text-[0.9rem] leading-relaxed">
                                            {answerFeedback.explanation}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="w-full bg-slate-100 hover:bg-white text-slate-950 font-bold text-[0.8rem] md:text-[0.9rem] tracking-wide py-3 md:py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                                    >
                                        {answerFeedback.nextQuestion ? 'PRÓXIMA QUESTÃO' : 'FINALIZAR SESSÃO'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

            </div>
        </div>
    );
}

export default function SessionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium tracking-wide">Iniciando ambiente focado...</p>
            </div>
        }>
            <SessionContent />
        </Suspense>
    );
}
