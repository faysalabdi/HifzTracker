import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertStudentSchema, 
  insertSessionSchema, 
  insertMistakeSchema, 
  mistakeTypeSchema, 
  insertUserSchema,
  UserRole
} from "@shared/schema";

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
  const session = require('express-session');
  app.use(session({
    secret: 'hifz-tracker-secret', // In production, use environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
  }));
  
  // API prefix
  const apiPrefix = "/api";
  
  // Authentication Routes
  app.post(`${apiPrefix}/auth/login`, async (req, res) => {
    try {
      const { username, role } = req.body;
      
      if (!username || !role) {
        return res.status(400).json({ message: "Username and role are required" });
      }
      
      let user = await storage.getUserByUsername(username);
      
      // For demo, auto-create user if not exists
      if (!user) {
        // Generate a name based on the username
        const name = username.charAt(0).toUpperCase() + username.slice(1);
        
        // Create new user
        user = await storage.createUser({
          username,
          name,
          role: role as UserRole
        });
      }
      
      // Store user in session
      req.session.user = user;
      
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
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get(`${apiPrefix}/auth/user`, isAuthenticated, (req, res) => {
    res.json(req.session.user);
  });
  
  // Teacher-specific Routes
  app.get(`${apiPrefix}/teacher/stats`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.user.id;
      const stats = await storage.getTeacherLessonStats(teacherId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      res.status(500).json({ message: "Failed to fetch teacher stats" });
    }
  });
  
  app.get(`${apiPrefix}/teacher/students`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.user.id;
      const students = await storage.getStudentsByTeacher(teacherId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching teacher's students:", error);
      res.status(500).json({ message: "Failed to fetch teacher's students" });
    }
  });
  
  app.get(`${apiPrefix}/teacher/lessons/recent`, isAuthenticated, hasRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.user.id;
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
  
  // Student-specific Routes
  app.get(`${apiPrefix}/student/teacher`, isAuthenticated, hasRole('student'), async (req, res) => {
    try {
      // Use the userId from the student record
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
  app.get(`${apiPrefix}/students`, async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
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

  app.get(`${apiPrefix}/students/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student" });
    }
  });

  app.get(`${apiPrefix}/students/:id/stats`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const studentWithStats = await storage.getStudentWithStats(id);
      
      if (!studentWithStats) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(studentWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve student statistics" });
    }
  });

  app.post(`${apiPrefix}/students`, async (req, res) => {
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

  app.put(`${apiPrefix}/students/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.delete(`${apiPrefix}/students/:id`, async (req, res) => {
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
  app.get(`${apiPrefix}/sessions`, async (req, res) => {
    try {
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

  app.get(`${apiPrefix}/sessions/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sessionWithDetails = await storage.getSessionWithDetails(id);
      
      if (!sessionWithDetails) {
        return res.status(404).json({ message: "Session not found" });
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

  app.post(`${apiPrefix}/sessions`, async (req, res) => {
    try {
      // Create a proper session object with default date if not provided
      let sessionData = { ...req.body };
      
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

  app.put(`${apiPrefix}/sessions/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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

  app.post(`${apiPrefix}/sessions/:id/complete`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const completedSession = await storage.completeSession(id);
      
      if (!completedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(completedSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  app.delete(`${apiPrefix}/sessions/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
  app.get(`${apiPrefix}/mistakes`, async (req, res) => {
    try {
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
  app.get(`${apiPrefix}/students/progress`, async (req, res) => {
    try {
      const studentId = parseInt(req.query.studentId as string) || 0;
      const days = parseInt(req.query.days as string) || 30;
      
      if (studentId === 0) {
        // Return overall progress for all students
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
