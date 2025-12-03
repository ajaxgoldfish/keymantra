import { pgTable, serial, text, integer, primaryKey } from "drizzle-orm/pg-core"; // 引入 primaryKey

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  no: integer("no").notNull(),
  title: text("title").notNull(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
});

// 新增关联表
export const questionAnswers = pgTable("question_answers", {
  questionId: integer("question_id").references(() => questions.id).notNull(),
  answerId: integer("answer_id").references(() => answers.id).notNull(),
}, (t) => [
  primaryKey({ columns: [t.questionId, t.answerId] }) // 改为返回数组
]);