import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, answers, questionAnswers, courses, courseQuestions } from "@/lib/schema";

async function seed() {
  try {
    console.log("🗑️  正在清空旧数据...");

    // 清空表 (注意顺序)
    await db.execute(sql`TRUNCATE TABLE ${courseQuestions} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${questionAnswers} CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${questions} RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${answers} RESTART IDENTITY CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ${courses} RESTART IDENTITY CASCADE`);

    console.log("🌱 开始插入测试数据...");

    // 1. 插入题目数据 (移除 no)
    await db.insert(questions).values([
      { id: 1, title: "这是第一条测试题目" },
      { id: 2, title: "这是第二条测试题目" },
    ]);
    console.log("✅ 题目数据插入成功");

    // 2. 插入答案数据
    await db.insert(answers).values([
      { id: 1, content: "My name is apple" },
      { id: 2, content: "My name is apple" },
    ]);
    console.log("✅ 答案数据插入成功");

    // 3. 插入题目-答案关联
    await db.insert(questionAnswers).values([
      { questionId: 1, answerId: 1 },
      { questionId: 2, answerId: 2 },
    ]);
    console.log("✅ 题目-答案关联插入成功");

    // 4. 插入课程数据
    await db.insert(courses).values([
      { id: 1, name: "默认课程", description: "系统默认生成的测试课程" }
    ]);
    console.log("✅ 课程数据插入成功");

    // 5. 插入课程-题目关联 (包含排序)
    await db.insert(courseQuestions).values([
      { courseId: 1, questionId: 1, sortOrder: 1 },
      { courseId: 1, questionId: 2, sortOrder: 2 },
    ]);
    console.log("✅ 课程-题目关联插入成功");

  } catch (error) {
    console.error("❌ 插入数据失败:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
