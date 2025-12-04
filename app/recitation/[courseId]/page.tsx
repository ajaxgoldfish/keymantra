"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getQuestionsWithAnswers } from "@/app/typing/actions";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";

// 类型定义
type QuestionData = {
  id: number;
  no: number;
  title: string;
  answerContent: string | null;
};

export default function RecitationPage() {
  const params = useParams();
  const router = useRouter();
  // 确保 courseId 存在且为数字
  const courseId = params.courseId ? parseInt(Array.isArray(params.courseId) ? params.courseId[0] : params.courseId) : null;

  // --- 状态 ---
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 交互状态
  const [isPressing, setIsPressing] = useState(false); // 是否正在按下
  const [isRevealed, setIsRevealed] = useState(false); // 是否已揭晓
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  // --- 初始化 ---
  useEffect(() => {
    if (!courseId) return;

    const loadData = async () => {
      setLoading(true);
      const res = await getQuestionsWithAnswers(courseId);
      if (res.success && res.data) {
        setQuestions(res.data);
      }
      setLoading(false);
    };
    loadData();
  }, [courseId]);

  // --- 交互逻辑 ---
  const startPress = () => {
    if (isRevealed) return; // 已经揭晓就不需要了
    
    setIsPressing(true);
    pressStartTimeRef.current = Date.now();

    // 设置定时器，0.3s 后揭晓
    timerRef.current = setTimeout(() => {
      setIsRevealed(true);
      setIsPressing(false);
      // 可以加震动反馈 (Haptic Feedback)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 300);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  // 切换题目时重置状态
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetState();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetState();
    }
  };

  const resetState = () => {
    setIsRevealed(false);
    setIsPressing(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  if (!courseId) {
      return <div>Invalid Course ID</div>;
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (questions.length === 0) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <div className="text-zinc-500">该课程暂无题目</div>
            <Button onClick={() => router.push('/recitation')}>返回课程列表</Button>
        </div>
      );
  }

  const currentQuestion = questions[currentIndex];
  
  // 防御性检查
  if (!currentQuestion) {
     return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <div className="text-2xl font-bold">All Done! 🎉</div>
            <Button onClick={() => router.push('/recitation')}>Back to Courses</Button>
        </div>
     );
  }

  const answer = currentQuestion.answerContent || "暂无答案";

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 select-none">
      {/* 顶部导航栏 */}
      <header className="w-full p-6 flex justify-between items-center text-zinc-400">
         <Button variant="ghost" size="sm" onClick={() => router.push('/recitation')} className="gap-2 text-zinc-500 hover:text-zinc-900">
           <ChevronLeft className="w-4 h-4" /> Courses
         </Button>
         <div className="font-bold text-zinc-800">KeyMantra Recitation</div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-12 pb-32 px-4">
        
        {/* 题目卡片 */}
        <div className="text-center space-y-6 max-w-2xl w-full">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-200 text-zinc-600 font-bold text-xl">
             {currentQuestion.no}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            {currentQuestion.title}
          </h1>
        </div>

        {/* 答案区域 (核心交互) */}
        <div 
          className="relative group cursor-pointer"
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
        >
          {/* 提示文字 */}
          {!isRevealed && (
             <div className={cn(
               "absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300",
               isPressing ? "opacity-0" : "opacity-100"
             )}>
               <span className="text-sm text-zinc-400 font-medium tracking-wider uppercase bg-zinc-50/80 px-3 py-1 rounded-full">
                 Hold to reveal
               </span>
             </div>
          )}

          {/* 答案容器 */}
          <div className={cn(
            "p-8 md:p-12 rounded-2xl bg-white shadow-sm border border-zinc-100 transition-all duration-500 max-w-3xl w-full text-center min-w-[300px] min-h-[160px] flex items-center justify-center",
            isPressing && "scale-[0.98] shadow-inner bg-zinc-50 border-zinc-200"
          )}>
            <p className={cn(
              "text-2xl md:text-4xl font-medium transition-all duration-700",
              // 模糊逻辑
              isRevealed 
                ? "blur-0 opacity-100 text-zinc-800" 
                : "blur-md opacity-40 text-zinc-400 select-none",
              // 按下过程中稍微清晰一点点，给点反馈
              isPressing && !isRevealed && "blur-sm opacity-60"
            )}>
              {answer}
            </p>
          </div>
          
          {/* 进度条指示器 (按下时显示) */}
          {isPressing && !isRevealed && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
               <div className="h-full bg-zinc-800 animate-[progress_0.3s_linear_forwards]" />
            </div>
          )}
        </div>

        {/* 底部切换栏 */}
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

