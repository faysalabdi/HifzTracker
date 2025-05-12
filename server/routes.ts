import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertStudentSchema, 
  insertSessionSchema, 
  insertMistakeSchema, 
  mistakeTypeSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";

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

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
