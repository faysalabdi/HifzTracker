import { 
  students, Student, InsertStudent, 
  mistakes, Mistake, InsertMistake,
  sessions, Session, InsertSession, 
  SessionWithDetails, StudentWithStats, MistakeWithDetails,
  MistakeType
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // Student methods
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Session methods
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  getSessionWithDetails(id: number): Promise<SessionWithDetails | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined>;
  completeSession(id: number): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
  getRecentSessions(limit: number): Promise<SessionWithDetails[]>;
  getSessionsByStudent(studentId: number): Promise<Session[]>;
  
  // Mistake methods
  getMistakes(): Promise<Mistake[]>;
  getMistake(id: number): Promise<Mistake | undefined>;
  createMistake(mistake: InsertMistake): Promise<Mistake>;
  updateMistake(id: number, mistake: Partial<InsertMistake>): Promise<Mistake | undefined>;
  deleteMistake(id: number): Promise<boolean>;
  getMistakesBySession(sessionId: number): Promise<Mistake[]>;
  getMistakesByStudent(studentId: number): Promise<Mistake[]>;
  
  // Statistics methods
  getStudentWithStats(id: number): Promise<StudentWithStats | undefined>;
  getAllStudentsWithStats(): Promise<StudentWithStats[]>;
  getMistakeTypeDistribution(): Promise<Record<MistakeType, number>>;
  getSessionCountByDay(): Promise<Record<string, number>>;
  getAverageMistakesPerSession(): Promise<number>;
  getMistakeTrend(days: number): Promise<{ date: string; count: number }[]>;
  getStudentProgress(studentId: number, days: number): Promise<{ date: string; count: number; mistakeType: MistakeType | null }[]>;
}

export class MemStorage implements IStorage {
  private studentsData: Map<number, Student>;
  private mistakesData: Map<number, Mistake>;
  private sessionsData: Map<number, Session>;
  private studentIdCounter: number;
  private mistakeIdCounter: number;
  private sessionIdCounter: number;

  constructor() {
    this.studentsData = new Map();
    this.mistakesData = new Map();
    this.sessionsData = new Map();
    this.studentIdCounter = 1;
    this.mistakeIdCounter = 1;
    this.sessionIdCounter = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return Array.from(this.studentsData.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsData.get(id);
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const createdAt = new Date();
    const student: Student = { ...studentData, id, createdAt };
    this.studentsData.set(id, student);
    return student;
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.studentsData.get(id);
    if (!student) return undefined;
    
    const updatedStudent: Student = { ...student, ...studentData };
    this.studentsData.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.studentsData.delete(id);
  }

  // Session methods
  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessionsData.values());
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessionsData.get(id);
  }

  async getSessionWithDetails(id: number): Promise<SessionWithDetails | undefined> {
    const session = this.sessionsData.get(id);
    if (!session) return undefined;

    const student1 = this.studentsData.get(session.student1Id);
    const student2 = this.studentsData.get(session.student2Id);
    if (!student1 || !student2) return undefined;

    const mistakes = Array.from(this.mistakesData.values())
      .filter(mistake => mistake.sessionId === id);

    return {
      ...session,
      student1,
      student2,
      mistakeCount: mistakes.length
    };
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const createdAt = new Date();
    const session: Session = { ...sessionData, id, createdAt };
    this.sessionsData.set(id, session);
    return session;
  }

  async updateSession(id: number, sessionData: Partial<InsertSession>): Promise<Session | undefined> {
    const session = this.sessionsData.get(id);
    if (!session) return undefined;
    
    const updatedSession: Session = { ...session, ...sessionData };
    this.sessionsData.set(id, updatedSession);
    return updatedSession;
  }

  async completeSession(id: number): Promise<Session | undefined> {
    const session = this.sessionsData.get(id);
    if (!session) return undefined;
    
    const completedSession: Session = { ...session, completed: true };
    this.sessionsData.set(id, completedSession);
    return completedSession;
  }

  async deleteSession(id: number): Promise<boolean> {
    return this.sessionsData.delete(id);
  }

  async getRecentSessions(limit: number): Promise<SessionWithDetails[]> {
    const sessions = Array.from(this.sessionsData.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return Promise.all(sessions.map(async session => {
      const details = await this.getSessionWithDetails(session.id);
      return details!;
    }));
  }

  async getSessionsByStudent(studentId: number): Promise<Session[]> {
    return Array.from(this.sessionsData.values())
      .filter(session => 
        session.student1Id === studentId || session.student2Id === studentId
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Mistake methods
  async getMistakes(): Promise<Mistake[]> {
    return Array.from(this.mistakesData.values());
  }

  async getMistake(id: number): Promise<Mistake | undefined> {
    return this.mistakesData.get(id);
  }

  async createMistake(mistakeData: InsertMistake): Promise<Mistake> {
    const id = this.mistakeIdCounter++;
    const createdAt = new Date();
    const mistake: Mistake = { ...mistakeData, id, createdAt };
    this.mistakesData.set(id, mistake);
    return mistake;
  }

  async updateMistake(id: number, mistakeData: Partial<InsertMistake>): Promise<Mistake | undefined> {
    const mistake = this.mistakesData.get(id);
    if (!mistake) return undefined;
    
    const updatedMistake: Mistake = { ...mistake, ...mistakeData };
    this.mistakesData.set(id, updatedMistake);
    return updatedMistake;
  }

  async deleteMistake(id: number): Promise<boolean> {
    return this.mistakesData.delete(id);
  }

  async getMistakesBySession(sessionId: number): Promise<Mistake[]> {
    return Array.from(this.mistakesData.values())
      .filter(mistake => mistake.sessionId === sessionId);
  }

  async getMistakesByStudent(studentId: number): Promise<Mistake[]> {
    return Array.from(this.mistakesData.values())
      .filter(mistake => mistake.studentId === studentId);
  }

  // Statistics methods
  async getStudentWithStats(id: number): Promise<StudentWithStats | undefined> {
    const student = this.studentsData.get(id);
    if (!student) return undefined;

    const sessions = await this.getSessionsByStudent(id);
    const mistakes = await this.getMistakesByStudent(id);
    
    // Calculate statistics
    const sessionCount = sessions.length;
    const averageMistakes = sessionCount > 0 ? mistakes.length / sessionCount : 0;
    
    // Find most common mistake type
    const mistakeTypeCounts: Record<string, number> = {};
    mistakes.forEach(mistake => {
      mistakeTypeCounts[mistake.type] = (mistakeTypeCounts[mistake.type] || 0) + 1;
    });
    
    let mostCommonMistakeType: MistakeType | null = null;
    let maxCount = 0;
    
    Object.entries(mistakeTypeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        mostCommonMistakeType = type as MistakeType;
        maxCount = count;
      }
    });

    return {
      ...student,
      sessionCount,
      averageMistakes,
      mostCommonMistakeType
    };
  }

  async getAllStudentsWithStats(): Promise<StudentWithStats[]> {
    const students = await this.getStudents();
    return Promise.all(
      students.map(async (student) => {
        const stats = await this.getStudentWithStats(student.id);
        return stats!;
      })
    );
  }

  async getMistakeTypeDistribution(): Promise<Record<MistakeType, number>> {
    const mistakes = await this.getMistakes();
    const distribution: Record<MistakeType, number> = {
      tajweed: 0,
      word: 0,
      stuck: 0
    };
    
    mistakes.forEach(mistake => {
      distribution[mistake.type as MistakeType] += 1;
    });
    
    const total = mistakes.length;
    if (total > 0) {
      Object.keys(distribution).forEach(key => {
        distribution[key as MistakeType] = Math.round((distribution[key as MistakeType] / total) * 100);
      });
    }
    
    return distribution;
  }

  async getSessionCountByDay(): Promise<Record<string, number>> {
    const sessions = await this.getSessions();
    const counts: Record<string, number> = {
      'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0
    };
    
    sessions.forEach(session => {
      const day = new Date(session.date).toLocaleString('en-US', { weekday: 'short' });
      counts[day] += 1;
    });
    
    return counts;
  }

  async getAverageMistakesPerSession(): Promise<number> {
    const sessions = await this.getSessions();
    const mistakes = await this.getMistakes();
    
    if (sessions.length === 0) return 0;
    return parseFloat((mistakes.length / sessions.length).toFixed(1));
  }

  async getMistakeTrend(days: number): Promise<{ date: string; count: number }[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const results: { date: string; count: number }[] = [];
    const mistakes = await this.getMistakes();
    
    // Initialize all dates with zero counts
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      results.push({ date: dateStr, count: 0 });
    }
    
    // Count mistakes for each date
    mistakes.forEach(mistake => {
      const mistakeDate = new Date(mistake.createdAt).toISOString().split('T')[0];
      const resultItem = results.find(item => item.date === mistakeDate);
      if (resultItem) {
        resultItem.count += 1;
      }
    });
    
    return results;
  }
  
  async getStudentProgress(studentId: number, days: number): Promise<{ date: string; count: number; mistakeType: MistakeType | null }[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const results: { date: string; count: number; mistakeType: MistakeType | null }[] = [];
    
    // Initialize all dates with zero counts
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      results.push({ date: dateStr, count: 0, mistakeType: null });
    }
    
    // Get mistakes for the specific student
    const mistakes = await this.getMistakesByStudent(studentId);
    
    // Calculate counts by date and track most common mistake type per day
    mistakes.forEach(mistake => {
      const mistakeDate = new Date(mistake.createdAt).toISOString().split('T')[0];
      const resultItem = results.find(item => item.date === mistakeDate);
      
      if (resultItem) {
        resultItem.count += 1;
        
        // Set the most common mistake type for this date
        // In a real implementation, you'd track counts of each type and pick the most common
        // For simplicity, we'll just use the most recent one
        resultItem.mistakeType = mistake.type;
      }
    });
    
    // Calculate 7-day moving average to smooth out the data
    // This helps in visualizing trends better
    const smoothedResults = results.map((item, index, array) => {
      // If we have less than 7 days of data before this point, just return the item as is
      if (index < 6) return item;
      
      // Calculate the average of the past 7 days
      const window = array.slice(index - 6, index + 1);
      const sum = window.reduce((acc, curr) => acc + curr.count, 0);
      const avg = sum / 7;
      
      // Return a new object with the smoothed count
      return {
        ...item,
        count: parseFloat(avg.toFixed(2)) // Round to 2 decimal places for cleaner display
      };
    });
    
    return smoothedResults;
  }

  // Helper method to initialize sample data
  private initializeSampleData() {
    // Sample students
    const sampleStudents: InsertStudent[] = [
      { name: "Ahmad Hassan", grade: "3", currentJuz: 5, currentSurah: "Al-Baqarah", notes: "" },
      { name: "Zaynab Khan", grade: "4", currentJuz: 10, currentSurah: "Yunus", notes: "" },
      { name: "Ibrahim Omar", grade: "3", currentJuz: 7, currentSurah: "Al-A'raf", notes: "" },
      { name: "Yusuf Ali", grade: "2", currentJuz: 3, currentSurah: "Al-Baqarah", notes: "" },
      { name: "Aisha Patel", grade: "4", currentJuz: 12, currentSurah: "Hud", notes: "" },
      { name: "Mohammed Siddiq", grade: "2", currentJuz: 2, currentSurah: "Al-Baqarah", notes: "" }
    ];

    sampleStudents.forEach(student => this.createStudent(student));

    // Sample sessions
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const sampleSessions: InsertSession[] = [
      { 
        date: new Date(today.setHours(10, 30, 0, 0)), 
        student1Id: 1, 
        student2Id: 4, 
        surahStart: "Al-Baqarah", 
        ayahStart: 5, 
        surahEnd: "Al-Baqarah", 
        ayahEnd: 20, 
        completed: true 
      },
      { 
        date: new Date(today.setHours(9, 15, 0, 0)), 
        student1Id: 2, 
        student2Id: 5, 
        surahStart: "Yunus", 
        ayahStart: 1, 
        surahEnd: "Yunus", 
        ayahEnd: 15, 
        completed: true 
      },
      { 
        date: new Date(yesterday.setHours(14, 45, 0, 0)), 
        student1Id: 3, 
        student2Id: 1, 
        surahStart: "Al-A'raf", 
        ayahStart: 10, 
        surahEnd: "Al-A'raf", 
        ayahEnd: 30, 
        completed: true 
      },
      { 
        date: new Date(yesterday.setHours(11, 20, 0, 0)), 
        student1Id: 4, 
        student2Id: 3, 
        surahStart: "Al-Baqarah", 
        ayahStart: 40, 
        surahEnd: "Al-Baqarah", 
        ayahEnd: 60, 
        completed: true 
      }
    ];

    sampleSessions.forEach(session => this.createSession(session));

    // Sample mistakes
    const sampleMistakes: InsertMistake[] = [
      { 
        sessionId: 1, 
        studentId: 1, 
        type: "tajweed", 
        surah: "Al-Baqarah", 
        ayah: 7, 
        description: "Missed the Ghunnah in 'min ba'dihi'" 
      },
      { 
        sessionId: 1, 
        studentId: 1, 
        type: "word", 
        surah: "Al-Baqarah", 
        ayah: 10, 
        description: "Used 'qulna' instead of 'qala'" 
      },
      { 
        sessionId: 1, 
        studentId: 1, 
        type: "stuck", 
        surah: "Al-Baqarah", 
        ayah: 15, 
        description: "Paused too long before 'wa-qafayna'" 
      },
      { 
        sessionId: 2, 
        studentId: 2, 
        type: "tajweed", 
        surah: "Yunus", 
        ayah: 3, 
        description: "Incorrect pronunciation of 'dhaalika'" 
      },
      { 
        sessionId: 2, 
        studentId: 2, 
        type: "word", 
        surah: "Yunus", 
        ayah: 7, 
        description: "Skipped a word" 
      },
      { 
        sessionId: 3, 
        studentId: 3, 
        type: "tajweed", 
        surah: "Al-A'raf", 
        ayah: 12, 
        description: "Incorrect madd" 
      },
      { 
        sessionId: 3, 
        studentId: 3, 
        type: "tajweed", 
        surah: "Al-A'raf", 
        ayah: 15, 
        description: "Incorrect idgham" 
      },
      { 
        sessionId: 4, 
        studentId: 4, 
        type: "stuck", 
        surah: "Al-Baqarah", 
        ayah: 46, 
        description: "Repeated words unnecessarily" 
      },
      { 
        sessionId: 4, 
        studentId: 4, 
        type: "word", 
        surah: "Al-Baqarah", 
        ayah: 52, 
        description: "Incorrect word order" 
      }
    ];

    sampleMistakes.forEach(mistake => this.createMistake(mistake));
  }
}

export const storage = new MemStorage();
