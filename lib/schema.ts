import { pgTable, serial, text, integer, primaryKey } from "drizzle-orm/pg-core";

// 1. 题目表 (移除 no 字段)
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
});

// 2. 答案表
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
});

// 3. 题目-答案关联表
export const questionAnswers = pgTable("question_answers", {
  questionId: integer("question_id").notNull(),
  answerId: integer("answer_id").notNull(),
}, (t) => [
  primaryKey({ columns: [t.questionId, t.answerId] })
]);

// 4. 课程表
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

// 5. 课程-题目关联表 (包含排序字段)
export const courseQuestions = pgTable("course_questions", {
  courseId: integer("course_id").notNull(),
  questionId: integer("question_id").notNull(),
  // order: 这里的字段名如果用 'order' 可能会是数据库保留字，建议用 'sort_order'
  sortOrder: integer("sort_order").default(0).notNull(), 
}, (t) => [
  primaryKey({ columns: [t.courseId, t.questionId] })
]);