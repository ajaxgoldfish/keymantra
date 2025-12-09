"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

/**
 * 同步用户信息到数据库
 * 如果用户不存在则创建，如果存在则跳过
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
 */
export async function syncUser() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return { success: false, error: "用户未登录" };
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
      return { success: true, userId, created: true };
    }

    // 用户已存在，可以选择更新信息（如果需要）
    // 这里暂时不更新，因为用户可能在 Clerk 中修改了信息，但数据库中的信息可能已经过时
    // 如果需要保持同步，可以添加 UPDATE 逻辑
    
    return { success: true, userId, created: false };
  } catch (error) {
    console.error("同步用户信息失败:", error);
    return { success: false, error: "同步用户信息失败" };
  }
}

