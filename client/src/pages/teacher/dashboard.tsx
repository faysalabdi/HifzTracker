import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataCard } from "@/components/ui/data-card";
import { formatDate } from "@/lib/constants";
import { 
  UserPlus, 
  Users, 
  Book, 
  BookOpen, 
  Calendar, 
  CheckCircle,
  AlertTriangle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Teacher Dashboard shows assigned students and lesson progression
export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get current authenticated user (teacher)
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  // Get teacher stats
  const { data: teacherStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/teacher/stats", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  // Get assigned students
  const { data: assignedStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/teacher/students", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  // Get recent lessons
  const { data: recentLessons, isLoading: isLoadingLessons } = useQuery({
    queryKey: ["/api/teacher/lessons/recent", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  const isLoading = isLoadingUser || isLoadingStats || isLoadingStudents || isLoadingLessons;
  
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl mb-2">Loading teacher dashboard...</h2>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Teacher Dashboard</h1>
          <p className="text-neutral-500">Welcome back, {currentUser?.name}</p>
        </div>
        
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Lesson
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="students" className="flex-1">Students</TabsTrigger>
          <TabsTrigger value="lessons" className="flex-1">Lessons</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataCard
              icon={<Users className="text-primary-500 h-6 w-6" />}
              iconBackground="bg-primary-50"
              title="Assigned Students"
              value={teacherStats?.studentsCount || 0}
            />
            
            <DataCard
              icon={<BookOpen className="text-secondary-500 h-6 w-6" />}
              iconBackground="bg-secondary-50"
              title="Total Lessons"
              value={teacherStats?.totalLessons || 0}
            />
            
            <DataCard
              icon={<AlertTriangle className="text-accent-500 h-6 w-6" />}
              iconBackground="bg-accent-50"
              title="Avg. Mistakes"
              value={teacherStats?.averageMistakes || 0}
            />
          </div>
          
          {/* Recent Lessons */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Lessons</CardTitle>
              <CardDescription>Your latest teaching sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLessons && recentLessons.length > 0 ? (
                <div className="space-y-4">
                  {recentLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback className="bg-primary-50 text-primary-600">
                            {lesson.student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{lesson.student.name}</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-neutral-500">{formatDate(lesson.date)}</span>
                            <span className="text-neutral-500">• Surah {lesson.surahStart}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Badge className={
                          lesson.progress === "Completed" ? "bg-green-100 text-green-800" :
                          lesson.progress === "In Progress" ? "bg-amber-100 text-amber-800" :
                          "bg-neutral-100 text-neutral-800"
                        }>
                          {lesson.progress}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No recent lessons found
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-center">
              <Link href="/teacher/lessons">
                <Button variant="outline">View All Lessons</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Assigned Students</h3>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              <UserPlus className="mr-2 h-4 w-4" />
              Assign New Student
            </Button>
          </div>
          
          {assignedStudents && assignedStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback className="bg-primary-50 text-primary-600">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{student.name}</h4>
                          <p className="text-sm text-neutral-500">Grade {student.grade}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {student.sessionCount} Sessions
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Current Juz</span>
                        <span>{student.currentJuz}/30</span>
                      </div>
                      <Progress value={(student.currentJuz / 30) * 100} className="h-2" />
                    </div>
                    
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>Current Surah</span>
                        <span>{student.currentSurah || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Mistakes</span>
                        <span className="font-medium text-amber-600">{student.averageMistakes.toFixed(1)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex space-x-2 w-full">
                      <Button variant="outline" className="flex-1">Student Profile</Button>
                      <Button className="flex-1 bg-blue-500 hover:bg-blue-600">New Lesson</Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <h4 className="text-lg font-medium mb-2">No students assigned yet</h4>
                <p className="text-neutral-500 mb-4">Start by assigning students to track their progress</p>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Students
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="lessons" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Lessons</h3>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Book className="mr-2 h-4 w-4" />
              New Lesson
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Lessons</CardTitle>
              <CardDescription>Track and manage your lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Range</th>
                      <th className="px-4 py-3 text-left">Mistakes</th>
                      <th className="px-4 py-3 text-left">Progress</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentLessons && recentLessons.length > 0 ? (
                      recentLessons.map((lesson) => (
                        <tr key={lesson.id} className="border-b border-neutral-100">
                          <td className="px-4 py-3">{lesson.student.name}</td>
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
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">View</Button>
                              <Button 
                                size="sm"
                                className={lesson.progress === "Completed" ? 
                                  "bg-neutral-200 text-neutral-600" : 
                                  "bg-green-500 hover:bg-green-600"}
                                disabled={lesson.progress === "Completed"}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-center">No lessons found</td>
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