import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  no: integer("no").notNull(),
  title: text("title").notNull(),
});

