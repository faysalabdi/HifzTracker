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
import { Badge } from "@/components/ui/badge";
import { MistakeItem } from "@/components/ui/mistake-item";
import { AddMistakeDialog } from "@/components/ui/add-mistake-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  AlertTriangle,
  Calendar,
  Clock,
  BookOpen,
  Users,
  FileText,
  CheckCircle,
  Plus
} from "lucide-react";

import { formatDate, getInitials } from "@/lib/constants";
import { SessionWithDetails, Mistake } from "@shared/schema";

export default function SessionDetail() {
  const [, params] = useRoute<{ id: string }>("/sessions/:id");
  const sessionId = params ? parseInt(params.id) : 0;
  const [showAddMistakeDialog, setShowAddMistakeDialog] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  const [editingMistake, setEditingMistake] = useState<Mistake | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session data
  const { data: session, isLoading: isLoadingSession } = useQuery<SessionWithDetails>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId
  });

  // Fetch mistakes for this session
  const { data: mistakes, isLoading: isLoadingMistakes } = useQuery<Mistake[]>({
    queryKey: [`/api/mistakes/session/${sessionId}`],
    enabled: !!sessionId
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/sessions/${sessionId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/recent"] });
      toast({
        title: "Session completed",
        description: "The revision session has been marked as complete",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete session",
        variant: "destructive",
      });
    }
  });

  // Filter mistakes by student
  const student1Mistakes = mistakes?.filter(m => m.studentId === session?.student1Id) || [];
  const student2Mistakes = mistakes?.filter(m => m.studentId === session?.student2Id) || [];

  // Handle edit mistake
  const handleEditMistake = (mistake: Mistake) => {
    setEditingMistake(mistake);
    setActiveStudentId(mistake.studentId);
    setShowAddMistakeDialog(true);
  };

  // Get avatar color based on name
  const getAvatarColor = (name?: string) => {
    if (!name) return "bg-primary-50 text-primary-500";
    const colors = [
      "bg-primary-50 text-primary-500",
      "bg-secondary-50 text-secondary-500",
      "bg-accent-50 text-accent-500"
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Get mistake count color class
  const getMistakeCountColor = (count: number) => {
    if (count <= 3) return "text-success";
    if (count <= 7) return "text-warning";
    return "text-error";
  };

  if (isLoadingSession) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading session information...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-semibold mb-2">Session Not Found</h2>
          <p className="text-neutral-600 mb-6">The session you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-heading font-semibold">Session Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Session Information</CardTitle>
                <Badge variant={session.completed ? "default" : "outline"}>
                  {session.completed ? "Completed" : "Draft"}
                </Badge>
              </div>
              <CardDescription>
                Created on {format(new Date(session.date), 'PPP')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Date</p>
                    <p className="font-medium">{formatDate(session.date)}</p>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Time</p>
                    <p className="font-medium">{format(new Date(session.date), 'h:mm a')}</p>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <FileText className="h-5 w-5 text-accent-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Surah/Ayah (Start)</p>
                    <p className="font-medium">{session.surahStart} {session.ayahStart}</p>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <FileText className="h-5 w-5 text-accent-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Surah/Ayah (End)</p>
                    <p className="font-medium">{session.surahEnd} {session.ayahEnd}</p>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Total Mistakes</p>
                    <p className="font-medium">{session.mistakeCount}</p>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Status</p>
                    <p className="font-medium">{session.completed ? "Completed" : "In Progress"}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${getAvatarColor(session.student1.name)} flex items-center justify-center font-semibold text-lg`}>
                        {getInitials(session.student1.name)}
                      </div>
                      <div>
                        <h3 className="font-medium">{session.student1.name}</h3>
                        <div className="flex items-center">
                          <p className="text-sm text-neutral-500">
                            Mistakes: <span className={getMistakeCountColor(student1Mistakes.length)}>
                              {student1Mistakes.length}
                            </span>
                          </p>
                          <Link href={`/students/${session.student1Id}`}>
                            <a className="text-primary-500 text-xs font-medium ml-2">View Profile</a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${getAvatarColor(session.student2.name)} flex items-center justify-center font-semibold text-lg`}>
                        {getInitials(session.student2.name)}
                      </div>
                      <div>
                        <h3 className="font-medium">{session.student2.name}</h3>
                        <div className="flex items-center">
                          <p className="text-sm text-neutral-500">
                            Mistakes: <span className={getMistakeCountColor(student2Mistakes.length)}>
                              {student2Mistakes.length}
                            </span>
                          </p>
                          <Link href={`/students/${session.student2Id}`}>
                            <a className="text-primary-500 text-xs font-medium ml-2">View Profile</a>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            
            {!session.completed && (
              <CardFooter className="border-t border-neutral-100 pt-4">
                <Button 
                  className="w-full"
                  onClick={() => completeSessionMutation.mutate()}
                  disabled={completeSessionMutation.isPending}
                >
                  {completeSessionMutation.isPending ? "Completing..." : "Complete Session"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quran Reference</CardTitle>
            <CardDescription>Surah {session.surahStart} Ayah {session.ayahStart} - Surah {session.surahEnd} Ayah {session.ayahEnd}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg overflow-hidden mb-6 p-6 ${
              session.id % 3 === 0 
                ? "bg-gradient-to-r from-teal-50 to-emerald-50 border-l-4 border-emerald-500" 
                : session.id % 3 === 1 
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500" 
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500"
            }`}>
              <div className="flex items-start mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  session.id % 3 === 0 
                    ? "bg-emerald-100 text-emerald-700" 
                    : session.id % 3 === 1 
                      ? "bg-amber-100 text-amber-700" 
                      : "bg-blue-100 text-blue-700"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold mb-1 ${
                    session.id % 3 === 0 
                      ? "text-emerald-800" 
                      : session.id % 3 === 1 
                        ? "text-amber-800" 
                        : "text-blue-800"
                  }`}>Revision Session #{session.id}</h3>
                  <p className="text-sm text-gray-600">{format(new Date(session.date), 'PPP')}</p>
                </div>
              </div>
              
              <div dir="rtl" className="text-center font-['Amiri'] text-xl leading-loose p-4 rounded-lg mb-4 bg-white bg-opacity-60">
                <div className={`mb-3 text-sm font-sans text-center ${
                  session.id % 3 === 0 
                    ? "text-emerald-600" 
                    : session.id % 3 === 1 
                      ? "text-amber-600" 
                      : "text-blue-600"
                }`}>
                  {session.surahStart} {session.ayahStart} - {session.surahEnd} {session.ayahEnd}
                </div>
                <div className="text-neutral-800">
                  {session.id % 3 === 0 
                    ? "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\nٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ\nٱلرَّحْمَٰنِ ٱلرَّحِيمِ\nمَٰلِكِ يَوْمِ ٱلدِّينِ"
                    : session.id % 3 === 1 
                      ? "قُلْ هُوَ ٱللَّهُ أَحَدٌ\nٱللَّهُ ٱلصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ"
                      : "وَٱلْعَصْرِ\nإِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ\nإِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ"}
                </div>
              </div>
              
              <p className={`text-sm ${
                session.id % 3 === 0 
                  ? "text-emerald-600" 
                  : session.id % 3 === 1 
                    ? "text-amber-600" 
                    : "text-blue-600"
              } text-center`}>
                Use the reference to identify passages where mistakes were made
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">
                {session.student1.name}'s Mistakes
              </CardTitle>
              <CardDescription>
                {student1Mistakes.length} mistakes recorded
              </CardDescription>
            </div>
            {!session.completed && (
              <Button 
                size="sm"
                onClick={() => {
                  setActiveStudentId(session.student1Id);
                  setEditingMistake(undefined);
                  setShowAddMistakeDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Mistake
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingMistakes ? (
              <div className="text-center py-4">Loading mistakes...</div>
            ) : student1Mistakes.length > 0 ? (
              <div className="space-y-3">
                {student1Mistakes.map((mistake) => (
                  <MistakeItem 
                    key={mistake.id} 
                    mistake={mistake}
                    sessionId={sessionId}
                    onEdit={!session.completed ? () => handleEditMistake(mistake) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No mistakes recorded for this student
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">
                {session.student2.name}'s Mistakes
              </CardTitle>
              <CardDescription>
                {student2Mistakes.length} mistakes recorded
              </CardDescription>
            </div>
            {!session.completed && (
              <Button 
                size="sm"
                onClick={() => {
                  setActiveStudentId(session.student2Id);
                  setEditingMistake(undefined);
                  setShowAddMistakeDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Mistake
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingMistakes ? (
              <div className="text-center py-4">Loading mistakes...</div>
            ) : student2Mistakes.length > 0 ? (
              <div className="space-y-3">
                {student2Mistakes.map((mistake) => (
                  <MistakeItem 
                    key={mistake.id} 
                    mistake={mistake}
                    sessionId={sessionId}
                    onEdit={!session.completed ? () => handleEditMistake(mistake) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No mistakes recorded for this student
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Mistake Dialog */}
      {activeStudentId && (
        <AddMistakeDialog
          isOpen={showAddMistakeDialog}
          onClose={() => {
            setShowAddMistakeDialog(false);
            setEditingMistake(undefined);
          }}
          sessionId={sessionId}
          studentId={activeStudentId}
          editingMistake={editingMistake}
        />
      )}
    </div>
  );
}
