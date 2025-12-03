"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getQuestionsWithAnswers } from "./actions";

// 定义新的数据类型
type QuestionWithAnswer = {
  id: number;
  no: number;
  title: string;
  answerContent: string | null;
};

export default function TypingPage() {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetchQuestions = async () => {
    setLoading(true);
    const res = await getQuestionsWithAnswers(); // 调用新的 action
    setLoading(false);
    
    if (res.success && res.data) {
      setQuestions(res.data);
    } else {
      console.error("查询失败");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-zinc-50">
      {/* 顶部导航栏 */}
      <header className="w-full p-6 flex justify-between items-center text-zinc-400">
         <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2 text-zinc-500 hover:text-zinc-900">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
           Back
         </Button>
      </header>

      <div className="flex flex-col items-center gap-8 pb-12 w-full">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
              打字背诵
            </h1>
          </div>

          <Button onClick={handleFetchQuestions} disabled={loading}>
            {loading ? "加载中..." : "获取所有题目及答案"}
          </Button>

          {/* 题目列表展示区域 */}
          <div className="w-full max-w-2xl px-4 space-y-4">
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <div 
                  key={index} 
                  className="p-6 bg-white rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 font-bold text-sm shrink-0">
                      {q.no}
                    </span>
                    <p className="text-lg text-zinc-800 font-medium">
                      {q.title}
                    </p>
                  </div>
                  
                  {/* 显示答案 */}
                  {q.answerContent && (
                    <div className="ml-12 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                      <span className="font-semibold mr-2">答案:</span>
                      {q.answerContent}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-400 py-10">
                暂无数据，请点击按钮获取
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
