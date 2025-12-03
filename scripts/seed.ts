import "dotenv/config";
import { sql } from "drizzle-orm"; // 引入 sql 工具
import { db } from "@/lib/db";
import { questions, answers, questionAnswers } from "@/lib/schema"; // 引入 questionAnswers

async function seed() {
  try {
    console.log("🗑️  正在清空旧数据...");

    // 清空表 (注意顺序：先清空关联表，再清空主表，避免外键约束报错)
    await db.execute(sql`TRUNCATE TABLE ${questionAnswers} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${questions} RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${answers} RESTART IDENTITY CASCADE`);

    console.log("🌱 开始插入测试数据...");

    // 1. 插入题目数据
    const questionsResult = await db.insert(questions).values([
      { id: 1, no: 1, title: "这是第一条测试题目" },
      { id: 2, no: 2, title: "这是第二条测试题目" },
    ]).returning();

    console.log("✅ 题目数据插入成功");

    // 2. 插入答案数据
    const answersResult = await db.insert(answers).values([
      { id: 1, content: "My name is apple" },
      { id: 2, content: "My name is apple" },
    ]).returning();

    console.log("✅ 答案数据插入成功");

    // 3. 插入关联数据 (题目1对应答案1，题目2对应答案2)
    const relationResult = await db.insert(questionAnswers).values([
      { questionId: 1, answerId: 1 },
      { questionId: 2, answerId: 2 },
    ]).returning();

    console.log("✅ 关联数据插入成功:");
    relationResult.forEach((row) => {
      console.log(`  - Question: ${row.questionId} <-> Answer: ${row.answerId}`);
    });

  } catch (error) {
    console.error("❌ 插入数据失败:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();

