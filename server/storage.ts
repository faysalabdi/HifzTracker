import { 
  users, User, InsertUser,
  students, Student, InsertStudent, 
  teacherStudents, TeacherStudent, InsertTeacherStudent,
  mistakes, Mistake, InsertMistake,
  sessions, Session, InsertSession, 
  lessons, Lesson, InsertLesson,
  lessonMistakes, LessonMistake, InsertLessonMistake,
  SessionWithDetails, StudentWithStats, MistakeWithDetails,
  LessonWithDetails, LessonMistakeWithDetails,
  MistakeType
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Student methods
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Teacher-Student relation methods
  assignTeacherToStudent(teacherId: number, studentId: number): Promise<TeacherStudent>;
  unassignTeacherFromStudent(teacherId: number, studentId: number): Promise<boolean>;
  getStudentsByTeacher(teacherId: number): Promise<StudentWithStats[]>;
  getTeacherForStudent(studentId: number): Promise<User | undefined>;
  
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
  
  // Lesson methods (for teachers)
  getLessons(): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonWithDetails(id: number): Promise<LessonWithDetails | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  getLessonsByTeacher(teacherId: number): Promise<LessonWithDetails[]>;
  getLessonsByStudent(studentId: number): Promise<LessonWithDetails[]>;
  getRecentLessons(limit: number): Promise<LessonWithDetails[]>;
  
  // Lesson Mistake methods (for teachers)
  getLessonMistakes(): Promise<LessonMistake[]>;
  getLessonMistake(id: number): Promise<LessonMistake | undefined>;
  createLessonMistake(mistake: InsertLessonMistake): Promise<LessonMistake>;
  updateLessonMistake(id: number, mistake: Partial<InsertLessonMistake>): Promise<LessonMistake | undefined>;
  deleteLessonMistake(id: number): Promise<boolean>;
  getLessonMistakesByLesson(lessonId: number): Promise<LessonMistake[]>;
  getLessonMistakesByStudent(studentId: number): Promise<LessonMistake[]>;
  
  // Statistics methods
  getStudentWithStats(id: number): Promise<StudentWithStats | undefined>;
  getAllStudentsWithStats(): Promise<StudentWithStats[]>;
  getMistakeTypeDistribution(): Promise<Record<MistakeType, number>>;
  getSessionCountByDay(): Promise<Record<string, number>>;
  getAverageMistakesPerSession(): Promise<number>;
  getMistakeTrend(days: number): Promise<{ date: string; count: number }[]>;
  getStudentProgress(studentId: number, days: number): Promise<{ date: string; count: number; mistakeType: MistakeType | null }[]>;
  // Teacher-specific stats
  getTeacherLessonStats(teacherId: number): Promise<{ 
    totalLessons: number; 
    studentsCount: number;
    averageMistakes: number;
    completedLessons: number;
  }>;
  getStudentLessonProgress(studentId: number, days: number): Promise<{ 
    date: string; 
    lessonsCount: number; 
    mistakesCount: number;
  }[]>;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private studentsData: Map<number, Student>;
  private teacherStudentsData: Map<string, TeacherStudent>; // key: `${teacherId}-${studentId}`
  private mistakesData: Map<number, Mistake>;
  private sessionsData: Map<number, Session>;
  private lessonsData: Map<number, Lesson>;
  private lessonMistakesData: Map<number, LessonMistake>;
  
  private userIdCounter: number;
  private studentIdCounter: number;
  private mistakeIdCounter: number;
  private sessionIdCounter: number;
  private lessonIdCounter: number;
  private lessonMistakeIdCounter: number;

  constructor() {
    this.usersData = new Map();
    this.studentsData = new Map();
    this.teacherStudentsData = new Map();
    this.mistakesData = new Map();
    this.sessionsData = new Map();
    this.lessonsData = new Map();
    this.lessonMistakesData = new Map();
    
    this.userIdCounter = 1;
    this.studentIdCounter = 1;
    this.mistakeIdCounter = 1;
    this.sessionIdCounter = 1;
    this.lessonIdCounter = 1;
    this.lessonMistakeIdCounter = 1;

    // Initialize with some sample data
    this.initializeSampleData();
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      user => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.usersData.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  // Teacher-Student relation methods
  async assignTeacherToStudent(teacherId: number, studentId: number): Promise<TeacherStudent> {
    const key = `${teacherId}-${studentId}`;
    const relation: TeacherStudent = { teacherId, studentId };
    this.teacherStudentsData.set(key, relation);
    return relation;
  }

  async unassignTeacherFromStudent(teacherId: number, studentId: number): Promise<boolean> {
    const key = `${teacherId}-${studentId}`;
    return this.teacherStudentsData.delete(key);
  }

  async getStudentsByTeacher(teacherId: number): Promise<StudentWithStats[]> {
    const relations = Array.from(this.teacherStudentsData.values())
      .filter(relation => relation.teacherId === teacherId);
    
    const studentIds = relations.map(relation => relation.studentId);
    const students = await Promise.all(
      studentIds.map(id => this.getStudentWithStats(id))
    );
    
    return students.filter((student): student is StudentWithStats => student !== undefined);
  }

  async getTeacherForStudent(studentId: number): Promise<User | undefined> {
    const relation = Array.from(this.teacherStudentsData.values())
      .find(relation => relation.studentId === studentId);
    
    if (!relation) return undefined;
    return this.getUser(relation.teacherId);
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
  
  // Lesson methods (for teachers)
  async getLessons(): Promise<Lesson[]> {
    return Array.from(this.lessonsData.values());
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessonsData.get(id);
  }

  async getLessonWithDetails(id: number): Promise<LessonWithDetails | undefined> {
    const lesson = this.lessonsData.get(id);
    if (!lesson) return undefined;

    const teacher = await this.getUser(lesson.teacherId);
    const student = await this.getStudent(lesson.studentId);
    if (!teacher || !student) return undefined;

    const mistakes = Array.from(this.lessonMistakesData.values())
      .filter(mistake => mistake.lessonId === id);

    return {
      ...lesson,
      teacher,
      student,
      mistakeCount: mistakes.length
    };
  }

  async createLesson(lessonData: InsertLesson): Promise<Lesson> {
    const id = this.lessonIdCounter++;
    const createdAt = new Date();
    const lesson: Lesson = { ...lessonData, id, createdAt };
    this.lessonsData.set(id, lesson);
    return lesson;
  }

  async updateLesson(id: number, lessonData: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const lesson = this.lessonsData.get(id);
    if (!lesson) return undefined;
    
    const updatedLesson: Lesson = { ...lesson, ...lessonData };
    this.lessonsData.set(id, updatedLesson);
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<boolean> {
    return this.lessonsData.delete(id);
  }

  async getLessonsByTeacher(teacherId: number): Promise<LessonWithDetails[]> {
    const lessons = Array.from(this.lessonsData.values())
      .filter(lesson => lesson.teacherId === teacherId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return Promise.all(lessons.map(async lesson => {
      const details = await this.getLessonWithDetails(lesson.id);
      return details!;
    }));
  }

  async getLessonsByStudent(studentId: number): Promise<LessonWithDetails[]> {
    const lessons = Array.from(this.lessonsData.values())
      .filter(lesson => lesson.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return Promise.all(lessons.map(async lesson => {
      const details = await this.getLessonWithDetails(lesson.id);
      return details!;
    }));
  }

  async getRecentLessons(limit: number): Promise<LessonWithDetails[]> {
    const lessons = Array.from(this.lessonsData.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return Promise.all(lessons.map(async lesson => {
      const details = await this.getLessonWithDetails(lesson.id);
      return details!;
    }));
  }
  
  // Lesson Mistake methods (for teachers)
  async getLessonMistakes(): Promise<LessonMistake[]> {
    return Array.from(this.lessonMistakesData.values());
  }

  async getLessonMistake(id: number): Promise<LessonMistake | undefined> {
    return this.lessonMistakesData.get(id);
  }

  async createLessonMistake(mistakeData: InsertLessonMistake): Promise<LessonMistake> {
    const id = this.lessonMistakeIdCounter++;
    const createdAt = new Date();
    const mistake: LessonMistake = { ...mistakeData, id, createdAt };
    this.lessonMistakesData.set(id, mistake);
    return mistake;
  }

  async updateLessonMistake(id: number, mistakeData: Partial<InsertLessonMistake>): Promise<LessonMistake | undefined> {
    const mistake = this.lessonMistakesData.get(id);
    if (!mistake) return undefined;
    
    const updatedMistake: LessonMistake = { ...mistake, ...mistakeData };
    this.lessonMistakesData.set(id, updatedMistake);
    return updatedMistake;
  }

  async deleteLessonMistake(id: number): Promise<boolean> {
    return this.lessonMistakesData.delete(id);
  }

  async getLessonMistakesByLesson(lessonId: number): Promise<LessonMistake[]> {
    return Array.from(this.lessonMistakesData.values())
      .filter(mistake => mistake.lessonId === lessonId);
  }

  async getLessonMistakesByStudent(studentId: number): Promise<LessonMistake[]> {
    return Array.from(this.lessonMistakesData.values())
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
  
  async getTeacherLessonStats(teacherId: number): Promise<{ 
    totalLessons: number; 
    studentsCount: number;
    averageMistakes: number;
    completedLessons: number;
  }> {
    // Get all lessons for this teacher
    const lessons = Array.from(this.lessonsData.values())
      .filter(lesson => lesson.teacherId === teacherId);
    
    // Count total and completed lessons
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(lesson => lesson.progress === "Completed").length;
    
    // Get unique students from both lessons and direct teacher-student assignments
    const uniqueStudentIds = new Set(lessons.map(lesson => lesson.studentId));
    
    // Add students directly assigned to this teacher
    const teacherStudentRelations = Array.from(this.teacherStudentsData.values())
      .filter(rel => rel.teacherId === teacherId);
    
    teacherStudentRelations.forEach(relation => {
      uniqueStudentIds.add(relation.studentId);
    });
    
    const studentsCount = uniqueStudentIds.size;
    
    // Calculate average mistakes per lesson
    let totalMistakes = 0;
    for (const lesson of lessons) {
      const lessonMistakes = await this.getLessonMistakesByLesson(lesson.id);
      totalMistakes += lessonMistakes.length;
    }
    
    const averageMistakes = totalLessons > 0 
      ? parseFloat((totalMistakes / totalLessons).toFixed(1)) 
      : 0;
    
    return {
      totalLessons,
      studentsCount,
      averageMistakes,
      completedLessons
    };
  }

  async getStudentLessonProgress(studentId: number, days: number): Promise<{ 
    date: string; 
    lessonsCount: number; 
    mistakesCount: number;
  }[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const results: { date: string; lessonsCount: number; mistakesCount: number }[] = [];
    
    // Initialize all dates with zero counts
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      results.push({ date: dateStr, lessonsCount: 0, mistakesCount: 0 });
    }
    
    // Get lessons for the specific student
    const lessons = Array.from(this.lessonsData.values())
      .filter(lesson => lesson.studentId === studentId);
    
    // Calculate lesson counts by date
    for (const lesson of lessons) {
      const lessonDate = new Date(lesson.date).toISOString().split('T')[0];
      const resultItem = results.find(item => item.date === lessonDate);
      
      if (resultItem) {
        resultItem.lessonsCount += 1;
        
        // Count mistakes for this lesson
        const lessonMistakes = await this.getLessonMistakesByLesson(lesson.id);
        resultItem.mistakesCount += lessonMistakes.length;
      }
    }
    
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
        // Use type assertion with a type guard to ensure valid MistakeType
        const mistakeType = mistake.type;
        if (mistakeType === "tajweed" || mistakeType === "word" || mistakeType === "stuck") {
          resultItem.mistakeType = mistakeType;
        }
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
    // Sample users (both teachers and students)
    const sampleUsers: InsertUser[] = [
      // Teachers
      { username: "teacher1", name: "Ustadh Ahmed", role: "teacher" },
      { username: "teacher2", name: "Ustadha Fatima", role: "teacher" },
      // Students
      { username: "student1", name: "Ahmad Hassan", role: "student" },
      { username: "student2", name: "Ibrahim Omar", role: "student" },
      { username: "student3", name: "Yusuf Ali", role: "student" },
      { username: "student4", name: "Mohammed Siddiq", role: "student" }
    ];

    // Create users and keep track of their IDs
    const userIds: Record<string, number> = {};
    sampleUsers.forEach(user => {
      this.createUser(user).then(createdUser => {
        userIds[user.username] = createdUser.id;
      });
    });

    // Sample students with references to user accounts
    const sampleStudents: InsertStudent[] = [
      { name: "Ahmad Hassan", userId: 3, grade: "3", currentJuz: 5, currentSurah: "Al-Baqarah", notes: "" },
      { name: "Ibrahim Omar", userId: 4, grade: "3", currentJuz: 7, currentSurah: "Al-A'raf", notes: "" },
      { name: "Yusuf Ali", userId: 5, grade: "2", currentJuz: 3, currentSurah: "Al-Baqarah", notes: "" },
      { name: "Mohammed Siddiq", userId: 6, grade: "2", currentJuz: 2, currentSurah: "Al-Baqarah", notes: "" }
    ];

    // Create students
    sampleStudents.forEach(student => this.createStudent(student));
    
    // Assign teachers to students
    setTimeout(() => {
      // Teacher 1 assigned to students 1 and 2
      this.assignTeacherToStudent(1, 1);
      this.assignTeacherToStudent(1, 2);
      
      // Teacher 2 assigned to students 3 and 4
      this.assignTeacherToStudent(2, 3);
      this.assignTeacherToStudent(2, 4);
    }, 100); // Small delay to ensure users and students are created first

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
