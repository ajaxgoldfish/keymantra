"use server";

import { db } from "@/lib/db";
import { questions } from "@/lib/schema";

export async function getQuestions() {
  try {
    const allQuestions = await db.select().from(questions);
    return { success: true, data: allQuestions };
  } catch (error) {
    console.error("获取题目失败:", error);
    return { success: false, error: "获取题目失败" };
  }
}
