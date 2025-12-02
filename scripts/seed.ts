import "dotenv/config";
import { db } from "@/lib/db";
import { questions } from "@/lib/schema";

async function seed() {
  try {
    console.log("🌱 开始插入测试数据...");

    // 插入两条测试数据
    const result = await db.insert(questions).values([
      {
        no: 1,
        title: "这是第一条测试题目",
      },
      {
        no: 2,
        title: "这是第二条测试题目",
      },
    ]).returning();

    console.log("✅ 成功插入测试数据:");
    result.forEach((row) => {
      console.log(`  - ID: ${row.id}, No: ${row.no}, Title: ${row.title}`);
    });
  } catch (error) {
    console.error("❌ 插入数据失败:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();

