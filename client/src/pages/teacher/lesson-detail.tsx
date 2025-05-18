import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, AlertTriangle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate, getMistakeTypeColor, getMistakeTypeLabel, mistakeTypes } from "@/lib/constants";
import { Lesson, LessonMistake, MistakeType } from "@shared/schema";

// Form schema for adding mistakes
const mistakeSchema = z.object({
  type: z.enum(["tajweed", "word", "stuck"]),
  ayah: z.number().min(1, "Ayah number must be at least 1"),
  details: z.string().optional(),
});

export default function LessonDetail() {
  const [, navigate] = useLocation();
  const params = useParams();
  const lessonId = parseInt(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMistakeDialog, setShowMistakeDialog] = useState(false);

  // Get lesson details
  const { data: lesson, isLoading: isLoadingLesson, error: lessonError } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId && !isNaN(lessonId),
  });

  // Get student details
  const { data: student, isLoading: isLoadingStudent } = useQuery<Student>({
    queryKey: ["/api/students", lesson?.studentId],
    enabled: !!lesson?.studentId,
  });

  // Get lesson mistakes
  const { data: mistakes = [], isLoading: isLoadingMistakes } = useQuery<LessonMistake[]>({
    queryKey: ["/api/lesson-mistakes", lessonId],
    enabled: !!lessonId && !isNaN(lessonId),
  });

  // Form for adding mistakes
  const mistakeForm = useForm({
    resolver: zodResolver(mistakeSchema),
    defaultValues: {
      type: "tajweed",
      ayah: 1,
      details: "",
    },
  });

  useEffect(() => {
    // Set the ayah number based on the current lesson range
    if (lesson) {
      mistakeForm.setValue("ayah", lesson.ayahStart);
    }
  }, [lesson, mistakeForm]);

  // Add mistake mutation
  const addMistakeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mistakeSchema>) => {
      return await apiRequest("POST", "/api/lesson-mistakes", {
        lessonId,
        studentId: lesson?.studentId,
        type: data.type as MistakeType,
        ayah: data.ayah,
        details: data.details || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mistake added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lesson-mistakes", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/lessons/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      mistakeForm.reset({
        type: "tajweed",
        ayah: lesson?.ayahStart || 1,
        details: "",
      });
      setShowMistakeDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add mistake. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/lessons/${lessonId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lesson completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/lessons/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      // Navigate back to teacher dashboard
      navigate("/teacher/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmitMistake(data: z.infer<typeof mistakeSchema>) {
    addMistakeMutation.mutate(data);
  }

  function handleCompleteLesson() {
    completeLessonMutation.mutate();
  }

  if (isLoadingLesson || isLoadingStudent) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl mb-2">Loading lesson details...</h2>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Lesson Not Found</h2>
              <p className="text-neutral-500 mb-4">The requested lesson could not be found.</p>
              <Button onClick={() => navigate("/teacher/dashboard")}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-semibold">Lesson Details</h1>
            <Badge className={
              lesson.progress === "Completed" ? "bg-green-100 text-green-800" :
              lesson.progress === "In Progress" ? "bg-amber-100 text-amber-800" :
              "bg-neutral-100 text-neutral-800"
            }>
              {lesson.progress}
            </Badge>
          </div>
          <p className="text-neutral-500">
            Lesson with {student?.name} on {formatDate(lesson.date)}
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={() => navigate("/teacher/dashboard")}
          >
            Back to Dashboard
          </Button>
          
          {lesson.progress !== "Completed" && (
            <Button 
              className="bg-green-500 hover:bg-green-600" 
              onClick={handleCompleteLesson}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Lesson
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-500" />
                Lesson Overview
              </CardTitle>
              <CardDescription>Details about this lesson</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-primary-50 p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium text-center mb-2">
                  {lesson.surahStart}:{lesson.ayahStart} - {lesson.surahEnd}:{lesson.ayahEnd}
                </h3>
                <p className="text-sm text-center text-neutral-500">Current Lesson Range</p>
              </div>
              
              {lesson.notes && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Teacher Notes:</h3>
                  <p className="text-neutral-600 bg-neutral-50 p-3 rounded-md">
                    {lesson.notes}
                  </p>
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Mistake Tracking:</h3>
                  
                  {lesson.progress !== "Completed" && (
                    <Button 
                      size="sm" 
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => setShowMistakeDialog(true)}
                    >
                      Add Mistake
                    </Button>
                  )}
                </div>
                
                {isLoadingMistakes ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : mistakes && mistakes.length > 0 ? (
                  <div className="space-y-3">
                    {mistakes.map((mistake: LessonMistake) => (
                      <div 
                        key={mistake.id} 
                        className="border-l-4 pl-3 py-2"
                        style={{ borderColor: getMistakeTypeColor(mistake.type) }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium">{getMistakeTypeLabel(mistake.type)}</span>
                            <span className="mx-2 text-neutral-400">•</span>
                            <span className="text-neutral-500">Ayah {mistake.ayah}</span>
                          </div>
                        </div>
                        {mistake.details && (
                          <p className="text-sm text-neutral-600 mt-1">{mistake.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-500 bg-neutral-50 rounded-md">
                    No mistakes recorded yet
                  </div>
                )}
              </div>
            </CardContent>
            {lesson.progress === "Completed" ? (
              <CardFooter>
                <div className="w-full p-3 bg-green-50 text-green-800 rounded-md text-center">
                  This lesson has been completed
                </div>
              </CardFooter>
            ) : (
              <CardFooter>
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600" 
                  onClick={handleCompleteLesson}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Lesson
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Details about the student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-neutral-500">Name</p>
                  <p className="font-medium">{student?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Grade</p>
                  <p className="font-medium">{student?.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Current Juz</p>
                  <p className="font-medium">{student?.currentJuz}</p>
                </div>
                {student?.currentSurah && (
                  <div>
                    <p className="text-sm text-neutral-500">Current Surah</p>
                    <p className="font-medium">{student?.currentSurah}</p>
                  </div>
                )}
                {student?.notes && (
                  <div>
                    <p className="text-sm text-neutral-500">Notes</p>
                    <p className="font-medium">{student?.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Mistake Dialog */}
      <Dialog open={showMistakeDialog} onOpenChange={setShowMistakeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Mistake</DialogTitle>
          </DialogHeader>
          <Form {...mistakeForm}>
            <form onSubmit={mistakeForm.handleSubmit(onSubmitMistake)} className="space-y-6">
              <FormField
                control={mistakeForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mistake Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mistake type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mistakeTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getMistakeTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={mistakeForm.control}
                name="ayah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ayah Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={lesson.ayahStart} 
                        max={lesson.ayahEnd} 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={mistakeForm.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add details about the mistake..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowMistakeDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Mistake
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}