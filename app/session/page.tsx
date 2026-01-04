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
}

interface AnswerResponse {
    isCorrect: boolean;
    explanation: string;
    correctOptionId: string;
    nextQuestion: Question | null;
    updatedProgress: UserProgress;
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

            setHistory(prev => [...prev, {
                questionId: currentQuestion.id,
                isCorrect: data.isCorrect
            }]);

        } catch (error) {
            console.error('Erro ao processar resposta:', error);
        }
    };

    const handleNext = () => {
        if (answerFeedback?.nextQuestion) {
            setCurrentQuestion(answerFeedback.nextQuestion);
            setSelectedOptionId(null);
            setIsAnswered(false);
            setAnswerFeedback(null);
        } else {
            const correct = history.filter(h => h.isCorrect).length;
            const incorrect = history.length - correct;
            router.push(`/results?correct=${correct}&incorrect=${incorrect}`);
        }
    };

    if (loading) return <div className="text-center p-20 text-slate-400">Iniciando motor cognitivo...</div>;
    if (!currentQuestion) return <div className="text-center p-20 text-rose-400">Sessão encerrada ou erro.</div>;

    return (
        <div className="flex flex-col min-h-[90vh] space-y-6 max-w-2xl mx-auto">
            {/* Context Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    Treino {mode === 'smart' ? 'Inteligente' : mode === 'topic' ? 'por Tópico' : 'por Domínio'}: {history.length + 1}
                </span>
                <button onClick={() => router.push('/dashboard')} className="text-xs text-slate-500 hover:text-slate-300">
                    Sair
                </button>
            </div>

            {/* Question */}
            <div className="flex-1 space-y-8 py-4">
                <div className="space-y-4">
                    {(() => {
                        const topic = TOPICS.find(t => t.id === currentQuestion.topicId);
                        if (!topic) return null;
                        return (
                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border-l-2 border-blue-500/50 pl-3 py-0.5">
                                {MACRO_LABELS[topic.macroDomain]} • {topic.label}
                            </div>
                        );
                    })()}
                    <h1 className="text-xl font-medium leading-relaxed text-slate-100">
                        {currentQuestion.text}
                        {currentQuestion.isReinforcement && <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded animate-pulse">REFORÇO</span>}
                    </h1>

                    <div className="grid gap-3">
                        {currentQuestion.options.map((option) => {
                            const isSelected = selectedOptionId === option.id;
                            const isCorrect = isAnswered && option.id === answerFeedback?.correctOptionId;
                            const isWrongSelection = isAnswered && isSelected && !answerFeedback?.isCorrect;

                            let buttonStyles = "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700";
                            if (isAnswered) {
                                if (isCorrect) buttonStyles = "bg-emerald-600 border-emerald-500 text-white";
                                else if (isWrongSelection) buttonStyles = "bg-rose-600 border-rose-500 text-white";
                            } else if (isSelected) {
                                buttonStyles = "bg-blue-600/10 border-blue-600 text-blue-100";
                            }

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option.id)}
                                    disabled={isAnswered}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${buttonStyles}`}
                                >
                                    <span className="font-medium">{option.text}</span>
                                    {isCorrect && <span className="text-white bg-emerald-500/30 w-8 h-8 flex items-center justify-center rounded-full font-bold">✓</span>}
                                    {isWrongSelection && <span className="text-white bg-rose-500/30 w-8 h-8 flex items-center justify-center rounded-full font-bold">✗</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Pure BFF Feedback */}
                <div className="pt-6">
                    {isAnswered && answerFeedback ? (
                        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center space-x-2">
                                <span className={answerFeedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                                    {answerFeedback.isCorrect ? '★ Excelente!' : '⚠ Atenção ao Conceito'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                {answerFeedback.explanation}
                            </p>
                            <button
                                onClick={handleNext}
                                className="w-full bg-slate-50 text-slate-950 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all text-sm"
                            >
                                {answerFeedback.nextQuestion ? 'PRÓXIMA QUESTÃO' : 'VER RESULTADOS'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedOptionId}
                            className={`w-full font-bold py-5 rounded-2xl transition-all text-lg shadow-xl ${selectedOptionId
                                ? 'bg-blue-600 text-white shadow-blue-900/40'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                }`}
                        >
                            CONFIRMAR RESPOSTA
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SessionPage() {
    return (
        <Suspense fallback={<div className="text-center p-20 text-slate-400">Carregando parâmetros...</div>}>
            <SessionContent />
        </Suspense>
    );
}
