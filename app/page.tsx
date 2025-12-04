import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-zinc-50">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
          KeyMantra
        </h1>
        <p className="text-zinc-500">
          熟练，才会上瘾
        </p>
      </div>
      
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/questions">获取所有题目</Link>
        </Button>
        <Button asChild>
          <Link href="/courses">默写默背</Link>
        </Button>
      </div>
    </div>
  );
}
