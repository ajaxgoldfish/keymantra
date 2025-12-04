"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getCourses } from "@/app/typing/actions";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RecitationCourseSelectPage() {
  const [coursesList, setCoursesList] = useState<{id: number, name: string, description: string | null}[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
     <div className="min-h-screen w-full flex flex-col bg-zinc-50 select-none">
       <header className="w-full p-6 flex justify-between items-center text-zinc-400">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2 text-zinc-500 hover:text-zinc-900">
              <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="font-bold text-zinc-800">KeyMantra Recitation</div>
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
                          onClick={() => router.push(`/recitation/${course.id}`)}
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
