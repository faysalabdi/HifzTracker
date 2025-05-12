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
  
  // Fetch session details
  const { data: session, isLoading: isLoadingSession } = useQuery<SessionWithDetails>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: sessionId > 0
  });
  
  // Fetch mistakes for this session
  const { data: mistakes = [], isLoading: isLoadingMistakes } = useQuery<Mistake[]>({
    queryKey: [`/api/mistakes/session/${sessionId}`],
    enabled: sessionId > 0
  });

  // Filter mistakes by student
  const student1Mistakes = mistakes.filter(m => m.studentId === session?.student1Id);
  const student2Mistakes = mistakes.filter(m => m.studentId === session?.student2Id);
  
  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/sessions/${sessionId}/complete`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      toast({
        title: "Session completed",
        description: "The session has been marked as complete."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/recent'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete the session.",
        variant: "destructive"
      });
    }
  });
  
  // Helper function to get color based on mistake count
  function getMistakeCountColor(count: number): string {
    if (count === 0) return "text-primary-500";
    if (count <= 2) return "text-amber-500";
    return "text-error";
  }
  
  // Helper function to get random color for avatars
  function getAvatarColor(name: string): string {
    const colors = [
      "bg-primary-100 text-primary-800",
      "bg-secondary-100 text-secondary-800",
      "bg-accent-100 text-accent-800",
      "bg-sky-100 text-sky-800",
      "bg-lime-100 text-lime-800"
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }
  
  // Handle editing a mistake
  const handleEditMistake = (mistake: Mistake) => {
    setEditingMistake(mistake);
    setActiveStudentId(mistake.studentId);
    setShowAddMistakeDialog(true);
  };
  
  if (isLoadingSession) {
    return (
      <div className="py-10 flex justify-center">
        <p>Loading session details...</p>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="py-10 flex flex-col items-center">
        <p className="mb-4">Session not found</p>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Session Details</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
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
                    <p className="font-medium">{mistakes.length}</p>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <Users className="h-5 w-5 text-secondary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Students</p>
                    <p className="font-medium">{session.student1.name}, {session.student2.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              
              {!session.completed && (
                <div className="bg-neutral-50 rounded-lg p-4 flex items-center justify-between border border-neutral-200">
                  <div>
                    <h3 className="font-medium mb-1">Ready to Complete</h3>
                    <p className="text-sm text-neutral-600">Once completed, no more mistakes can be added to this session.</p>
                  </div>
                  <Button 
                    onClick={() => completeSessionMutation.mutate()}
                    disabled={completeSessionMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {completeSessionMutation.isPending ? "Completing..." : "Complete Session"}
                  </Button>
                </div>
              )}
            </CardContent>
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
                  {/* Display specific Ayat based on Surah/Ayah information */}
                  {session.surahStart === "Al-Fatiha" ? 
                    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ مَٰلِكِ يَوْمِ ٱلدِّينِ"
                  : session.surahStart === "Al-Ikhlas" ?
                    "قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ"
                  : session.surahStart === "Al-Asr" ?
                    "وَٱلْعَصْرِ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ"
                  : session.surahStart === "Al-Baqarah" && session.ayahStart <= 5 ?
                    "الٓمٓ ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ"
                  : session.surahStart === "Al-Baqarah" ?
                    "... مُّحَمَّدٌ رَّسُولُ ٱللَّهِ ۚ وَٱلَّذِينَ مَعَهُۥٓ أَشِدَّآءُ عَلَى ٱلْكُفَّارِ رُحَمَآءُ بَيْنَهُمْ ..."
                  : session.surahStart === session.surahEnd ?
                    "... إِنَّ اللَّهَ وَمَلائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا ..."
                  :
                    "... مِن شَرِّ مَا خَلَقَ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ..."
                  }
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
                <Plus className="h-4 w-4 mr-1" />
                Add Mistake
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {student1Mistakes.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                No mistakes recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {student1Mistakes.map(mistake => (
                  <MistakeItem 
                    key={mistake.id} 
                    mistake={mistake} 
                    sessionId={sessionId}
                    onEdit={() => handleEditMistake(mistake)}
                  />
                ))}
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
                <Plus className="h-4 w-4 mr-1" />
                Add Mistake
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {student2Mistakes.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                No mistakes recorded yet
              </div>
            ) : (
              <div className="space-y-3">
                {student2Mistakes.map(mistake => (
                  <MistakeItem 
                    key={mistake.id} 
                    mistake={mistake} 
                    sessionId={sessionId}
                    onEdit={() => handleEditMistake(mistake)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {showAddMistakeDialog && activeStudentId && (
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