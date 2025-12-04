"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getQuestionsWithAnswers, getCourses } from "@/app/typing/actions";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 类型定义 ---
type WordStatus = 'normal' | 'active' | 'correct' | 'incorrect';

interface WordItem {
  index: number;
  correctText: string;
  userInput: string;
  status: WordStatus;
}

// --- 辅助函数：计算单词宽度 (模拟 useDynamicWidth) ---
const getWordWidthStyle = (text: string, placeholder: string) => {
  const target = text.length > placeholder.length ? text : placeholder;
  const hasChinese = /[\u4e00-\u9fa5]/.test(target);
  
  let width;
  if (hasChinese) {
    width = Math.max(2, target.length * 1.2 + 1);
  } else {
    width = Math.max(2, target.length * 0.8 + 1);
  }
  
  return { minWidth: `${width}em` };
};

// --- 核心组件: DictationInput ---
interface DictationInputProps {
  answer: string;
  onComplete?: (isCorrect: boolean) => void;
  key?: string | number;
}

const DictationInput = ({ answer, onComplete }: DictationInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);
  
  const [inputValue, setInputValue] = useState("");
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const correctWords = useMemo(() => {
    return answer.split(/\s+/).filter(w => w.length > 0);
  }, [answer]);

  const words: WordItem[] = useMemo(() => {
    const userWords = inputValue.split(/\s/); 
    
    return correctWords.map((correctText, index) => {
      const userInput = userWords[index] || "";
      let status: WordStatus = 'normal';
      
      if (isSubmitted) {
        const cleanUser = userInput.trim().toLowerCase().replace(/[.,?!]/g, "");
        const cleanCorrect = correctText.toLowerCase().replace(/[.,?!]/g, "");
        status = cleanUser === cleanCorrect ? 'correct' : 'incorrect';
      } else {
        if (index === activeWordIndex) {
          status = 'active';
        }
      }

      return { index, correctText, userInput, status };
    });
  }, [correctWords, inputValue, activeWordIndex, isSubmitted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newVal.slice(0, cursorPosition);
    const spacesCount = textBeforeCursor.split(/\s/).length - 1;
    setActiveWordIndex(Math.min(spacesCount, correctWords.length - 1));
    
    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
    const target = e.currentTarget;
    const cursorPosition = target.selectionStart || 0;
    const textBeforeCursor = target.value.slice(0, cursorPosition);
    const spacesCount = textBeforeCursor.split(/\s/).length - 1;
    setActiveWordIndex(Math.min(spacesCount, correctWords.length - 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isComposing.current) return;
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    setIsSubmitted(true);
    const isAllCorrect = words.every(w => {
        const cleanUser = w.userInput.trim().toLowerCase().replace(/[.,?!]/g, "");
        const cleanCorrect = w.correctText.toLowerCase().replace(/[.,?!]/g, "");
        return cleanUser === cleanCorrect;
    });
    
    if (onComplete) {
        onComplete(isAllCorrect);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto p-8 min-h-[200px]">
      <input
        ref={inputRef}
        type="text"
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10 bg-transparent text-transparent caret-transparent p-8 font-mono text-lg"
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => isComposing.current = true}
        onCompositionEnd={() => isComposing.current = false}
        autoComplete="off"
        spellCheck={false}
      />

      <div className="relative z-0 flex flex-wrap justify-center gap-x-4 gap-y-8 pointer-events-none">
        {words.map((word) => (
          <div
            key={word.index}
            className={cn(
              "relative flex items-end justify-center h-[4rem] border-b-2 transition-all duration-200 px-2",
              word.status === 'normal' && "border-zinc-200 text-zinc-400",
              word.status === 'active' && "border-fuchsia-500 text-fuchsia-500 scale-110",
              word.status === 'correct' && "border-green-500 text-green-600",
              word.status === 'incorrect' && "border-red-500 text-red-500 animate-in fade-in shake",
            )}
            style={getWordWidthStyle(word.correctText, word.userInput)}
          >
            <span className="text-[3em] leading-none font-sans pb-1 whitespace-nowrap">
              {word.userInput}
            </span>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-2 right-4 text-zinc-300 text-sm pointer-events-none">
         {activeWordIndex + 1} / {correctWords.length}
      </div>
    </div>
  );
};


// --- 页面容器 ---
export default function DictationPage() {
  // 新增：课程列表状态
  const [coursesList, setCoursesList] = useState<{id: number, name: string, description: string | null}[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const [questions, setQuestions] = useState<{id: number, title: string, answerContent: string | null}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- 长按揭晓状态 ---
  const [isPressing, setIsPressing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. 初始化加载课程
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      const res = await getCourses();
      if (res.success && res.data) {
        setCoursesList(res.data);
      }
      setLoading(false);
    };
    loadCourses();
  }, []);

  // 2. 选课后加载题目
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadQuestions = async () => {
      setLoading(true);
      const res = await getQuestionsWithAnswers(selectedCourseId);
      if (res.success && res.data) {
        setQuestions(res.data);
        setCurrentIndex(0); // 重置题目索引
      }
      setLoading(false);
    };
    loadQuestions();
  }, [selectedCourseId]);

  // 重置长按状态
  useEffect(() => {
    setIsRevealed(false);
    setIsPressing(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [currentIndex]);

  const startPress = () => {
    if (isRevealed) return;
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      setIsRevealed(true);
      setIsPressing(false);
    }, 200);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleComplete = (isCorrect: boolean) => {
      if (isCorrect) {
          setTimeout(() => {
              handleNext();
          }, 1000);
      }
  };

  // Loading 状态
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  // --- 1. 课程选择界面 ---
  if (!selectedCourseId) {
    return (
       <div className="min-h-screen w-full flex flex-col bg-zinc-50 select-none">
         <header className="w-full p-6 flex justify-between items-center text-zinc-400">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2 text-zinc-500 hover:text-zinc-900">
                <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <div className="font-bold text-zinc-800">KeyMantra Dictation</div>
         </header>
         <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-zinc-900 mb-8">Select a Course</h1>
            {coursesList.length === 0 ? (
                <div className="text-center text-zinc-500">暂无课程数据</div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
                    {coursesList.map(course => (
                        <button 
                            key={course.id}
                            onClick={() => setSelectedCourseId(course.id)}
                            className="flex flex-col items-start p-8 bg-white rounded-2xl shadow-sm border border-zinc-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.02] transition-all text-left group"
                        >
                            <div className="text-xl font-bold text-zinc-900 group-hover:text-blue-600 transition-colors mb-3">
                                {course.name}
                            </div>
                            {course.description && (
                                <div className="text-zinc-500 text-sm line-clamp-3 leading-relaxed">
                                    {course.description}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
         </main>
       </div>
    );
  }

  // --- 2. 题目加载为空 ---
  if (questions.length === 0) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <div className="text-zinc-500">该课程暂无题目</div>
            <Button onClick={() => setSelectedCourseId(null)}>返回课程列表</Button>
        </div>
      );
  }

  const currentQuestion = questions[currentIndex];
  
  // 防御性检查：防止索引越界
  if (!currentQuestion) {
     return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <div className="text-2xl font-bold">All Done! 🎉</div>
            <Button onClick={() => setSelectedCourseId(null)}>Back to Courses</Button>
        </div>
     );
  }

  const currentAnswer = currentQuestion.answerContent || "No Answer Provided";

  // --- 3. 默写界面 ---
  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-50 select-none">
      <header className="w-full p-6 flex justify-between items-center text-zinc-400">
         {/* 返回按钮改为返回课程列表 */}
         <Button variant="ghost" size="sm" onClick={() => setSelectedCourseId(null)} className="gap-2 text-zinc-500 hover:text-zinc-900">
           <ChevronLeft className="w-4 h-4" /> Courses
         </Button>
         <div className="flex items-center gap-6">
            <div className="font-bold text-zinc-800">KeyMantra Dictation</div>
            <div>{currentIndex + 1} / {questions.length}</div>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-12 pb-32">
        
        <div className="text-center space-y-4 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
              {currentQuestion.title}
            </h1>
            <p className="text-zinc-500">
                Listen (Look) and type the correct answer.
            </p>
        </div>

        {/* --- 长按提示答案区域 --- */}
        <div 
          className="relative group cursor-pointer select-none"
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
        >
            <div className={cn(
                "px-6 py-3 rounded-xl bg-white/50 border border-zinc-200/50 shadow-sm transition-all duration-300 min-w-[200px] text-center backdrop-blur-sm",
                isPressing && "bg-white scale-95 border-zinc-300",
                isRevealed && "bg-green-50 border-green-200"
            )}>
                <div className={cn(
                    "text-lg font-medium transition-all duration-300",
                    isRevealed ? "text-green-700 blur-0" : "text-zinc-400 blur-sm",
                    isPressing && !isRevealed && "blur-[2px]"
                )}>
                    {currentAnswer}
                </div>
                
                {!isRevealed && (
                    <div className={cn(
                        "absolute inset-0 flex items-center justify-center text-xs text-zinc-400 font-medium uppercase tracking-wider transition-opacity",
                        isPressing ? "opacity-0" : "opacity-100"
                    )}>
                        Hold for hint
                    </div>
                )}

                {/* 进度条 */}
                {isPressing && !isRevealed && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-400 animate-[progress_0.2s_linear_forwards]" />
                    </div>
                )}
            </div>
        </div>

        <DictationInput 
            key={currentIndex} 
            answer={currentAnswer} 
            onComplete={handleComplete}
        />
        
        <div className="flex items-center gap-8 mt-8">
           <Button 
             variant="outline" 
             size="icon" 
             onClick={handlePrev} 
             disabled={currentIndex === 0}
             className="rounded-full w-12 h-12"
           >
             <ChevronLeft className="w-6 h-6" />
           </Button>
           
           <span className="text-zinc-400 font-mono">
             {currentIndex + 1} / {questions.length}
           </span>

           <Button 
             variant="outline" 
             size="icon" 
             onClick={handleNext} 
             disabled={currentIndex === questions.length - 1}
             className="rounded-full w-12 h-12"
           >
             <ChevronRight className="w-6 h-6" />
           </Button>
        </div>

      </main>
      
      <style jsx global>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
