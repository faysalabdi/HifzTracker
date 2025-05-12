import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MistakeItem } from "@/components/ui/mistake-item";
import { EditStudentDialog } from "@/components/ui/edit-student-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  User, 
  BookOpen, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Edit,
  AlertTriangle,
  FileText,
  BarChart2,
  Trash2
} from "lucide-react";

import { SessionWithDetails, StudentWithStats, Mistake } from "@shared/schema";
import { formatDate, getInitials, getMistakeTypeLabel } from "@/lib/constants";

export default function StudentDetail() {
  const [, params] = useRoute<{ id: string }>("/students/:id");
  const studentId = params ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch student data
  const { data: student, isLoading: isLoadingStudent } = useQuery<StudentWithStats>({
    queryKey: [`/api/students/${studentId}/stats`],
    enabled: !!studentId
  });

  // Fetch student's sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<SessionWithDetails[]>({
    queryKey: [`/api/sessions/student/${studentId}`],
    enabled: !!studentId
  });

  // Fetch student's mistakes
  const { data: mistakes, isLoading: isLoadingMistakes } = useQuery<Mistake[]>({
    queryKey: [`/api/mistakes/student/${studentId}`],
    enabled: !!studentId
  });

  // Calculate mistake type distribution
  const calculateMistakeDistribution = (mistakes: Mistake[] | undefined) => {
    if (!mistakes || mistakes.length === 0) return {};
    
    const distribution: Record<string, number> = {};
    mistakes.forEach(mistake => {
      distribution[mistake.type] = (distribution[mistake.type] || 0) + 1;
    });
    
    const total = mistakes.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = Math.round((distribution[key] / total) * 100);
    });
    
    return distribution;
  };

  const mistakeDistribution = calculateMistakeDistribution(mistakes);

  // Get color class for a specific mistake count
  const getMistakeCountColor = (count: number) => {
    if (count <= 5) return "bg-success text-success bg-opacity-10";
    if (count <= 10) return "bg-warning text-warning bg-opacity-10";
    return "bg-error text-error bg-opacity-10";
  };

  // Get avatar bg color based on student name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-primary-50 text-primary-500",
      "bg-secondary-50 text-secondary-500",
      "bg-accent-50 text-accent-500"
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  if (isLoadingStudent) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading student information...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-semibold mb-2">Student Not Found</h2>
          <p className="text-neutral-600 mb-6">The student you're looking for doesn't exist or has been removed.</p>
          <Link href="/students">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/students">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-heading font-semibold">Student Profile</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className={`w-20 h-20 rounded-full ${getAvatarColor(student.name)} flex items-center justify-center font-semibold text-2xl`}>
                  {getInitials(student.name)}
                </div>
                <div className="flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3 className="text-2xl font-heading font-semibold">{student.name}</h3>
                    <Button variant="outline" size="sm" className="sm:ml-auto">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Badge variant="outline" className="bg-neutral-50">
                      <BookOpen className="mr-1 h-3 w-3" /> Grade {student.grade}
                    </Badge>
                    <Badge variant="outline" className="bg-primary-50 text-primary-500 hover:bg-primary-50">
                      <BookOpen className="mr-1 h-3 w-3" /> Juz {student.currentJuz}
                    </Badge>
                    <Badge variant="outline" className="bg-secondary-50 text-secondary-500 hover:bg-secondary-50">
                      <FileText className="mr-1 h-3 w-3" /> {student.currentSurah}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 mb-1">Sessions</p>
                      <p className="font-medium">{student.sessionCount} total</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 mb-1">Avg. Mistakes</p>
                      <p className="font-medium">{student.averageMistakes.toFixed(1)} per session</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 mb-1">Most Common Mistake</p>
                      <p className="font-medium">
                        {student.mostCommonMistakeType 
                          ? getMistakeTypeLabel(student.mostCommonMistakeType) 
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Quran Completion</span>
                  <span>{Math.round((student.currentJuz / 30) * 100)}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full" 
                    style={{ width: `${(student.currentJuz / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {Object.keys(mistakeDistribution).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Mistake Distribution</h4>
                  {Object.entries(mistakeDistribution).map(([type, percentage]) => (
                    <div key={type} className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{getMistakeTypeLabel(type)}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${getMistakeTypeBarColor(type)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                  {student.notes || "No notes available for this student."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest revision sessions and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="text-center py-4">Loading sessions...</div>
              ) : sessions && sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-start gap-4 pb-4 border-b border-neutral-100 last:border-0">
                      <div className="bg-neutral-100 rounded-full p-2">
                        <Calendar className="h-5 w-5 text-neutral-600" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Revision Session</h4>
                          <span className="text-sm text-neutral-500">{formatDate(session.date)}</span>
                        </div>
                        <p className="text-sm text-neutral-600">
                          {session.surahStart} {session.ayahStart} - {session.surahEnd} {session.ayahEnd}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getMistakeCountColor(session.mistakeCount)}`}>
                            {session.mistakeCount} mistakes
                          </span>
                          <Link href={`/sessions/${session.id}`}>
                            <a className="text-primary-500 text-xs font-medium">View Details</a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">No recent activity found</div>
              )}
            </CardContent>
            {sessions && sessions.length > 3 && (
              <CardFooter className="border-t border-neutral-100 pt-4">
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("sessions")}>
                  View All Sessions
                </Button>
              </CardFooter>
            )}
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60 flex flex-col justify-center">
                  {isLoadingMistakes ? (
                    <div className="text-center py-4">Loading performance data...</div>
                  ) : mistakes && mistakes.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-center gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary-500 mb-1">{student.sessionCount}</div>
                          <p className="text-sm text-neutral-500">Total Sessions</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-accent-500 mb-1">{mistakes.length}</div>
                          <p className="text-sm text-neutral-500">Total Mistakes</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-secondary-500 mb-1">
                            {student.averageMistakes.toFixed(1)}
                          </div>
                          <p className="text-sm text-neutral-500">Avg. Mistakes</p>
                        </div>
                      </div>
                      
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Improvement Areas</h4>
                        <ul className="list-disc pl-5 text-sm space-y-1 text-neutral-600">
                          {student.mostCommonMistakeType === 'tajweed' && (
                            <li>Focus on practicing tajweed rules, especially for common letters</li>
                          )}
                          {student.mostCommonMistakeType === 'word' && (
                            <li>Work on vocabulary and word recognition exercises</li>
                          )}
                          {student.mostCommonMistakeType === 'stuck' && (
                            <li>Practice fluency with short passages before combining</li>
                          )}
                          <li>Regular revision of pages {student.currentJuz * 20 - 10} to {student.currentJuz * 20}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500">
                      No performance data available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Study Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=180" 
                  alt="Students studying together" 
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
                <div className="space-y-3">
                  <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-primary-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-sm mb-1">Recommended Practice</h5>
                      <p className="text-xs text-neutral-600">Focus on {student.currentSurah}, pages {student.currentJuz * 20 - 19} to {student.currentJuz * 20}</p>
                    </div>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                    <Clock className="h-5 w-5 text-accent-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-sm mb-1">Suggested Schedule</h5>
                      <p className="text-xs text-neutral-600">Daily revision of 2-3 pages for 20 minutes</p>
                    </div>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                    <BarChart2 className="h-5 w-5 text-secondary-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-sm mb-1">Progress Goal</h5>
                      <p className="text-xs text-neutral-600">Complete current Juz with less than 5 mistakes per page</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Sessions</CardTitle>
              <CardDescription>Complete history of revision sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingSessions ? (
                <div className="text-center py-4">Loading sessions...</div>
              ) : sessions && sessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Partner</th>
                        <th className="px-4 py-3 text-left">Surah</th>
                        <th className="px-4 py-3 text-left">Ayah</th>
                        <th className="px-4 py-3 text-left">Mistakes</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {sessions.map((session) => (
                        <tr key={session.id} className="border-b border-neutral-100">
                          <td className="px-4 py-3">{format(new Date(session.date), 'PPP')}</td>
                          <td className="px-4 py-3">
                            Partner
                          </td>
                          <td className="px-4 py-3">{session.surahStart}</td>
                          <td className="px-4 py-3">{session.ayahStart}-{session.ayahEnd}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMistakeCountColor(session.mistakeCount)}`}>
                              {session.mistakeCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={session.completed ? "default" : "outline"}>
                              {session.completed ? "Completed" : "Draft"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/sessions/${session.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">No sessions found for this student</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mistakes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Mistakes</CardTitle>
              <CardDescription>Complete record of mistakes during revision</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMistakes ? (
                <div className="text-center py-4">Loading mistakes...</div>
              ) : mistakes && mistakes.length > 0 ? (
                <div className="space-y-3">
                  {mistakes.map((mistake) => (
                    <MistakeItem 
                      key={mistake.id} 
                      mistake={mistake} 
                      sessionId={mistake.sessionId} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">No mistakes recorded for this student</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getMistakeTypeBarColor(type: string) {
  switch (type) {
    case 'tajweed':
      return 'bg-error';
    case 'word':
      return 'bg-warning';
    case 'hesitation':
      return 'bg-accent-500';
    default:
      return 'bg-primary-500';
  }
}
