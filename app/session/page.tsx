'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Question, UserProgress } from '@/lib/types';
import { getUserProgress, saveUserProgress } from '@/lib/storage';
import { generateSession, updateProgressAfterQuestion } from '@/lib/logic';
import questionsData from '@/data/questions.json';

export default function SessionPage() {
    const router = useRouter();
    const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [sessionProgress, setSessionProgress] = useState<UserProgress | null>(null);
    const [reinforcementCount, setReinforcementCount] = useState(0);

    useEffect(() => {
        const progress = getUserProgress();
        setSessionProgress(progress);
        const session = generateSession(questionsData as Question[], progress);
        setSessionQuestions(session);
    }, []);

    const handleSelect = (id: string) => {
        if (isAnswered) return;
        setSelectedOptionId(id);
    };

    const handleConfirm = () => {
        if (!selectedOptionId || isAnswered) return;
        setIsAnswered(true);
    };

    const handleNext = () => {
        if (!sessionProgress || !sessionQuestions[currentIndex]) return;

        const currentQuestion = sessionQuestions[currentIndex];
        const isCorrect = selectedOptionId === currentQuestion.correctOptionId;

        // Update global progress state
        const updatedProgress = updateProgressAfterQuestion(sessionProgress, currentQuestion, isCorrect);
        setSessionProgress(updatedProgress);
        saveUserProgress(updatedProgress);

        // Immediate Error Reinforcement Logic
        if (!isCorrect && !currentQuestion.isReinforcement && reinforcementCount < 2) {
            const reinforcedQuestion: Question = {
                ...currentQuestion,
                isReinforcement: true
            };
            setSessionQuestions(prev => [...prev, reinforcedQuestion]);
            setReinforcementCount(prev => prev + 1);
        }

        // Navigation logic
        if (currentIndex < sessionQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOptionId(null);
            setIsAnswered(false);
        } else {
            router.push('/results');
        }
    };

    if (sessionQuestions.length === 0) return <div className="text-center p-20">Preparando sua sessão...</div>;

    const currentQuestion = sessionQuestions[currentIndex];

    return (
        <div className="flex flex-col min-h-[90vh] space-y-6">
            {/* Progress Header */}
            <div className="flex items-center space-x-4">
                <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-mono text-slate-500">
                    {currentIndex + 1} / {sessionQuestions.length}
                </span>
            </div>

            {/* Question */}
            <div className="flex-1 space-y-8 py-4">
                <h1 className="text-xl font-medium leading-relaxed text-slate-100">
                    {currentQuestion.text}
                </h1>

                <div className="grid gap-3">
                    {currentQuestion.options.map((option) => {
                        const isSelected = selectedOptionId === option.id;
                        const isCorrect = option.id === currentQuestion.correctOptionId;
                        const showCorrect = isAnswered && isCorrect;
                        const showWrong = isAnswered && isSelected && !isCorrect;

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleSelect(option.id)}
                                disabled={isAnswered}
                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${showCorrect ? 'bg-emerald-500/10 border-emerald-500 text-emerald-100' :
                                    showWrong ? 'bg-rose-500/10 border-rose-500 text-rose-100' :
                                        isSelected ? 'bg-blue-600/10 border-blue-600 text-blue-100' :
                                            'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                            >
                                <span>{option.text}</span>
                                {showCorrect && <span className="text-emerald-500 font-bold ml-2">✓</span>}
                                {showWrong && <span className="text-rose-500 font-bold ml-2">✗</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback Overlay / Footer */}
            <div className="pt-6">
                {isAnswered ? (
                    <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center space-x-2">
                            <span className={selectedOptionId === currentQuestion.correctOptionId ? 'text-emerald-400' : 'text-rose-400'}>
                                {selectedOptionId === currentQuestion.correctOptionId
                                    ? (currentQuestion.isReinforcement ? 'Confirmado' : '★ Correto')
                                    : '⚠ Incorreto!'}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Explicação</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {currentQuestion.explanation}
                        </p>
                        <button
                            onClick={handleNext}
                            className="w-full bg-slate-50 text-slate-950 font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all text-sm"
                        >
                            PRÓXIMA QUESTÃO
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
    );
}
