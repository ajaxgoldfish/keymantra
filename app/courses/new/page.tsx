"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCourse } from "@/app/questions/actions";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function NewCoursePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // 假设有 useToast hook，如果没有可以暂时忽略或自己实现简单的 alert
  // 既然项目中使用了 shadcn ui，很可能也有 toast，我先试着按标准写，如果没有报错就最好。
  // 检查是否有 toast 组件
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const res = await createCourse(name, description);
    setLoading(false);

    if (res.success) {
      router.push("/courses");
      router.refresh();
    } else {
      alert("创建失败，请重试");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-50 select-none">
      <header className="w-full p-6 flex justify-between items-center text-zinc-400">
        <Button variant="ghost" size="sm" onClick={() => router.push('/courses')} className="gap-2 text-zinc-500 hover:text-zinc-900">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="font-bold text-zinc-800">Add New Course</div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                Course Name
              </label>
              <Input
                id="name"
                placeholder="e.g. English Vocabulary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                placeholder="Briefly describe this course..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-50 border-zinc-200 focus:bg-white transition-colors min-h-[100px] resize-none"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

