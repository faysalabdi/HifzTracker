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
                  <BookOpen className="h-5 w-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Pages</p>
                    <p className="font-medium">{session.pageStart}-{session.pageEnd}</p>
                  </div>
                </div>
                
                <div className="bg-neutral-50 p-3 rounded-lg flex items-start gap-3">
                  <FileText className="h-5 w-5 text-accent-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Surah</p>
                    <p className="font-medium">{session.surah}</p>
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
            <CardDescription>Pages {session.pageStart}-{session.pageEnd} of {session.surah}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
              <img 
                src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
                alt="Quran page with Arabic text" 
                className="w-full h-40 object-cover"
              />
              <div className="p-4 bg-neutral-50">
                <div dir="rtl" className="text-center font-['Amiri'] text-lg leading-loose mb-2 text-neutral-800">
                  وَلَقَدْ آتَيْنَا مُوسَى الْكِتَابَ وَقَفَّيْنَا مِن بَعْدِهِ بِالرُّسُلِ ۖ وَآتَيْنَا عِيسَى ابْنَ مَرْيَمَ الْبَيِّنَاتِ وَأَيَّدْنَاهُ بِرُوحِ الْقُدُسِ
                </div>
                <div className="flex justify-between items-center text-sm text-neutral-500">
                  <span>{session.surah} (2:87)</span>
                  <span>Page {session.pageStart}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-3">
                Use the reference to identify passages where mistakes were made.
              </p>
              <img 
                src="https://pixabay.com/get/g9069e65962bb692d3afc99c42030ae943f2a26404b029f12fc428f483a00678f5c0118f73b2639d7cb0444f542e20ae0e1b019a6684576149a5ccbc6cc85c9d8_1280.jpg" 
                alt="Quran text with tajweed markings" 
                className="w-full h-32 object-cover rounded-lg" 
              />
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
