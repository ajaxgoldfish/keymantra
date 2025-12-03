"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getQuestions } from "./actions";

// 定义题目类型（也可以从 schema 导入推导）
type Question = {
  id: number;
  no: number;
  title: string;
};

export default function TypingPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetchQuestions = async () => {
    setLoading(true);
    const res = await getQuestions();
    setLoading(false);
    
    if (res.success && res.data) {
      setQuestions(res.data);
    } else {
      console.error("查询失败");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center py-12 gap-8 bg-zinc-50">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
          打字背诵
        </h1>
      </div>

      <Button onClick={handleFetchQuestions} disabled={loading}>
        {loading ? "加载中..." : "获取所有题目"}
      </Button>

      {/* 题目列表展示区域 */}
      <div className="w-full max-w-2xl px-4 space-y-4">
        {questions.length > 0 ? (
          questions.map((q) => (
            <div 
              key={q.id} 
              className="p-6 bg-white rounded-xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 font-bold text-sm">
                  {q.no}
                </span>
                <p className="text-lg text-zinc-800 font-medium">
                  {q.title}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-zinc-400 py-10">
            暂无数据，请点击按钮获取
          </div>
        )}
      </div>
    </div>
  );
}

