"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getCourses, deleteCourse } from "@/app/questions/actions";
import { ChevronLeft, Loader2, PenTool, BookOpen, Plus, MoreVertical, Trash2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CoursesPage() {
  const [coursesList, setCoursesList] = useState<{id: number, name: string, description: string | null}[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadCourses = async () => {
    setLoading(true);
    const res = await getCourses();
    if (res.success && res.data) {
      setCoursesList(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleDelete = async (courseId: number) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      const res = await deleteCourse(courseId);
      if (res.success) {
        loadCourses(); // Reload list
      } else {
        alert("Failed to delete course");
      }
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
     <div className="min-h-screen w-full flex flex-col bg-zinc-50 select-none">
       <header className="w-full p-6 flex items-center justify-between text-zinc-400 relative">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2 text-zinc-500 hover:text-zinc-900 z-10">
              <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="font-bold text-zinc-800">KeyMantra Courses</div>
          </div>

          <Button size="sm" onClick={() => router.push('/courses/new')} className="gap-2 z-10">
              <Plus className="w-4 h-4" /> Add Course
          </Button>
       </header>
       <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Select a Course</h1>
          {coursesList.length === 0 ? (
              <div className="text-center text-zinc-500">暂无课程数据</div>
          ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
                  {coursesList.map(course => (
                      <div 
                          key={course.id}
                          className="flex flex-col p-8 bg-white rounded-2xl shadow-sm border border-zinc-200 transition-all hover:shadow-md relative group"
                      >
                          {/* 右上角更多操作按钮 */}
                          <div className="absolute top-4 right-4 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-full hover:bg-zinc-100">
                                  <MoreVertical className="h-4 w-4 text-zinc-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => console.log("Manage questions clicked")}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  <span>Manage Questions</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(course.id)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Course</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex-1">
                            <div className="text-xl font-bold text-zinc-900 mb-3 pr-8">
                                {course.name}
                            </div>
                            {course.description && (
                                <div className="text-zinc-500 text-sm line-clamp-3 leading-relaxed mb-6">
                                    {course.description}
                                </div>
                            )}
                          </div>
                          
                          <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-100">
                             <Button 
                                className="flex-1 gap-2" 
                                variant="outline"
                                onClick={() => router.push(`/courses/${course.id}/recitation`)}
                             >
                                <BookOpen className="w-4 h-4" /> 默背
                             </Button>
                             <Button 
                                className="flex-1 gap-2" 
                                onClick={() => router.push(`/courses/${course.id}/dictation`)}
                             >
                                <PenTool className="w-4 h-4" /> 默写
                             </Button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
       </main>
     </div>
  );
}
