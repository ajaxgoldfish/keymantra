"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getQuestionsWithAnswers } from "@/app/typing/actions";
import { Loader2 } from "lucide-react";

// 类型定义
type QuestionData = {
  id: number;
  no: number;
  title: string;
  answerContent: string | null;
};

// 单词结构，用于渲染
type WordPart = {
  text: string;
  isSpace: boolean;
  chars: string[];
};

export default function DictationPage() {
  // 状态管理
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<"idle" | "correct" | "incorrect">("idle");
  
  // 当前题目和答案
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion?.answerContent || "";

  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化加载数据
  useEffect(() => {
    const loadData = async () => {
      const res = await getQuestionsWithAnswers();
      if (res.success && res.data && res.data.length > 0) {
        setQuestions(res.data);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // 聚焦输入框
  useEffect(() => {
    if (!loading && currentQuestion) {
      inputRef.current?.focus();
    }
  }, [loading, currentQuestion]);

  // 解析答案为结构化数据（用于渲染占位符）
  const parseAnswer = (answer: string): WordPart[] => {
    if (!answer) return [];
    // 简单按空格分割，保留空格逻辑需要精细处理
    // 这里简化：假设单词之间用空格隔开，我们把整个句子拆成字符
    // 但为了实现"按单词空格切换"，我们需要识别单词边界
    
    const parts: WordPart[] = [];
    const words = answer.split(/(\s+)/); // 保留分隔符
    
    words.forEach(word => {
      if (word.match(/^\s+$/)) {
        parts.push({ text: word, isSpace: true, chars: word.split('') });
      } else {
        parts.push({ text: word, isSpace: false, chars: word.split('') });
      }
    });
    return parts;
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    // 限制输入长度不超过答案长度
    if (newVal.length <= currentAnswer.length) {
        setInputValue(newVal);
        setResult("idle"); // 重置状态
    }
  };

  // 处理回车或空格提交逻辑
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 如果按下了回车，或者输入长度已满且按下了空格(对于最后一个单词)
    if (e.key === "Enter") {
      checkAnswer();
    }
  };

  const checkAnswer = () => {
    if (inputValue.trim() === currentAnswer.trim()) {
      setResult("correct");
      // 可以在这里自动切换下一题
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
            nextQuestion();
        }
      }, 1000);
    } else {
      setResult("incorrect");
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setInputValue("");
      setResult("idle");
    }
  };

  // 渲染逻辑
  const renderPlaceholder = () => {
    if (!currentAnswer) return null;
    
    const parts = parseAnswer(currentAnswer);
    let charGlobalIndex = 0; // 全局字符索引，用于匹配输入

    return (
      <div className="flex flex-wrap gap-2 text-2xl font-mono items-end min-h-[60px]" onClick={() => inputRef.current?.focus()}>
        {parts.map((part, pIndex) => {
          if (part.isSpace) {
            // 空格部分，对应全局索引增加，但不渲染下划线，只渲染空白
            charGlobalIndex += part.text.length;
            return <div key={pIndex} className="w-4"></div>;
          }

          return (
            <div key={pIndex} className="flex gap-1">
              {part.chars.map((char, cIndex) => {
                const currentIdx = charGlobalIndex++;
                const inputChar = inputValue[currentIdx] || "";
                const isChinese = /[\u4e00-\u9fa5]/.test(char);
                
                // 占位符逻辑：
                // 如果有输入，显示输入字符
                // 如果没输入，显示下划线（中文显示两个短横线或一个长横线）
                
                return (
                  <div key={cIndex} className="flex flex-col items-center w-[1ch]">
                    {/* 字符显示层 */}
                    <span className={`
                        ${inputChar ? 'text-black' : 'text-transparent'} 
                        border-b-2 
                        ${inputChar ? 'border-transparent' : 'border-zinc-300'}
                        transition-colors
                    `}>
                      {inputChar || (isChinese ? "　" : char)} {/* 没输入时用透明字符占位保持宽度 */}
                    </span>
                    
                    {/* 下划线视觉层 (可选，如果上面 border-b 足够就不需要) */}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!currentQuestion) {
    return <div className="flex h-screen items-center justify-center">没有题目数据</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center py-20 gap-10 bg-zinc-50">
      
      {/* 题目展示 */}
      <div className="text-center space-y-4">
        <div className="text-sm text-zinc-500">Question {currentQuestion.no}</div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
          {currentQuestion.title}
        </h1>
      </div>

      {/* 输入区域 */}
      <div className="relative w-full max-w-3xl px-8 py-12 bg-white rounded-2xl shadow-sm border border-zinc-100">
        
        {/* 隐形输入框，负责接收所有键盘事件 */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
          autoComplete="off"
          autoFocus
        />

        {/* 自定义渲染层 */}
        <div className="flex justify-center">
             {renderPlaceholder()}
        </div>

        {/* 结果提示 */}
        {result !== "idle" && (
            <div className={`mt-8 text-center font-bold text-lg ${result === "correct" ? "text-green-600" : "text-red-500"}`}>
                {result === "correct" ? "Correct! 🎉" : "Try Again"}
            </div>
        )}

      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setResult("idle")}>重置</Button>
        <Button onClick={checkAnswer}>检查答案 (Enter)</Button>
      </div>
      
      <div className="text-zinc-400 text-sm">
         按空格键可直接跳转到下一个单词逻辑（需配合分词优化）
      </div>
    </div>
  );
}
