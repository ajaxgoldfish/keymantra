"use server";

import { db } from "@/lib/db";
import { questions, answers, questionAnswers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getQuestionsWithAnswers() {
  try {
    const result = await db
      .select({
        id: questions.id,
        no: questions.no,
        title: questions.title,
        answerContent: answers.content,
      })
      .from(questions)
      .leftJoin(questionAnswers, eq(questions.id, questionAnswers.questionId))
      .leftJoin(answers, eq(questionAnswers.answerId, answers.id));
    
    // 转换数据结构，把相同题目的多个答案聚合在一起（如果有的话）
    // 这里简化处理，假设每个题目对应一行记录
    return { success: true, data: result };
  } catch (error) {
    console.error("获取题目失败:", error);
    return { success: false, error: "获取题目失败" };
  }
}
