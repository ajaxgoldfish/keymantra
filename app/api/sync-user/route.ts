import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: "用户未登录" }, { status: 401 });
    }

    const userId = user.id;
    const email = user.emailAddresses[0]?.emailAddress || "";
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.lastName || user.username || email.split("@")[0] || "User";

    // 检查用户是否已存在
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (existingUser.length === 0) {
      // 用户不存在，创建新用户
      await db.insert(users).values({
        id: userId,
        email: email,
        name: name,
      });
      return NextResponse.json({ success: true, userId, created: true });
    }

    return NextResponse.json({ success: true, userId, created: false });
  } catch (error) {
    console.error("同步用户信息失败:", error);
    return NextResponse.json({ success: false, error: "同步用户信息失败" }, { status: 500 });
  }
}

