import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-zinc-50">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
          KeyMantra
        </h1>
        <p className="text-zinc-500">
          基于 Zinc 风格的现代化密钥管理系统
        </p>
      </div>
      
      <div className="flex gap-4">
        <Button>主按钮 (Primary)</Button>
        <Button variant="secondary">次级按钮 (Secondary)</Button>
        <Button variant="outline">轮廓按钮 (Outline)</Button>
      </div>
    </div>
  );
}