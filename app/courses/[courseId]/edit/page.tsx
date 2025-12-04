"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditCoursePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex flex-col bg-zinc-50 select-none">
      <header className="w-full p-6 flex justify-between items-center text-zinc-400">
        <Button variant="ghost" size="sm" onClick={() => router.push('/courses')} className="gap-2 text-zinc-500 hover:text-zinc-900">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="font-bold text-zinc-800">Edit Course</div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
         <div className="text-zinc-500">编辑界面开发中...</div>
      </main>
    </div>
  );
}

