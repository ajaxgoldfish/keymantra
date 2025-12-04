"use server";

import { db } from "@/lib/db";
import { questions, answers, questionAnswers, courseQuestions, courses } from "@/lib/schema";
import { eq, asc, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCourses() {
  try {
    const result = await db.select().from(courses).orderBy(asc(courses.id));
    return { success: true, data: result };
  } catch (error) {
    console.error("获取课程失败:", error);
    return { success: false, error: "获取课程失败" };
  }
}

export async function getCourse(courseId: number) {
  try {
    const result = await db.select().from(courses).where(eq(courses.id, courseId));
    if (result.length === 0) return { success: false, error: "课程不存在" };
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("获取课程详情失败:", error);
    return { success: false, error: "获取课程详情失败" };
  }
}

export async function createCourse(name: string, description: string | null) {
  try {
    await db.insert(courses).values({
      name,
      description,
    });
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("创建课程失败:", error);
    return { success: false, error: "创建课程失败" };
  }
}

export async function deleteCourse(courseId: number) {
  try {
    // 1. 删除课程关联的题目关系 (可选：是否要级联删除题目本身？目前只删除关联)
    await db.delete(courseQuestions).where(eq(courseQuestions.courseId, courseId));
    
    // 2. 删除课程
    await db.delete(courses).where(eq(courses.id, courseId));
    
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("删除课程失败:", error);
    return { success: false, error: "删除课程失败" };
  }
}

export async function getQuestionsWithAnswers(courseId: number) {
  try {
    // 从课程关联表中查询，并按 sortOrder 排序
    const result = await db
      .select({
        id: questions.id,
        no: courseQuestions.sortOrder, // 将 sortOrder 作为 no 返回给前端，保持兼容
        title: questions.title,
        answerContent: answers.content,
      })
      .from(courseQuestions)
      .innerJoin(questions, eq(courseQuestions.questionId, questions.id))
      .leftJoin(questionAnswers, eq(questions.id, questionAnswers.questionId))
      .leftJoin(answers, eq(questionAnswers.answerId, answers.id))
      .where(eq(courseQuestions.courseId, courseId))
      .orderBy(asc(courseQuestions.sortOrder));
    
    return { success: true, data: result };
  } catch (error) {
    console.error("获取题目失败:", error);
    return { success: false, error: "获取题目失败" };
  }
}

export async function createQuestion(courseId: number, title: string, answerContent: string) {
  try {
    return await db.transaction(async (tx) => {
      // 1. 创建题目
      const [newQuestion] = await tx.insert(questions).values({ title }).returning({ id: questions.id });
      
      // 2. 创建答案
      const [newAnswer] = await tx.insert(answers).values({ content: answerContent }).returning({ id: answers.id });
      
      // 3. 关联题目-答案
      await tx.insert(questionAnswers).values({
        questionId: newQuestion.id,
        answerId: newAnswer.id,
      });

      // 4. 获取当前课程最大序号
      const maxOrderResult = await tx
        .select({ maxOrder: max(courseQuestions.sortOrder) })
        .from(courseQuestions)
        .where(eq(courseQuestions.courseId, courseId));
      
      const nextOrder = (maxOrderResult[0]?.maxOrder ?? 0) + 1;

      // 5. 关联题目-课程
      await tx.insert(courseQuestions).values({
        courseId: courseId,
        questionId: newQuestion.id,
        sortOrder: nextOrder,
      });

      revalidatePath(`/courses/${courseId}/edit`);
      return { success: true };
    });
  } catch (error) {
    console.error("创建题目失败:", error);
    return { success: false, error: "创建题目失败" };
  }
}

export async function deleteQuestionFromCourse(courseId: number, questionId: number) {
  try {
    await db.delete(courseQuestions)
      .where(
        eq(courseQuestions.courseId, courseId) && 
        eq(courseQuestions.questionId, questionId)
      );
    revalidatePath(`/courses/${courseId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("删除题目失败:", error);
    return { success: false, error: "删除题目失败" };
  }
}
