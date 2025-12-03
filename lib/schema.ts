import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  no: integer("no").notNull(),
  title: text("title").notNull(),
});

// 新增 answers 表
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(), // 假设字段名为 content
});

