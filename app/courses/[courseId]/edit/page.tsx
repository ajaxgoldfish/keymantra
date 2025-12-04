"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getQuestionsWithAnswers, createQuestion, deleteQuestionFromCourse, getCourse } from "@/app/questions/actions";
import { cn } from "@/lib/utils";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId ? parseInt(Array.isArray(params.courseId) ? params.courseId[0] : params.courseId) : null;

  const [courseName, setCourseName] = useState("");
  const [questions, setQuestions] = useState<{id: number, no: number, title: string, answerContent: string | null}[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 添加新题目的状态
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const loadData = async () => {
    if (!courseId) return;
    setLoading(true);
    
    // 并行加载课程信息和题目列表
    const [courseRes, questionsRes] = await Promise.all([
      getCourse(courseId),
      getQuestionsWithAnswers(courseId)
    ]);

    if (courseRes.success && courseRes.data) {
      setCourseName(courseRes.data.name);
    }
    
    if (questionsRes.success && questionsRes.data) {
      setQuestions(questionsRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleAddQuestion = async () => {
    if (!courseId || !newTitle.trim() || !newAnswer.trim()) return;
    
    setAddLoading(true);
    const res = await createQuestion(courseId, newTitle, newAnswer);
    if (res.success) {
      setNewTitle("");
      setNewAnswer("");
      setIsAdding(false);
      loadData(); // Reload list
    } else {
      alert("添加失败，请重试");
    }
    setAddLoading(false);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!courseId || !confirm("确定要从本课程中移除此题目吗？")) return;
    
    const res = await deleteQuestionFromCourse(courseId, questionId);
    if (res.success) {
      loadData();
    } else {
      alert("删除失败，请重试");
    }
  };

  if (!courseId) return <div>Invalid Course ID</div>;
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-50 select-none">
      <header className="w-full p-6 flex justify-between items-center text-zinc-400 bg-white border-b border-zinc-100 sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => router.push('/courses')} className="gap-2 text-zinc-500 hover:text-zinc-900">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="font-bold text-zinc-800">{courseName} - Edit Questions</div>
        <div className="w-[70px]"></div> {/* Placeholder for balance */}
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center max-w-3xl">
         
         {/* 题目列表 */}
         <div className="w-full space-y-4 mb-8">
            {questions.length === 0 && !isAdding ? (
                <div className="text-center text-zinc-400 py-12 bg-white rounded-xl border border-dashed border-zinc-200">
                    暂无题目，点击下方按钮添加
                </div>
            ) : (
                questions.map((q, index) => (
                    <div key={q.id} className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all">
                        <div className="text-zinc-400 pt-1 cursor-move">
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="font-medium text-zinc-900">{q.title}</div>
                            <div className="text-sm text-zinc-500 font-mono">{q.answerContent}</div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteQuestion(q.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))
            )}
         </div>

         {/* 添加新题目表单 */}
         {isAdding ? (
             <div className="w-full bg-white p-6 rounded-xl border border-zinc-200 shadow-lg animate-in slide-in-from-bottom-4 fade-in">
                 <h3 className="font-bold text-zinc-800 mb-4">Add New Question</h3>
                 <div className="space-y-4">
                     <div>
                         <Input 
                            placeholder="Question / Word (e.g. Apple)" 
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            autoFocus
                         />
                     </div>
                     <div>
                         <Textarea 
                            placeholder="Answer / Definition" 
                            value={newAnswer}
                            onChange={e => setNewAnswer(e.target.value)}
                            className="resize-none"
                         />
                     </div>
                     <div className="flex gap-3 pt-2">
                         <Button 
                            className="flex-1" 
                            onClick={handleAddQuestion}
                            disabled={addLoading || !newTitle.trim() || !newAnswer.trim()}
                         >
                             {addLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                             Confirm Add
                         </Button>
                         <Button variant="outline" onClick={() => setIsAdding(false)} disabled={addLoading}>
                             Cancel
                         </Button>
                     </div>
                 </div>
             </div>
         ) : (
             <Button 
                size="lg" 
                className="gap-2 rounded-full shadow-lg hover:shadow-xl transition-all px-8"
                onClick={() => setIsAdding(true)}
             >
                 <Plus className="w-5 h-5" /> Add Question
             </Button>
         )}

      </main>
    </div>
  );
}
