import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (students)
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // No grade field for adult students
  grade: text("grade").default("adult").notNull(),
  currentJuz: integer("current_juz").notNull(),
  currentSurah: text("current_surah"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mistake types enum
export const mistakeTypes = ["tajweed", "word", "stuck"] as const;
export type MistakeType = typeof mistakeTypes[number];

// Mistake type schema
export const mistakeTypeSchema = z.enum(mistakeTypes);

// Mistakes table
export const mistakes = pgTable("mistakes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  studentId: integer("student_id").notNull(),
  type: text("type").notNull(), // One of the mistakeTypes
  surah: text("surah").notNull(),
  ayah: integer("ayah").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  student1Id: integer("student1_id").notNull(),
  student2Id: integer("student2_id").notNull(),
  surahStart: text("surah_start").notNull(),
  ayahStart: integer("ayah_start").notNull(),
  surahEnd: text("surah_end").notNull(),
  ayahEnd: integer("ayah_end").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertMistakeSchema = createInsertSchema(mistakes).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

// Select types
export type Student = typeof students.$inferSelect;
export type Mistake = typeof mistakes.$inferSelect;
export type Session = typeof sessions.$inferSelect;

// Insert types
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertMistake = z.infer<typeof insertMistakeSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Extended types for frontend use
export type SessionWithDetails = Session & {
  student1: Student;
  student2: Student;
  mistakeCount: number;
};

export type StudentWithStats = Student & {
  sessionCount: number;
  averageMistakes: number;
  mostCommonMistakeType: MistakeType | null;
};

export type MistakeWithDetails = Mistake & {
  student: Student;
  session: Session;
};
