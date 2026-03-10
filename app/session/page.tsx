'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Question, UserProgress } from '@/lib/types';
import { getProgramProgress, saveProgramProgress } from '@/lib/program-storage';
import { getUserProgress, saveUserProgress } from '@/lib/storage';
import { TOPICS } from '@/lib/topics';

const MACRO_LABELS: Record<string, string> = {
    D1_CLOUD_CONCEPTS: 'D1 - Cloud Concepts',
    D2_SECURITY_COMPLIANCE: 'D2 - Security and Compliance',
    D3_TECHNOLOGY_SERVICES: 'D3 - Technology and Cloud Services',
    D4_BILLING_SUPPORT: 'D4 - Billing and Pricing',
};

interface SessionHistoryItem {
    questionId: string;
    isCorrect: boolean;
    phase: 'MAIN' | 'REINFORCEMENT';
}

interface SessionQuestion extends Question {
    topicLabel?: string;
    trailLabel?: string;
    programTitle?: string;
}

interface AnswerResponse {
    isCorrect: boolean;
    explanation: string;
    correctOptionId: string;
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
}

function SessionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'smart';
    const targetId = searchParams.get('target');
    const programId = searchParams.get('programId');

    const [currentQuestion, setCurrentQuestion] = useState<SessionQuestion | null>(null);
    const [history, setHistory] = useState<SessionHistoryItem[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [programTitle, setProgramTitle] = useState<string | null>(null);
    const [currentProgress, setCurrentProgress] = useState<UserProgress | null>(null);

    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState<AnswerResponse | null>(null);
    const [totalQuestions, setTotalQuestions] = useState(15);
    const [reinforcementPlan, setReinforcementPlan] = useState<{ total: number; count: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function start() {
            try {
                const progress = getStoredProgress(programId);
                setCurrentProgress(progress);
                const res = await fetch('/api/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        progress,
                        mode,
                        targetId: targetId || undefined,
                        programId: programId || undefined,
                    }),
                });
                const data = await res.json();
                setSessionId(data.sessionId);
                setCurrentQuestion(data.firstQuestion);
                setProgramTitle(data.programTitle || null);
                if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
            } catch (error) {
                console.error('Error starting session:', error);
            } finally {
                setLoading(false);
            }
        }

        start();
    }, [mode, programId, targetId]);

    const handleSelect = (id: string) => {
        if (isAnswered) return;
        setSelectedOptionId(id);
    };

    const handleConfirm = async () => {
        if (!selectedOptionId || isAnswered || !currentQuestion || !sessionId) return;

        try {
            const progress = getStoredProgress(programId);
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
                    targetId: targetId || undefined,
                    programId: programId || undefined,
                }),
            });
            const data: AnswerResponse = await res.json();

            if (data.updatedProgress) {
                saveStoredProgress(programId, data.updatedProgress);
                setCurrentProgress(data.updatedProgress);
            }

            setAnswerFeedback(data);
            setIsAnswered(true);
            setProgramTitle(data.programTitle || programTitle);

            if (data.totalQuestions) setTotalQuestions(data.totalQuestions);

            setHistory((prev) => [...prev, {
                questionId: currentQuestion.id,
                isCorrect: data.isCorrect,
                phase: reinforcementPlan ? 'REINFORCEMENT' : 'MAIN',
            }]);
        } catch (error) {
            console.error('Error processing answer:', error);
        }
    };

    const handleNext = () => {
        if (answerFeedback?.nextQuestion) {
            const isMainPhaseDone = !reinforcementPlan && history.length === totalQuestions;

            if (isMainPhaseDone) {
                const mainErrors = history.filter((item) => !item.isCorrect).length;
                if (mainErrors > 0) {
                    setReinforcementPlan({
                        total: mainErrors,
                        count: 0,
                    });
                }
            } else if (reinforcementPlan) {
                setReinforcementPlan((prev) => (prev ? { ...prev, count: prev.count + 1 } : null));
            }

            setCurrentQuestion(answerFeedback.nextQuestion);
            setSelectedOptionId(null);
            setIsAnswered(false);
            setAnswerFeedback(null);
        } else {
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
                                {currentQuestion.options.map((option) => {
                                    const isSelected = selectedOptionId === option.id;
                                    const isCorrect = isAnswered && option.id === answerFeedback?.correctOptionId;
                                    const isWrongSelection = isAnswered && isSelected && !answerFeedback?.isCorrect;

                                    let buttonStyles = 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700';
                                    if (isAnswered) {
                                        if (isCorrect) buttonStyles = 'bg-emerald-600 border-emerald-500 text-white';
                                        else if (isWrongSelection) buttonStyles = 'bg-rose-600 border-rose-500 text-white';
                                    } else if (isSelected) {
                                        buttonStyles = 'bg-blue-600/10 border-blue-600 text-blue-100';
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleSelect(option.id)}
                                            disabled={isAnswered}
                                            className={`group flex w-full items-center justify-between rounded-2xl border-2 p-5 text-left transition-all ${buttonStyles}`}
                                        >
                                            <span className="font-medium">{option.text}</span>
                                            {isCorrect ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/30 font-bold text-white">OK</span> : null}
                                            {isWrongSelection ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/30 font-bold text-white">X</span> : null}
                                        </button>
                                    );
                                })}
                            </div>
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
            </div>
        </div>
    );
}

export default function SessionPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center text-slate-400">Loading parameters...</div>}>
            <SessionContent />
        </Suspense>
    );
}
