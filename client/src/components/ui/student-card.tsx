import { useState } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Student, StudentWithStats } from "@shared/schema";
import { getInitials } from "@/lib/constants";
import { EditStudentDialog } from "@/components/ui/edit-student-dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudentCardProps {
  student: StudentWithStats;
}

export function StudentCard({ student }: StudentCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/students/${student.id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "The student has been deleted successfully."
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/stats'] });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive"
      });
      setShowDeleteDialog(false);
    }
  });

  // Get background color for avatar based on name
  const getAvatarColor = () => {
    const colors = [
      "bg-primary-50 text-primary-500",
      "bg-secondary-50 text-secondary-500",
      "bg-accent-50 text-accent-500",
    ];
    const index = student.name.length % colors.length;
    return colors[index];
  };

  const getMistakeColor = (avgMistakes: number) => {
    if (avgMistakes <= 3) return "text-success";
    if (avgMistakes <= 7) return "text-warning";
    return "text-error";
  };

  const getJuzProgress = (juz: number) => {
    // Assuming 30 juz total
    return (juz / 30) * 100;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-neutral-100 p-4 flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${getAvatarColor()} flex items-center justify-center font-semibold text-lg`}>
          {getInitials(student.name)}
        </div>
        <div>
          <h3 className="font-medium">{student.name}</h3>
          <p className="text-sm text-neutral-500">Juz {student.currentJuz}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-auto text-neutral-400 hover:text-neutral-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/students/${student.id}`}>
              <DropdownMenuItem>View Profile</DropdownMenuItem>
            </Link>
            <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
              Edit Student
            </DropdownMenuItem>
            <DropdownMenuItem 
              onSelect={() => setShowDeleteDialog(true)}
              className="text-red-500"
            >
              Delete Student
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-neutral-50 rounded p-2">
            <p className="text-xs text-neutral-500">Current Surah</p>
            <p className="font-medium">{student.currentSurah || "N/A"}</p>
          </div>
          <div className="bg-neutral-50 rounded p-2">
            <p className="text-xs text-neutral-500">Sessions</p>
            <p className="font-medium">{student.sessionCount}</p>
          </div>
        </div>
        <div className="mb-3">
          <p className="text-sm font-medium mb-1">Progress</p>
          <div className="w-full bg-neutral-100 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full" 
              style={{ width: `${getJuzProgress(student.currentJuz)}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-3 border-t border-neutral-100 flex justify-between items-center">
        <span className="text-xs text-neutral-500">
          Recent mistakes: <span className={`font-medium ${getMistakeColor(student.averageMistakes)}`}>
            {Math.round(student.averageMistakes * student.sessionCount)}
          </span>
        </span>
        <Link href={`/students/${student.id}`}>
          <a className="text-primary-500 text-sm font-medium">View Profile</a>
        </Link>
      </CardFooter>
      
      {/* Edit Student Dialog */}
      {showEditDialog && (
        <EditStudentDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          student={student}
        />
      )}
      
      {/* Delete Student Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {student.name}'s record and all associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStudentMutation.mutate()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
