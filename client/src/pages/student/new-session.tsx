import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { User, Student } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreateSessionDialog } from "@/components/ui/create-session-dialog";
import { ArrowLeft, Plus } from "lucide-react";

export default function NewStudentSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get current authenticated user (student)
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  // Get all students for the session creation
  const { data: allStudents, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: !!currentUser?.id,
  });
  
  // Get student details
  const { data: studentDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["/api/students/details", currentUser?.id],
    enabled: !!currentUser?.id,
  });
  
  const isLoading = isLoadingUser || isLoadingStudents || isLoadingDetails;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl mb-2">Loading...</h2>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => navigate("/student/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">New Peer Revision Session</h1>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Start a New Peer Revision Session</CardTitle>
          <CardDescription>
            Record a session with another student partner or select from recent partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium">Create New Session</h3>
              <p className="text-sm text-neutral-500">
                Record a revision session with another student
              </p>
              
              <div className="flex gap-4 mt-4">
                <CreateSessionDialog
                  students={allStudents || []}
                  studentId={studentDetails?.id || 0}
                  trigger={
                    <Button className="bg-blue-500 hover:bg-blue-600 mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Session
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <p className="text-sm text-neutral-500">
            Sessions help track your progress with peers through the Hifz program
          </p>
        </CardFooter>
      </Card>
      
      <div className="text-center">
        <Link href="/student/dashboard">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}