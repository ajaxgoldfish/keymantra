import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

const isProtectedRoute = createRouteMatcher(['/courses(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth.protect();
    
    // 用户登录成功后，同步用户信息到数据库（仅在新用户首次访问时）
    if (userId) {
      try {
        const user = await currentUser();
        if (user) {
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
          }
        }
      } catch (error) {
        // 静默处理错误，不影响用户访问
        console.error("同步用户信息失败:", error);
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
