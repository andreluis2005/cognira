<<<<<<< HEAD
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Question, UserProgress } from '@/lib/types';
import { getProgramProgress, saveProgramProgress } from '@/lib/program-storage';
=======
// app/session/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Question, UserProgress } from '@/lib/types';
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
import { getUserProgress, saveUserProgress } from '@/lib/storage';
import { TOPICS } from '@/lib/topics';

const MACRO_LABELS: Record<string, string> = {
<<<<<<< HEAD
    D1_CLOUD_CONCEPTS: 'D1 - Cloud Concepts',
    D2_SECURITY_COMPLIANCE: 'D2 - Security and Compliance',
    D3_TECHNOLOGY_SERVICES: 'D3 - Technology and Cloud Services',
    D4_BILLING_SUPPORT: 'D4 - Billing and Pricing',
=======
    'D1_CLOUD_CONCEPTS': 'D1 — Conceitos de Nuvem',
    'D2_SECURITY_COMPLIANCE': 'D2 — Segurança e Conformidade',
    'D3_TECHNOLOGY_SERVICES': 'D3 — Tecnologia e Serviços em Nuvem',
    'D4_BILLING_SUPPORT': 'D4 — Cobrança, Preço e Suporte'
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
};

interface SessionHistoryItem {
    questionId: string;
    isCorrect: boolean;
    phase: 'MAIN' | 'REINFORCEMENT';
}

<<<<<<< HEAD
interface SessionQuestion extends Question {
    topicLabel?: string;
    trailLabel?: string;
    programTitle?: string;
}

=======
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
interface AnswerResponse {
    isCorrect: boolean;
    explanation: string;
    correctOptionId: string;
<<<<<<< HEAD
    nextQuestion: SessionQuestion | null;
    updatedProgress: UserProgress;
    totalQuestions?: number;
    programTitle?: string;
}

function getStoredProgress(programId: string | null) {
    return programId ? getProgramProgress(programId) : getUserProgress();
}

function saveStoredProgress(programId: string | null, progress: UserProgress) {
    if (programId) {
        saveProgramProgress(programId, progress);
        return;
    }

    saveUserProgress(progress);
=======
    nextQuestion: Question | null;
    updatedProgress: UserProgress;
    totalQuestions?: number;
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
}

function SessionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'smart';
    const targetId = searchParams.get('target');
<<<<<<< HEAD
    const programId = searchParams.get('programId');

    const [currentQuestion, setCurrentQuestion] = useState<SessionQuestion | null>(null);
    const [history, setHistory] = useState<SessionHistoryItem[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [programTitle, setProgramTitle] = useState<string | null>(null);
    const [currentProgress, setCurrentProgress] = useState<UserProgress | null>(null);
=======

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [history, setHistory] = useState<SessionHistoryItem[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2

    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState<AnswerResponse | null>(null);
    const [totalQuestions, setTotalQuestions] = useState(15);
    const [reinforcementPlan, setReinforcementPlan] = useState<{ total: number; count: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function start() {
            try {
<<<<<<< HEAD
                const progress = getStoredProgress(programId);
                setCurrentProgress(progress);
=======
                const progress = getUserProgress();
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                const res = await fetch('/api/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        progress,
                        mode,
<<<<<<< HEAD
                        targetId: targetId || undefined,
                        programId: programId || undefined,
                    }),
=======
                        targetId: targetId || undefined
                    })
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                });
                const data = await res.json();
                setSessionId(data.sessionId);
                setCurrentQuestion(data.firstQuestion);
<<<<<<< HEAD
                setProgramTitle(data.programTitle || null);
                if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
            } catch (error) {
                console.error('Error starting session:', error);
=======
                if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
            } catch (error) {
                console.error('Erro ao iniciar sessão:', error);
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            } finally {
                setLoading(false);
            }
        }
<<<<<<< HEAD

        start();
    }, [mode, programId, targetId]);
=======
        start();
    }, [mode, targetId]);
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2

    const handleSelect = (id: string) => {
        if (isAnswered) return;
        setSelectedOptionId(id);
    };

    const handleConfirm = async () => {
        if (!selectedOptionId || isAnswered || !currentQuestion || !sessionId) return;

        try {
<<<<<<< HEAD
            const progress = getStoredProgress(programId);
=======
            const progress = getUserProgress();
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
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
<<<<<<< HEAD
                    targetId: targetId || undefined,
                    programId: programId || undefined,
                }),
=======
                    targetId: targetId || undefined
                })
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            });
            const data: AnswerResponse = await res.json();

            if (data.updatedProgress) {
<<<<<<< HEAD
                saveStoredProgress(programId, data.updatedProgress);
                setCurrentProgress(data.updatedProgress);
=======
                saveUserProgress(data.updatedProgress);
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            }

            setAnswerFeedback(data);
            setIsAnswered(true);
<<<<<<< HEAD
            setProgramTitle(data.programTitle || programTitle);

            if (data.totalQuestions) setTotalQuestions(data.totalQuestions);

            setHistory((prev) => [...prev, {
                questionId: currentQuestion.id,
                isCorrect: data.isCorrect,
                phase: reinforcementPlan ? 'REINFORCEMENT' : 'MAIN',
            }]);
        } catch (error) {
            console.error('Error processing answer:', error);
=======

            if (data.totalQuestions) setTotalQuestions(data.totalQuestions);

            setHistory(prev => [...prev, {
                questionId: currentQuestion.id,
                isCorrect: data.isCorrect,
                phase: reinforcementPlan ? 'REINFORCEMENT' : 'MAIN'
            }]);

        } catch (error) {
            console.error('Erro ao processar resposta:', error);
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
        }
    };

    const handleNext = () => {
        if (answerFeedback?.nextQuestion) {
            const isMainPhaseDone = !reinforcementPlan && history.length === totalQuestions;

            if (isMainPhaseDone) {
<<<<<<< HEAD
                const mainErrors = history.filter((item) => !item.isCorrect).length;
                if (mainErrors > 0) {
                    setReinforcementPlan({
                        total: mainErrors,
                        count: 0,
                    });
                }
            } else if (reinforcementPlan) {
                setReinforcementPlan((prev) => (prev ? { ...prev, count: prev.count + 1 } : null));
=======
                const mainErrors = history.filter(h => !h.isCorrect).length;
                if (mainErrors > 0) {
                    setReinforcementPlan({
                        total: mainErrors,
                        count: 0
                    });
                }
            } else if (reinforcementPlan) {
                setReinforcementPlan(prev => prev ? { ...prev, count: prev.count + 1 } : null);
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            }

            setCurrentQuestion(answerFeedback.nextQuestion);
            setSelectedOptionId(null);
            setIsAnswered(false);
            setAnswerFeedback(null);
        } else {
<<<<<<< HEAD
            const mainHistory = history.filter((item) => item.phase === 'MAIN');
            const correct = mainHistory.filter((item) => item.isCorrect).length;
            const incorrect = mainHistory.length - correct;
            const params = new URLSearchParams({
                correct: String(correct),
                incorrect: String(incorrect),
            });

            if (programId) {
                params.set('programId', programId);
            }

            if (programTitle) {
                params.set('programTitle', programTitle);
            }

            router.push(`/results?${params.toString()}`);
        }
    };

    if (loading) return <div className="p-20 text-center text-slate-400">Initializing cognitive engine...</div>;
    if (!currentQuestion) return <div className="p-20 text-center text-rose-400">Session ended or error.</div>;

    const isReinforcementPhase = Boolean(reinforcementPlan);
    const reinforcement = reinforcementPlan ?? { total: 0, count: 0 };
    const uiTotal = isReinforcementPhase ? reinforcement.total : totalQuestions;
    const uiCurrent = isReinforcementPhase
        ? reinforcement.count + 1
        : (isAnswered ? history.length : history.length + 1);
    const progressPercentage = Math.min(100, (uiCurrent / Math.max(uiTotal, 1)) * 100);

    const legacyTopic = TOPICS.find((topic) => topic.id === currentQuestion.topicId);
    const currentTopicProgress = currentProgress?.topics?.[currentQuestion.topicId];
    const progressTopics = Object.values(currentProgress?.topics || {});
    const weakCount = progressTopics.filter((topic) => topic.status === 'WEAK').length;
    const evolvingCount = progressTopics.filter((topic) => topic.status === 'EVOLVING').length;
    const strongCount = progressTopics.filter((topic) => topic.status === 'STRONG').length;
    const sessionAccuracy = history.length > 0
        ? Math.round((history.filter((item) => item.isCorrect).length / history.length) * 100)
        : 0;
    const topicStatusLabel = currentTopicProgress?.status === 'WEAK'
        ? 'Weak'
        : currentTopicProgress?.status === 'EVOLVING'
            ? 'Evolving'
            : currentTopicProgress?.status === 'STRONG'
                ? 'Strong'
                : 'New';
    const topicStatusTone = currentTopicProgress?.status === 'WEAK'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
        : currentTopicProgress?.status === 'EVOLVING'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            : currentTopicProgress?.status === 'STRONG'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-slate-700 bg-slate-900 text-slate-300';
    const topicContextLabel = currentQuestion.topicLabel
        ? `${currentQuestion.trailLabel ? `${currentQuestion.trailLabel} - ` : ''}${currentQuestion.topicLabel}`
        : legacyTopic
            ? `${MACRO_LABELS[legacyTopic.macroDomain]} - ${legacyTopic.label}`
            : null;
    const exitHref = programId ? `/learn/programs/${programId}` : '/dashboard';

    return (
        <div className="mx-auto flex min-h-[90vh] w-full max-w-6xl flex-col gap-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:p-6">
                <div className="space-y-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800 shadow-inner">
                        <div
                            className={`h-full transition-all duration-700 ease-out ${
                                isReinforcementPhase
                                    ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                                    : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                                    isReinforcementPhase ? 'bg-purple-500/15 text-purple-300' : 'bg-blue-500/15 text-blue-300'
                                }`}>
                                    {isReinforcementPhase ? 'Reinforcement block' : 'Main block'}
                                </span>
                                <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Question {uiCurrent} of {uiTotal}
                                </span>
                                {programTitle ? (
                                    <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                                        {programTitle}
                                    </span>
                                ) : null}
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-100">
                                    {programTitle || (mode === 'smart' ? 'Smart training' : mode === 'topic' ? 'Domain training' : 'Domain training')}
                                </p>
                                {topicContextLabel ? (
                                    <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                        {topicContextLabel}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(exitHref)}
                            className="self-start rounded-full border border-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500 hover:text-white"
                        >
                            Exit session
                        </button>
                    </div>
                </div>
            </div>

            <div className={`grid flex-1 gap-6 ${isAnswered ? 'xl:grid-cols-[1.15fr_0.85fr]' : 'xl:grid-cols-[1fr_360px]'}`}>
                <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:p-7">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h1 className="text-xl font-medium leading-relaxed text-slate-100 md:text-2xl">
                                {currentQuestion.text}
                                {currentQuestion.isReinforcement ? (
                                    <span className="ml-2 inline-flex items-center rounded border border-blue-500/20 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400 animate-pulse">
                                        <span className="mr-1">R</span>
                                        Memory reinforcement
                                    </span>
                                ) : null}
                            </h1>

                            <div className="grid gap-3">
=======
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
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                                {currentQuestion.options.map((option) => {
                                    const isSelected = selectedOptionId === option.id;
                                    const isCorrect = isAnswered && option.id === answerFeedback?.correctOptionId;
                                    const isWrongSelection = isAnswered && isSelected && !answerFeedback?.isCorrect;

<<<<<<< HEAD
                                    let buttonStyles = 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700';
                                    if (isAnswered) {
                                        if (isCorrect) buttonStyles = 'bg-emerald-600 border-emerald-500 text-white';
                                        else if (isWrongSelection) buttonStyles = 'bg-rose-600 border-rose-500 text-white';
                                    } else if (isSelected) {
                                        buttonStyles = 'bg-blue-600/10 border-blue-600 text-blue-100';
=======
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
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSelect(option.id)}
                                            disabled={isAnswered}
<<<<<<< HEAD
                                            className={`group flex w-full items-center justify-between rounded-2xl border-2 p-5 text-left transition-all ${buttonStyles}`}
                                        >
                                            <span className="font-medium">{option.text}</span>
                                            {isCorrect ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/30 font-bold text-white">OK</span> : null}
                                            {isWrongSelection ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/30 font-bold text-white">X</span> : null}
=======
                                            className={`w-full text-left p-3 md:p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between group outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${buttonStyles}`}
                                        >
                                            <span className="text-[0.8rem] md:text-[0.9rem] leading-snug break-words pr-2">{option.text}</span>
                                            {iconOrLetter}
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
                                        </button>
                                    );
                                })}
                            </div>
<<<<<<< HEAD
                        </div>

                        {!isAnswered ? (
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedOptionId}
                                className={`w-full rounded-2xl py-5 text-lg font-bold shadow-xl transition-all ${
                                    selectedOptionId
                                        ? 'bg-blue-600 text-white shadow-blue-900/40'
                                        : 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500'
                                }`}
                            >
                                Confirm answer
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Session Context</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Phase</p>
                                <p className="mt-2 text-sm font-bold text-slate-100">
                                    {isReinforcementPhase ? 'Strategic reinforcement' : 'Main learning'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Progress</p>
                                <p className="mt-2 text-sm font-bold text-slate-100">{Math.round(progressPercentage)}%</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mode</p>
                                <p className="mt-2 text-sm font-bold text-slate-100">
                                    {mode === 'smart' ? 'Smart' : mode === 'topic' ? 'Topic' : 'Domain'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-800 bg-slate-950/70 p-5 md:p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Cognitive pulse</p>
                        <div className="mt-4 space-y-3">
                            <div className={`rounded-2xl border px-4 py-3 ${topicStatusTone}`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Current topic</p>
                                <p className="mt-2 text-sm font-black">{topicStatusLabel}</p>
                                <p className="mt-1 text-xs opacity-80">
                                    {currentTopicProgress
                                        ? `Accuracy ${currentTopicProgress.accuracy}% in ${currentTopicProgress.attempts} attempt(s).`
                                        : 'This topic does not have enough history yet.'}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Needs review</p>
                                    <p className="mt-2 text-2xl font-black text-rose-300">{weakCount}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Consolidating</p>
                                    <p className="mt-2 text-2xl font-black text-amber-300">{evolvingCount}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Already strong</p>
                                    <p className="mt-2 text-2xl font-black text-emerald-300">{strongCount}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Session accuracy</p>
                                    <p className="mt-2 text-2xl font-black text-slate-100">{sessionAccuracy}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isAnswered && answerFeedback ? (
                        <div className="space-y-4 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
                            <div className="flex items-center space-x-2">
                                <span className={`text-base font-black ${answerFeedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {answerFeedback.isCorrect ? 'Excellent' : 'Pay attention to the concept'}
                                </span>
                            </div>
                            {!answerFeedback.isCorrect && topicContextLabel ? (
                                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                    Cognitive suggestion: review <strong>{topicContextLabel}</strong> later while this context is active.
                                </div>
                            ) : null}
                            <p className="text-sm font-medium leading-relaxed text-slate-300">
                                {answerFeedback.explanation}
                            </p>
                            <button
                                onClick={handleNext}
                                className="w-full rounded-xl bg-slate-50 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 shadow-lg transition-all active:scale-95"
                            >
                                {answerFeedback.nextQuestion ? 'Next question' : 'View results'}
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-[2rem] border border-dashed border-slate-800 bg-slate-950/60 p-6 text-sm leading-relaxed text-slate-500">
                            Select an option and confirm to view cognitive feedback.
                        </div>
                    )}
                </div>
=======

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

>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            </div>
        </div>
    );
}

export default function SessionPage() {
    return (
<<<<<<< HEAD
        <Suspense fallback={<div className="p-20 text-center text-slate-400">Loading parameters...</div>}>
=======
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-400">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium tracking-wide">Iniciando ambiente focado...</p>
            </div>
        }>
>>>>>>> eff284d24687d41f514a457613875f1bddc984b2
            <SessionContent />
        </Suspense>
    );
}
