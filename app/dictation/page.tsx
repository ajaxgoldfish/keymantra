"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getQuestionsWithAnswers } from "@/app/typing/actions";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
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
// 简单策略：根据字符数估算，或者用更精细的字典
const getWordWidthStyle = (text: string, placeholder: string) => {
  // 找出较长的那个字符串作为基准宽度
  const target = text.length > placeholder.length ? text : placeholder;
  
  // 简单的估算：普通字母 0.6ch，宽字母(m, w) 0.9ch，窄字母(i, l) 0.3ch
  // 也可以直接用 ch 单位，更简单
  // 这里我们给每个字符分配大约 0.8em 的空间，外加一点 padding
  const length = target.length;
  // 最小宽度 2em
  const width = Math.max(2, length * 0.7 + 0.5); 
  
  return { width: `${width}em` };
};


// --- 核心组件: DictationInput ---
interface DictationInputProps {
  answer: string;
  onComplete?: (isCorrect: boolean) => void;
  key?: string | number; // 用于重置
}

const DictationInput = ({ answer, onComplete }: DictationInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);
  
  const [inputValue, setInputValue] = useState("");
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1. 解析答案为单词数组
  const correctWords = useMemo(() => {
    return answer.split(/\s+/).filter(w => w.length > 0);
  }, [answer]);

  // 2. 计算当前单词状态
  const words: WordItem[] = useMemo(() => {
    // 根据空格分割用户输入
    // 注意：保留空字符串以便光标在空格后能跳到下一个单词
    // 这里的逻辑比较微妙，需要匹配输入框的空格逻辑
    
    // 策略：
    // 用户的 inputValue 可能像 "hello wo" -> ["hello", "wo"]
    // 也可能像 "hello  " -> ["hello", "", ""]
    
    const userWords = inputValue.split(/\s/); 
    
    return correctWords.map((correctText, index) => {
      const userInput = userWords[index] || "";
      
      let status: WordStatus = 'normal';
      
      if (isSubmitted) {
        // 提交后只看对错
        // 忽略大小写和标点
        const cleanUser = userInput.trim().toLowerCase().replace(/[.,?!]/g, "");
        const cleanCorrect = correctText.toLowerCase().replace(/[.,?!]/g, "");
        status = cleanUser === cleanCorrect ? 'correct' : 'incorrect';
      } else {
        // 未提交时，高亮当前编辑的单词
        if (index === activeWordIndex) {
          status = 'active';
        }
      }

      return {
        index,
        correctText,
        userInput,
        status
      };
    });
  }, [correctWords, inputValue, activeWordIndex, isSubmitted]);

  // 3. 处理输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);

    // 计算光标位置对应的单词索引
    // 通过统计光标前的空格数量来确定当前是第几个单词
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newVal.slice(0, cursorPosition);
    // 空格数量即为当前单词索引 (假设单空格分隔)
    // 如果有连续空格，可能需要更复杂的逻辑，这里假设标准输入
    const spacesCount = textBeforeCursor.split(/\s/).length - 1;
    
    // 限制索引不超过单词总数
    setActiveWordIndex(Math.min(spacesCount, correctWords.length - 1));
    
    // 重置提交状态（如果用户修改了输入）
    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  // 4. 光标同步 (点击/移动光标时更新 activeWordIndex)
  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement, Event>) => {
    const target = e.currentTarget;
    const cursorPosition = target.selectionStart || 0;
    const textBeforeCursor = target.value.slice(0, cursorPosition);
    const spacesCount = textBeforeCursor.split(/\s/).length - 1;
    setActiveWordIndex(Math.min(spacesCount, correctWords.length - 1));
  };

  // 5. 提交逻辑
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isComposing.current) return; // IME 输入中不提交
      
      e.preventDefault(); // 防止换行
      submit();
    }
  };

  const submit = () => {
    setIsSubmitted(true);
    // 简单校验：所有单词都正确才算对
    const isAllCorrect = words.every(w => {
        const cleanUser = w.userInput.trim().toLowerCase().replace(/[.,?!]/g, "");
        const cleanCorrect = w.correctText.toLowerCase().replace(/[.,?!]/g, "");
        return cleanUser === cleanCorrect;
    });
    
    if (onComplete) {
        onComplete(isAllCorrect);
    }
  };

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto p-8 min-h-[200px]">
      {/* --- 逻辑层: 透明 Input --- */}
      <input
        ref={inputRef}
        type="text"
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10 bg-transparent text-transparent caret-transparent p-8 font-mono text-lg" // padding 需要匹配视觉层
        value={inputValue}
        onChange={handleInputChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => isComposing.current = true}
        onCompositionEnd={() => isComposing.current = false}
        autoComplete="off"
        spellCheck={false}
      />

      {/* --- 视觉层: 单词渲染 --- */}
      {/* 必须要加 pointer-events-none，让点击穿透到 input 上 */}
      <div className="relative z-0 flex flex-wrap justify-center gap-x-4 gap-y-8 pointer-events-none">
        {words.map((word) => (
          <div
            key={word.index}
            className={cn(
              "relative flex items-end justify-center h-[4rem] border-b-2 transition-all duration-200",
              // 动态宽度样式在 style 中设置
              
              // 状态样式
              word.status === 'normal' && "border-zinc-200 text-zinc-400",
              word.status === 'active' && "border-fuchsia-500 text-fuchsia-500 scale-110",
              word.status === 'correct' && "border-green-500 text-green-600",
              word.status === 'incorrect' && "border-red-500 text-red-500 animate-in fade-in shake", // 需要定义 shake 动画
            )}
            style={getWordWidthStyle(word.correctText, word.userInput)}
          >
            {/* 显示的文字 */}
            <span className="text-[3em] leading-none font-sans pb-1">
              {/* 如果用户没输入，可以显示占位符或空 */}
              {/* 这里的逻辑：显示用户输入的内容。如果没输入且不是当前激活，可以不显示 */}
              {word.userInput}
            </span>

            {/* 占位提示（可选：显示正确长度的下划线或阴影字符） */}
            {/* 比如：当用户未输入时，显示浅色的正确单词轮廓？或者什么都不显示 */}
          </div>
        ))}
      </div>
      
      {/* 辅助提示 */}
      <div className="absolute bottom-2 right-4 text-zinc-300 text-sm pointer-events-none">
         {activeWordIndex + 1} / {correctWords.length}
      </div>
    </div>
  );
};


// --- 页面容器 ---
export default function DictationPage() {
  const [questions, setQuestions] = useState<{id: number, title: string, answerContent: string | null}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState<'answering' | 'result'>('answering');

  useEffect(() => {
    const loadData = async () => {
      const res = await getQuestionsWithAnswers();
      if (res.success && res.data) {
        setQuestions(res.data);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleComplete = (isCorrect: boolean) => {
      if (isCorrect) {
          // 稍微延迟后自动下一题
          setTimeout(() => {
              if (currentIndex < questions.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                  // 由于 input 是内部状态，切换 key 可以强制重置组件
              } else {
                  alert("恭喜！所有题目已完成！");
              }
          }, 1000);
      }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (questions.length === 0) return <div className="flex h-screen items-center justify-center">暂无题目</div>;

  const currentQuestion = questions[currentIndex];
  // 确保有答案，否则无法进行
  const currentAnswer = currentQuestion.answerContent || "No Answer Provided";

  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-50">
      {/* 顶部导航栏 */}
      <header className="w-full p-6 flex justify-between items-center text-zinc-400">
         <div className="font-bold text-zinc-800">KeyMantra Dictation</div>
         <div>{currentIndex + 1} / {questions.length}</div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col items-center justify-center gap-12 pb-32">
        
        {/* 题目展示 */}
        <div className="text-center space-y-4 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">
              {currentQuestion.title}
            </h1>
            <p className="text-zinc-500">
                Listen (Look) and type the correct answer.
            </p>
        </div>

        {/* 输入组件 */}
        {/* 使用 key={currentIndex} 确保切换题目时 Input 组件完全重置 */}
        <DictationInput 
            key={currentIndex} 
            answer={currentAnswer} 
            onComplete={handleComplete}
        />
        
        {/* 操作提示 */}
        <div className="flex gap-4 text-zinc-400 text-sm">
            <span className="flex items-center gap-1"><span className="border rounded px-1 bg-white">Space</span> next word</span>
            <span className="flex items-center gap-1"><span className="border rounded px-1 bg-white">Enter</span> check</span>
        </div>

      </main>
    </div>
  );
}
