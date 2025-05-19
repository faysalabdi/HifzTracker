import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataCard } from "@/components/ui/data-card";
import { formatDate } from "@/lib/constants";
import { LogoutButton } from "@/components/ui/logout-button";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  AlertTriangle,
  Award,
  BookMarked,
  Book
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Student Dashboard shows teacher lessons and peer revision sessions
export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [, navigate] = useLocation();
  
  // Get current authenticated user (student)
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  // Get student details with stats
  const { data: studentDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["/api/students/details", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  // Get teacher lessons
  const { data: teacherLessons, isLoading: isLoadingLessons } = useQuery({
    queryKey: ["/api/student/lessons", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  // Get recent revision sessions
  const { data: recentSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/student/sessions/recent", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  // Get assigned teacher
  const { data: assignedTeacher, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["/api/student/teacher", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  const isLoading = isLoadingUser || isLoadingDetails || isLoadingLessons || 
                    isLoadingSessions || isLoadingTeacher;
  
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl mb-2">Loading student dashboard...</h2>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Student Dashboard</h1>
          <p className="text-neutral-500">Welcome back, {currentUser?.name}</p>
        </div>
        
        <div className="flex gap-2">
          <LogoutButton />
          
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => navigate("/student/new-session")}>
            <Calendar className="mr-2 h-4 w-4" />
            New Revision Session
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="lessons" className="flex-1">Teacher Lessons</TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1">Revision Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataCard
              icon={<BookOpen className="text-primary-500 h-6 w-6" />}
              iconBackground="bg-primary-50"
              title="Current Juz"
              value={studentDetails?.currentJuz || 0}
            />
            
            <DataCard
              icon={<Users className="text-secondary-500 h-6 w-6" />}
              iconBackground="bg-secondary-50"
              title="Total Sessions"
              value={studentDetails?.sessionCount || 0}
            />
            
            <DataCard
              icon={<AlertTriangle className="text-accent-500 h-6 w-6" />}
              iconBackground="bg-accent-50"
              title="Avg. Mistakes"
              value={studentDetails?.averageMistakes.toFixed(1) || 0}
            />
          </div>
          
          {/* Current Progress */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Progress</CardTitle>
                  <CardDescription>Current status of your Hifz journey</CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800 px-3">
                  Juz {studentDetails?.currentJuz}/30
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>{Math.round((studentDetails?.currentJuz || 0) / 30 * 100)}%</span>
                </div>
                <Progress value={(studentDetails?.currentJuz || 0) / 30 * 100} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Current Surah</h4>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookMarked className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">
                        {studentDetails?.currentSurah || "N/A"}
                        {studentDetails?.currentAyah ? ` : Ayah ${studentDetails.currentAyah}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-neutral-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">Your Teacher</h4>
                  {assignedTeacher ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary-500 text-white text-xs">
                          {assignedTeacher.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{assignedTeacher.name}</span>
                    </div>
                  ) : (
                    <span className="text-neutral-500">No teacher assigned yet</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest revision sessions and lessons</CardDescription>
            </CardHeader>
            <CardContent>
              {(recentSessions && recentSessions.length > 0) || 
               (teacherLessons && teacherLessons.length > 0) ? (
                <div className="space-y-4">
                  {/* Show recent teacher lessons */}
                  {teacherLessons && teacherLessons.slice(0, 2).map((lesson) => (
                    <div key={`lesson-${lesson.id}`} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Lesson with {lesson.teacher.name}</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-neutral-500">{formatDate(lesson.date)}</span>
                            <span className="text-neutral-500">• {lesson.surahStart}:{lesson.ayahStart}-{lesson.ayahEnd}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={
                        lesson.progress === "Completed" ? "bg-green-100 text-green-800" :
                        lesson.progress === "In Progress" ? "bg-amber-100 text-amber-800" :
                        "bg-neutral-100 text-neutral-800"
                      }>
                        {lesson.progress}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Show recent revision sessions */}
                  {recentSessions && recentSessions.slice(0, 2).map((session) => (
                    <div key={`session-${session.id}`} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 text-green-800 p-2 rounded-full">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Revision with {
                            session.student1Id === studentDetails?.id 
                              ? session.student2.name 
                              : session.student1.name
                          }</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-neutral-500">{formatDate(session.date)}</span>
                            <span className="text-neutral-500">• {session.surahStart}:{session.ayahStart}-{session.ayahEnd}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={session.completed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                        {session.completed ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No recent activity found
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Link href="/student/sessions">
                <Button variant="outline">View All Sessions</Button>
              </Link>
              <Link href="/student/lessons">
                <Button variant="outline">View All Lessons</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="lessons" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Teacher Lessons</h3>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Teacher Lessons</CardTitle>
              <CardDescription>Lessons assigned by your teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {teacherLessons && teacherLessons.length > 0 ? (
                <div className="space-y-4">
                  {teacherLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                          <Book className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Lesson with {assignedTeacher?.name}</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-neutral-500">{formatDate(lesson.date)}</span>
                            <span className="text-neutral-500">• {lesson.surahStart}:{lesson.ayahStart} - {lesson.surahEnd}:{lesson.ayahEnd}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No lessons scheduled
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Lessons with {assignedTeacher?.name || "Teacher"}</CardTitle>
              <CardDescription>Track your progress with your teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Range</th>
                      <th className="px-4 py-3 text-left">Mistakes</th>
                      <th className="px-4 py-3 text-left">Progress</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {teacherLessons && teacherLessons.length > 0 ? (
                      teacherLessons.map((lesson) => (
                        <tr key={lesson.id} className="border-b border-neutral-100">
                          <td className="px-4 py-3">{formatDate(lesson.date)}</td>
                          <td className="px-4 py-3">
                            {lesson.surahStart}:{lesson.ayahStart} - {lesson.surahEnd}:{lesson.ayahEnd}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lesson.mistakeCount <= 3 ? "bg-green-100 text-green-800" :
                              lesson.mistakeCount <= 7 ? "bg-amber-100 text-amber-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {lesson.mistakeCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={
                              lesson.progress === "Completed" ? "bg-green-100 text-green-800" :
                              lesson.progress === "In Progress" ? "bg-amber-100 text-amber-800" :
                              "bg-neutral-100 text-neutral-800"
                            }>
                              {lesson.progress}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline">View Details</Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center">No lessons found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Revision Sessions</h3>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <BookMarked className="mr-2 h-4 w-4" />
              Create New Session
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Revision Sessions</CardTitle>
              <CardDescription>Sessions with other students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Partner</th>
                      <th className="px-4 py-3 text-left">Range</th>
                      <th className="px-4 py-3 text-left">Mistakes</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentSessions && recentSessions.length > 0 ? (
                      recentSessions.map((session) => (
                        <tr key={session.id} className="border-b border-neutral-100">
                          <td className="px-4 py-3">{formatDate(session.date)}</td>
                          <td className="px-4 py-3">
                            {session.student1Id === studentDetails?.id ? session.student2.name : session.student1.name}
                          </td>
                          <td className="px-4 py-3">
                            {session.surahStart}:{session.ayahStart} - {session.surahEnd}:{session.ayahEnd}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              session.mistakeCount <= 3 ? "bg-green-100 text-green-800" :
                              session.mistakeCount <= 7 ? "bg-amber-100 text-amber-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {session.mistakeCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={session.completed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                              {session.completed ? "Completed" : "In Progress"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">View</Button>
                              {!session.completed && (
                                <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                  Complete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-center">No sessions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}