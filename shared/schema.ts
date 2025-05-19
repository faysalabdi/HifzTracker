import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role enum
export const userRoles = ["student", "teacher"] as const;
export type UserRole = typeof userRoles[number];
export const userRoleSchema = z.enum(userRoles);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").$type<UserRole>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  // No grade field for adult students
  grade: text("grade").default("adult").notNull(),
  currentJuz: integer("current_juz").notNull(),
  completedJuz: text("completed_juz").default("[]"), // Stores array of completed juz as JSON string
  currentSurah: text("current_surah"),
  currentAyah: integer("current_ayah").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teacher-student relationship table
export const teacherStudents = pgTable("teacher_students", {
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  studentId: integer("student_id").notNull().references(() => students.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.teacherId, t.studentId] }),
}));

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

// Peer revision sessions table
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

// Teacher lessons table - for tracking new lessons with students
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  studentId: integer("student_id").notNull().references(() => students.id),
  surahStart: text("surah_start").notNull(),
  ayahStart: integer("ayah_start").notNull(),
  surahEnd: text("surah_end").notNull(),
  ayahEnd: integer("ayah_end").notNull(),
  notes: text("notes"),
  progress: text("progress").default("Not Started").notNull(), // "Not Started", "In Progress", "Completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lesson mistakes table - for tracking mistakes during teacher lessons
export const lessonMistakes = pgTable("lesson_mistakes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  studentId: integer("student_id").notNull().references(() => students.id),
  type: text("type").notNull(), // One of the mistakeTypes
  surah: text("surah").notNull(),
  ayah: integer("ayah").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    role: userRoleSchema,
  });

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherStudentSchema = createInsertSchema(teacherStudents);

export const insertMistakeSchema = createInsertSchema(mistakes).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
});

export const insertLessonMistakeSchema = createInsertSchema(lessonMistakes).omit({
  id: true,
  createdAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type TeacherStudent = typeof teacherStudents.$inferSelect;
export type Mistake = typeof mistakes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type LessonMistake = typeof lessonMistakes.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertTeacherStudent = z.infer<typeof insertTeacherStudentSchema>;
export type InsertMistake = z.infer<typeof insertMistakeSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertLessonMistake = z.infer<typeof insertLessonMistakeSchema>;

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
  teacher?: User;
};

export type MistakeWithDetails = Mistake & {
  student: Student;
  session: Session;
};

export type LessonWithDetails = Lesson & {
  teacher: User;
  student: Student;
  mistakeCount: number;
};

export type LessonMistakeWithDetails = LessonMistake & {
  lesson: Lesson;
  student: Student;
};
