import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import session from "express-session";
import { 
  insertStudentSchema, 
  insertSessionSchema, 
  insertMistakeSchema, 
  mistakeTypeSchema, 
  insertUserSchema,
  UserRole
} from "@shared/schema";
import { updateCompletedJuz, getSurahJuz } from "./utils";

// Import constants from the client for tracking surah progress
import { surahs } from "../client/src/lib/constants";

// Session augmentation for TypeScript
declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      username: string;
      name: string;
      role: UserRole;
    };
  }
}

// Middleware to check if a user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Middleware to check user role
const hasRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.user && req.session.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden - Insufficient permissions" });
    }
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup sessions
  app.use(session({
    secret: 'hifz-tracker-secret', // In production, use environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,  // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true, 
      sameSite: 'lax'
    }
  }));
  
  // Add session debug middleware
  app.use((req, res, next) => {
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", req.session);
    next();
  });
  
  // API prefix
  const apiPrefix = "/api";
  
  // Authentication Routes
  app.post(`${apiPrefix}/auth/login`, async (req, res) => {
    try {
      const { username, role } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Log attempt
      console.log("Login attempt for:", username, "with role:", role);
      
      let user = await storage.getUserByUsername(username);
      
      // For demo, auto-create user if not exists
      if (!user) {
        // Generate a name based on the username
        let name = username;
        
        // Make specific user names for demo users
        if (username === "teacher1") {
          name = "Ustadh Ahmed";
        } else if (username === "teacher2") {
          name = "Ustadha Fatima";
        } else if (username === "student1") {
          name = "Yusuf Ali";
        } else if (username === "student2") {
          name = "Aisha Ahmed";
        } else {
          name = username.charAt(0).toUpperCase() + username.slice(1);
        }
        
        // Create new user with the provided role or default to student
        const userRole = (role === "teacher" || role === "student") ? role : "student";
        
        console.log("Creating new user:", name, "with role:", userRole);
        
        user = await storage.createUser({
          username,
          name,
          role: userRole as UserRole
        });
      }
      
      // Check if the user's role matches the requested role (if provided)
      if (role && user.role !== role) {
        console.log("Role mismatch - user.role:", user.role, "requested role:", role);
        if (role === "teacher" && user.role === "student") {
          return res.status(403).json({ message: "This account doesn't have teacher privileges" });
        } else if (role === "student" && user.role === "teacher") {
          return res.status(403).json({ message: "This account is registered as a teacher, not a student" });
        }
      }
      
      // Store user in session
      req.session.user = user;
      console.log("User logged in successfully:", user.username, user.role);
      
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  app.get(`${apiPrefix}/auth/logout`, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      // Redirect to login page instead of returning JSON
      res.redirect('/login');
    });
  });
  
  app.get(`${apiPrefix}/auth/user`, isAuthenticated, (req, res) => {
    res.json(req.session.user);
  });
  
  // Teacher-specific Routes
  app.get(`${apiPrefix}/teacher/stats`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.user?.id;
      if (!teacherId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const stats = await storage.getTeacherLessonStats(teacherId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch teacher stats" });
    }
  });
  
  app.get(`${apiPrefix}/teacher/students`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.user?.id;
      if (!teacherId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const students = await storage.getStudentsByTeacher(teacherId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching teacher's students:", error);
      res.status(500).json({ message: "Failed to fetch teacher's students" });
    }
  });
  
  // Get all unassigned students (for teacher assignment)
  app.get(`${apiPrefix}/students/unassigned`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const students = await storage.getStudents();
      // Get all students currently assigned to teachers
      const assignedStudents = await storage.getAllStudentsWithStats();
      // Filter out students who don't have a teacher yet
      const unassignedStudents = students.filter(student => 
        !assignedStudents.some(assigned => assigned.id === student.id && assigned.teacher)
      );
      res.json(unassignedStudents);
    } catch (error) {
      console.error("Error fetching unassigned students:", error);
      res.status(500).json({ message: "Failed to fetch unassigned students" });
    }
  });
  
  // Assign a student to a teacher
  app.post(`${apiPrefix}/teacher/students/assign`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const { studentId } = req.body;
      const teacherId = req.session.user?.id;
      
      if (!teacherId || !studentId) {
        return res.status(400).json({ message: "Teacher ID and Student ID are required" });
      }
      
      const result = await storage.assignTeacherToStudent(teacherId, studentId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error assigning student to teacher:", error);
      res.status(500).json({ message: "Failed to assign student" });
    }
  });

  // Create a new student with user account and assign to teacher
  app.post(`${apiPrefix}/teacher/create-student`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.user?.id;
      
      if (!teacherId) {
        return res.status(401).json({ message: "Teacher ID is required" });
      }
      
      // Extract data from request
      const { username, name, grade, currentJuz, currentSurah, currentAyah, notes } = req.body;
      
      // First create a user account for the student
      const newUser = await storage.createUser({
        username,
        name,
        role: "student"
      });
      
      // Then create a student record
      const newStudent = await storage.createStudent({
        name,
        userId: newUser.id,
        grade,
        currentJuz,
        currentSurah,
        currentAyah,
        completedJuz: "[]", // Start with empty completed juz array
        notes
      });
      
      // Assign the student to the teacher
      await storage.assignTeacherToStudent(teacherId, newStudent.id);
      
      res.status(201).json(newStudent);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });
  
  app.get(`${apiPrefix}/teacher/lessons/recent`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.user?.id;
      if (!teacherId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const limit = parseInt(req.query.limit as string) || 5;
      const lessons = await storage.getLessonsByTeacher(teacherId);
      // Sort by date descending and limit
      const recentLessons = lessons
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      res.json(recentLessons);
    } catch (error) {
      console.error("Error fetching teacher's recent lessons:", error);
      res.status(500).json({ message: "Failed to fetch teacher's recent lessons" });
    }
  });
  
  // Create a new teacher lesson
  app.post(`${apiPrefix}/teacher/lessons`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const { studentId, date, surahStart, ayahStart, surahEnd, ayahEnd, notes, progress } = req.body;
      const teacherId = req.session.user?.id;
      
      if (!studentId || !teacherId) {
        return res.status(400).json({ message: "Student ID and Teacher ID are required" });
      }
      
      const lesson = await storage.createLesson({
        teacherId,
        studentId,
        date: new Date(date),
        surahStart,
        ayahStart,
        surahEnd,
        ayahEnd,
        notes,
        progress: progress || "In Progress" // Default to In Progress
      });
      
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });
  
  // Get a single lesson by ID
  app.get(`${apiPrefix}/lessons/:id`, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLessonWithDetails(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });
  
  // Complete a lesson
  app.patch(`${apiPrefix}/lessons/:id/complete`, isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check if the user is the teacher for this lesson
      if (req.session.user?.role === 'teacher' && req.session.user?.id !== lesson.teacherId) {
        return res.status(403).json({ message: "You are not authorized to complete this lesson" });
      }
      
      // Update the lesson to completed status
      const updatedLesson = await storage.updateLesson(lessonId, { progress: "Completed" });
      
      // Update the student's current position including ayah
      const student = await storage.getStudent(lesson.studentId);
      if (student) {
        // Use the imported utilities for tracking Quran progress
        
        // Update the completedJuz array with any newly completed juz based on current position
        const updatedCompletedJuz = updateCompletedJuz(
          student.completedJuz,
          lesson.surahEnd,
          lesson.ayahEnd
        );
        
        // Get the current juz using imported utility
        const currentJuz = getSurahJuz(lesson.surahEnd, lesson.ayahEnd) || student.currentJuz;
        
        // Update student record with the ending position, completed juz, and current juz
        await storage.updateStudent(lesson.studentId, {
          currentSurah: lesson.surahEnd,
          currentAyah: lesson.ayahEnd, // Store the ending ayah as well
          currentJuz: currentJuz, // Use the calculated current juz
          completedJuz: updatedCompletedJuz // Update the list of completed juz
        });
      }
      
      res.json(updatedLesson);
    } catch (error) {
      console.error("Error completing lesson:", error);
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });
  
  // Get lesson mistakes
  app.get(`${apiPrefix}/lesson-mistakes/:lessonId`, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      
      // Return empty array if lesson ID is invalid
      if (isNaN(lessonId) || lessonId <= 0) {
        return res.json([]);
      }
      
      // First check if the lesson exists - try both getLesson and getLessonWithDetails
      let lesson = await storage.getLesson(lessonId);
      
      // If not found with getLesson, try getLessonWithDetails
      if (!lesson) {
        lesson = await storage.getLessonWithDetails(lessonId);
      }
      
      // If still not found, return empty array instead of 404
      if (!lesson) {
        console.log(`Lesson with ID ${lessonId} not found, returning empty mistakes array`);
        return res.json([]);
      }
      
      const mistakes = await storage.getLessonMistakesByLesson(lessonId);
      res.json(mistakes);
    } catch (error) {
      console.error("Error fetching lesson mistakes:", error);
      // Return empty array instead of 500 to avoid breaking the UI
      res.json([]);
    }
  });
  
  // Create a lesson mistake
  app.post(`${apiPrefix}/lesson-mistakes`, isAuthenticated, async (req, res) => {
    try {
      const { lessonId, studentId, type, ayah, details, description, surah } = req.body;
      
      if (!lessonId || !studentId || !type || !ayah) {
        return res.status(400).json({ message: "Lesson ID, Student ID, type, and ayah are required" });
      }
      
      // Get the surah from the lesson if not provided
      let mistakeSurah = surah;
      if (!mistakeSurah) {
        const lesson = await storage.getLesson(lessonId);
        if (lesson) {
          mistakeSurah = lesson.surahStart;
        } else {
          mistakeSurah = ""; // Default empty string if lesson not found
        }
      }
      
      const mistake = await storage.createLessonMistake({
        lessonId,
        studentId,
        type,
        ayah,
        surah: mistakeSurah,
        description: description || details || null
      });
      
      res.status(201).json(mistake);
    } catch (error) {
      console.error("Error creating lesson mistake:", error);
      res.status(500).json({ message: "Failed to create lesson mistake" });
    }
  });
  
  // Student-specific Routes
  app.get(`${apiPrefix}/students/details`, isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.user.id;
      
      // Get the student record
      const students = await storage.getStudents();
      const student = students.find(s => s.userId === userId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student details:", error);
      res.status(500).json({ message: "Failed to fetch student details" });
    }
  });
  
  app.get(`${apiPrefix}/student/teacher`, isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.user.id;
      
      // Get the student record first
      const students = await storage.getStudents();
      const student = students.find(s => s.userId === userId);
      
      if (!student) {
        return res.status(404).json({ message: "Student record not found" });
      }
      
      const teacher = await storage.getTeacherForStudent(student.id);
      res.json(teacher);
    } catch (error) {
      console.error("Error fetching student's teacher:", error);
      res.status(500).json({ message: "Failed to fetch student's teacher" });
    }
  });
  
  app.get(`${apiPrefix}/student/lessons`, isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      // Use the userId from the student record
      const userId = req.session.user.id;
      
      // Get the student record first
      const students = await storage.getStudents();
      const student = students.find(s => s.userId === userId);
      
      if (!student) {
        return res.status(404).json({ message: "Student record not found" });
      }
      
      const lessons = await storage.getLessonsByStudent(student.id);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching student's lessons:", error);
      res.status(500).json({ message: "Failed to fetch student's lessons" });
    }
  });
  
  app.get(`${apiPrefix}/student/sessions/recent`, isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      // Use the userId from the student record
      const userId = req.session.user.id;
      
      // Get the student record first
      const students = await storage.getStudents();
      const student = students.find(s => s.userId === userId);
      
      if (!student) {
        return res.status(404).json({ message: "Student record not found" });
      }
      
      const sessions = await storage.getSessionsByStudent(student.id);
      
      // Get session details for each session
      const sessionDetails = await Promise.all(
        sessions.map(async (session) => {
          return await storage.getSessionWithDetails(session.id);
        })
      );
      
      // Sort by date descending and limit
      const limit = parseInt(req.query.limit as string) || 5;
      const recentSessions = sessionDetails
        .filter(session => session !== undefined)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      
      res.json(recentSessions);
    } catch (error) {
      console.error("Error fetching student's recent sessions:", error);
      res.status(500).json({ message: "Failed to fetch student's recent sessions" });
    }
  });
  
  app.get(`${apiPrefix}/student/progress`, isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      // Use the userId from the student record
      const userId = req.session.user.id;
      
      // Get the student record first
      const students = await storage.getStudents();
      const student = students.find(s => s.userId === userId);
      
      if (!student) {
        return res.status(404).json({ message: "Student record not found" });
      }
      
      const days = parseInt(req.query.days as string) || 30;
      const progressData = await storage.getStudentProgress(student.id, days);
      
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({ message: "Failed to fetch student progress" });
    }
  });
  
  app.get(`${apiPrefix}/student/lesson-progress`, isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      // Use the userId from the student record
      const userId = req.session.user.id;
      
      // Get the student record first
      const students = await storage.getStudents();
      const student = students.find(s => s.userId === userId);
      
      if (!student) {
        return res.status(404).json({ message: "Student record not found" });
      }
      
      const days = parseInt(req.query.days as string) || 30;
      const progressData = await storage.getStudentLessonProgress(student.id, days);
      
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching student lesson progress:", error);
      res.status(500).json({ message: "Failed to fetch student lesson progress" });
    }
  });

  // Students API
  app.get(`${apiPrefix}/students`, isAuthenticated, async (req, res) => {
    try {
      // If it's a student user, return only basic info needed for peer sessions
      if (req.session?.user?.role === "student") {
        const students = await storage.getStudents();
        // Return basic student info (just what's needed for peer sessions)
        const basicStudentInfo = students.map(student => ({
          id: student.id,
          name: student.name,
          grade: student.grade,
          currentJuz: student.currentJuz
        }));
        res.json(basicStudentInfo);
      } else {
        // For teachers, return full student details
        const students = await storage.getStudents();
        res.json(students);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve students" });
    }
  });

  app.get(`${apiPrefix}/students/stats`, async (req, res) => {
    try {
      const studentsWithStats = await storage.getAllStudentsWithStats();
      res.json(studentsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student statistics" });
    }
  });

  app.get(`${apiPrefix}/students/:id`, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // For student users, only allow viewing their own data
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        // If this is not the student's own record, return error
        if (!currentUserStudent || currentUserStudent.id !== id) {
          return res.status(403).json({ message: "Permission denied: You can only view your own student record" });
        }
      }
      
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student" });
    }
  });

  app.get(`${apiPrefix}/students/:id/stats`, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // For student users, only allow viewing their own stats
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        // If this is not the student's own record, return error
        if (!currentUserStudent || currentUserStudent.id !== id) {
          return res.status(403).json({ message: "Permission denied: You can only view your own statistics" });
        }
      }
      
      const studentWithStats = await storage.getStudentWithStats(id);
      
      if (!studentWithStats) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(studentWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student statistics" });
    }
  });

  app.post(`${apiPrefix}/students`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put(`${apiPrefix}/students/:id`, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // For student users, only allow updating their own profile
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        // If this is not the student's own record, return error
        if (!currentUserStudent || currentUserStudent.id !== id) {
          return res.status(403).json({ message: "Permission denied: You can only update your own profile" });
        }
        
        // Students can only update specific fields (e.g., notes)
        const allowedFields = ["notes"];
        const forbiddenKeys = Object.keys(req.body).filter(key => !allowedFields.includes(key));
        
        if (forbiddenKeys.length > 0) {
          return res.status(403).json({ 
            message: "Permission denied: You can only update your notes", 
            forbiddenFields: forbiddenKeys
          });
        }
      }
      
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const updatedStudent = await storage.updateStudent(id, validatedData);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete(`${apiPrefix}/students/:id`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteStudent(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Sessions API
  app.get(`${apiPrefix}/sessions`, isAuthenticated, async (req, res) => {
    try {
      // For student users, only show sessions they participated in
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        if (!currentUserStudent) {
          return res.status(404).json({ message: "Student record not found for current user" });
        }
        
        // Get only sessions where the student is either student1 or student2
        const studentId = currentUserStudent.id;
        const studentSessions = await storage.getSessionsByStudent(studentId);
        return res.json(studentSessions);
      }
      
      // Teachers can see all sessions
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve sessions" });
    }
  });

  app.get(`${apiPrefix}/sessions/recent`, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const recentSessions = await storage.getRecentSessions(limit);
      res.json(recentSessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve recent sessions" });
    }
  });

  app.get(`${apiPrefix}/sessions/:id`, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sessionWithDetails = await storage.getSessionWithDetails(id);
      
      if (!sessionWithDetails) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // For student users, verify they are part of this session
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        if (!currentUserStudent) {
          return res.status(404).json({ message: "Student record not found for current user" });
        }
        
        // Check if the student is part of this session
        const studentId = currentUserStudent.id;
        if (sessionWithDetails.student1.id !== studentId && sessionWithDetails.student2.id !== studentId) {
          return res.status(403).json({ message: "Permission denied: You are not a participant in this session" });
        }
      }
      
      res.json(sessionWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve session" });
    }
  });

  app.get(`${apiPrefix}/sessions/student/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sessions = await storage.getSessionsByStudent(id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student sessions" });
    }
  });

  app.post(`${apiPrefix}/sessions`, isAuthenticated, async (req, res) => {
    try {
      // Create a proper session object with default date if not provided
      let sessionData = { ...req.body };
      
      // For student users, verify they are part of this session
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        if (!currentUserStudent) {
          return res.status(404).json({ message: "Student record not found for current user" });
        }
        
        // Check if the student is including themselves in the session
        const student1Id = Number(sessionData.student1Id);
        const student2Id = Number(sessionData.student2Id);
        
        if (student1Id !== currentUserStudent.id && student2Id !== currentUserStudent.id) {
          return res.status(403).json({ 
            message: "Permission denied: You must be one of the participants in the session" 
          });
        }
      }
      
      // Ensure date is a Date object
      if (!sessionData.date) {
        sessionData.date = new Date();
      } else if (typeof sessionData.date === 'string') {
        sessionData.date = new Date(sessionData.date);
      }
      
      // Convert numeric fields to numbers
      if (sessionData.student1Id) sessionData.student1Id = Number(sessionData.student1Id);
      if (sessionData.student2Id) sessionData.student2Id = Number(sessionData.student2Id);
      if (sessionData.ayahStart) sessionData.ayahStart = Number(sessionData.ayahStart);
      if (sessionData.ayahEnd) sessionData.ayahEnd = Number(sessionData.ayahEnd);
      
      const validatedData = insertSessionSchema.parse(sessionData);
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Session creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put(`${apiPrefix}/sessions/:id`, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the session first to check permissions
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // For student users, verify they are part of this session
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        if (!currentUserStudent) {
          return res.status(404).json({ message: "Student record not found for current user" });
        }
        
        // Check if the student is part of this session
        if (session.student1Id !== currentUserStudent.id && session.student2Id !== currentUserStudent.id) {
          return res.status(403).json({ 
            message: "Permission denied: You can only update sessions you participate in" 
          });
        }
      }
      
      const validatedData = insertSessionSchema.partial().parse(req.body);
      const updatedSession = await storage.updateSession(id, validatedData);
      
      if (!updatedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.post(`${apiPrefix}/sessions/:id/complete`, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the session first to check permissions
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // For student users, verify they are part of this session
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        if (!currentUserStudent) {
          return res.status(404).json({ message: "Student record not found for current user" });
        }
        
        // Check if the student is part of this session
        if (session.student1Id !== currentUserStudent.id && session.student2Id !== currentUserStudent.id) {
          return res.status(403).json({ 
            message: "Permission denied: You can only complete sessions you participate in" 
          });
        }
      }
      
      const completedSession = await storage.completeSession(id);
      
      if (!completedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(completedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  app.delete(`${apiPrefix}/sessions/:id`, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the session first to check permissions
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // For student users, verify they are part of this session
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        if (!currentUserStudent) {
          return res.status(404).json({ message: "Student record not found for current user" });
        }
        
        // Check if the student is part of this session
        if (session.student1Id !== currentUserStudent.id && session.student2Id !== currentUserStudent.id) {
          return res.status(403).json({ 
            message: "Permission denied: You can only delete sessions you participate in" 
          });
        }
      }
      
      const deleted = await storage.deleteSession(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Mistakes API
  app.get(`${apiPrefix}/mistakes`, isAuthenticated, async (req, res) => {
    try {
      // For student users, only return their mistakes
      if (req.session?.user?.role === "student") {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        if (!currentUserStudent) {
          return res.status(404).json({ message: "Student record not found for current user" });
        }
        
        // Get only mistakes for this student
        const studentId = currentUserStudent.id;
        const studentMistakes = await storage.getMistakesByStudent(studentId);
        return res.json(studentMistakes);
      }
      
      // Teachers can see all mistakes
      const mistakes = await storage.getMistakes();
      res.json(mistakes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve mistakes" });
    }
  });

  app.get(`${apiPrefix}/mistakes/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mistake = await storage.getMistake(id);
      
      if (!mistake) {
        return res.status(404).json({ message: "Mistake not found" });
      }
      
      res.json(mistake);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve mistake" });
    }
  });

  app.get(`${apiPrefix}/mistakes/session/:id`, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const mistakes = await storage.getMistakesBySession(sessionId);
      res.json(mistakes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve session mistakes" });
    }
  });

  app.get(`${apiPrefix}/mistakes/student/:id`, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const mistakes = await storage.getMistakesByStudent(studentId);
      res.json(mistakes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student mistakes" });
    }
  });

  app.post(`${apiPrefix}/mistakes`, async (req, res) => {
    try {
      const validatedData = insertMistakeSchema.parse(req.body);
      const mistake = await storage.createMistake(validatedData);
      res.status(201).json(mistake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mistake data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mistake" });
    }
  });

  app.put(`${apiPrefix}/mistakes/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMistakeSchema.partial().parse(req.body);
      const updatedMistake = await storage.updateMistake(id, validatedData);
      
      if (!updatedMistake) {
        return res.status(404).json({ message: "Mistake not found" });
      }
      
      res.json(updatedMistake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mistake data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update mistake" });
    }
  });

  app.delete(`${apiPrefix}/mistakes/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMistake(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Mistake not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mistake" });
    }
  });

  // Statistics API
  app.get(`${apiPrefix}/stats/mistake-distribution`, async (req, res) => {
    try {
      const distribution = await storage.getMistakeTypeDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve mistake distribution" });
    }
  });

  app.get(`${apiPrefix}/stats/session-days`, async (req, res) => {
    try {
      const sessionsByDay = await storage.getSessionCountByDay();
      res.json(sessionsByDay);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve session day statistics" });
    }
  });

  app.get(`${apiPrefix}/stats/average-mistakes`, async (req, res) => {
    try {
      const average = await storage.getAverageMistakesPerSession();
      res.json({ average });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve average mistakes" });
    }
  });

  app.get(`${apiPrefix}/stats/mistake-trend`, async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trend = await storage.getMistakeTrend(days);
      res.json(trend);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve mistake trend" });
    }
  });

  // Get student progress data
  app.get(`${apiPrefix}/students/progress`, isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.query.studentId as string) || 0;
      const days = parseInt(req.query.days as string) || 30;
      
      // For student users, restrict access to own data only
      if (req.session?.user?.role === "student" && studentId !== 0) {
        // Get the student record associated with the current user
        const students = await storage.getStudents();
        const currentUserStudent = students.find(s => s.userId === req.session?.user?.id);
        
        // If trying to access another student's progress, deny access
        if (!currentUserStudent || currentUserStudent.id !== studentId) {
          return res.status(403).json({ message: "Permission denied: You can only view your own progress data" });
        }
      }

      if (studentId === 0) {
        // Return overall progress - only for teachers
        if (req.session?.user?.role === "student") {
          return res.status(403).json({ message: "Permission denied: Only teachers can view aggregate statistics" });
        }
        
        const trend = await storage.getMistakeTrend(days);
        res.json(trend);
      } else {
        try {
          // Check if student exists
          const student = await storage.getStudent(studentId);
          if (!student) {
            return res.status(404).json({ message: "Student not found" });
          }
          
          // Return progress for a specific student
          const progress = await storage.getStudentProgress(studentId, days);
          res.json(progress);
        } catch (err) {
          console.error("Error getting specific student progress:", err);
          res.status(500).json({ message: "Failed to retrieve student progress data" });
        }
      }
    } catch (error) {
      console.error("Error getting student progress:", error);
      res.status(500).json({ message: "Failed to retrieve student progress data" });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
