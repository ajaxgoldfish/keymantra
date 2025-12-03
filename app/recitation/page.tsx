"use client";

import { Button } from "@/components/ui/button";

export default function RecitationPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50">
      {/* 顶部导航栏 */}
      <header className="w-full p-6 flex justify-between items-center text-zinc-400">
         <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2 text-zinc-500 hover:text-zinc-900">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
           Back
         </Button>
         <div className="font-bold text-zinc-800">KeyMantra Recitation</div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
          默背
        </h1>
        <p className="text-zinc-500">Coming Soon...</p>
      </div>
    </div>
  );
}

