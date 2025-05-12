import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Student, InsertSession, insertSessionSchema, InsertMistake, Mistake } from "@shared/schema";
import { surahs } from "@/lib/constants";
import { AddMistakeDialog } from "@/components/ui/add-mistake-dialog";
import { MistakeItem } from "@/components/ui/mistake-item";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMistakeDialogStudent1, setShowMistakeDialogStudent1] = useState(false);
  const [showMistakeDialogStudent2, setShowMistakeDialogStudent2] = useState(false);
  const [editingMistake, setEditingMistake] = useState<Mistake | undefined>(undefined);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Set up form
  const form = useForm<InsertSession>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      date: new Date(),
      student1Id: 0,
      student2Id: 0,
      surahStart: "Al-Baqarah",
      ayahStart: 1,
      surahEnd: "Al-Baqarah",
      ayahEnd: 10,
      completed: false
    }
  });

  // Get the session ID if the form has been submitted
  const sessionId = form.getValues().id;

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"]
  });

  // Fetch mistakes if session is created
  const { data: mistakes, isLoading: isLoadingMistakes } = useQuery<Mistake[]>({
    queryKey: [`/api/mistakes/session/${sessionId}`],
    enabled: !!sessionId
  });

  // Filter mistakes by student
  const student1Mistakes = mistakes?.filter(m => m.studentId === form.getValues().student1Id) || [];
  const student2Mistakes = mistakes?.filter(m => m.studentId === form.getValues().student2Id) || [];

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: InsertSession) => {
      const response = await apiRequest("POST", "/api/sessions", data);
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("id", data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/recent"] });
      toast({
        title: "Session created",
        description: "New revision session has been created",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    }
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/sessions/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/recent"] });
      toast({
        title: "Session completed",
        description: "The revision session has been marked as complete",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete session",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: InsertSession) => {
    if (form.getValues().id) {
      // Session already created, no need to do anything
      return;
    }
    
    // Combine date and time values if they exist
    const dateValue = form.getValues().dateInput;
    const timeValue = form.getValues().timeInput;
    
    if (dateValue && timeValue) {
      const combinedDate = new Date(`${dateValue}T${timeValue}`);
      data.date = combinedDate;
    }
    
    createSessionMutation.mutate(data);
  };

  // Handle edit mistake
  const handleEditMistake = (mistake: Mistake) => {
    setEditingMistake(mistake);
    if (mistake.studentId === form.getValues().student1Id) {
      setShowMistakeDialogStudent1(true);
    } else {
      setShowMistakeDialogStudent2(true);
    }
  };

  // Get student name
  const getStudentName = (id: number) => {
    const student = students?.find(s => s.id === id);
    return student ? student.name : "Select student";
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-heading font-semibold mb-6">New Revision Session</h2>
      
      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-medium text-lg mb-4">Session Details</h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          defaultValue={getCurrentDate()} 
                          {...field} 
                          disabled={!!form.getValues().id}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          defaultValue={getCurrentTime()} 
                          {...field} 
                          disabled={!!form.getValues().id}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="student1Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student 1</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                        disabled={!!form.getValues().id}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Select student</SelectItem>
                          {students?.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="student2Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student 2</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : ""}
                        disabled={!!form.getValues().id}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Select student</SelectItem>
                          {students?.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Starting Point</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="surahStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!!form.getValues().id}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Surah" />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {surahs.map((surah) => (
                                  <SelectItem key={surah} value={surah}>
                                    {surah}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ayahStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ayah" 
                              min="1"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              disabled={!!form.getValues().id}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <FormLabel>Ending Point</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="surahEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!!form.getValues().id}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Surah" />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {surahs.map((surah) => (
                                  <SelectItem key={surah} value={surah}>
                                    {surah}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ayahEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ayah" 
                              min="1"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              disabled={!!form.getValues().id}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {!form.getValues().id && (
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={createSessionMutation.isPending || !form.getValues().student1Id || !form.getValues().student2Id}
                  >
                    {createSessionMutation.isPending ? "Creating..." : "Create Session"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {form.getValues().id && (
        <>
          {/* Mistake tracking for Student 1 */}
          <Card className="mb-6">
            <CardHeader className="p-4 flex justify-between items-center">
              <h3 className="font-medium text-lg">Mistake Tracking: {getStudentName(form.getValues().student1Id)}</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMistake(undefined);
                  setShowMistakeDialogStudent1(true);
                }}
              >
                Add Mistake
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {/* Quran visualization */}
              <div className="mb-6 border border-neutral-200 rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
                  alt="Quran page with Arabic text" 
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 bg-neutral-50">
                  <div dir="rtl" className="text-center font-['Amiri'] text-xl leading-loose mb-2 text-neutral-800">
                    وَلَقَدْ آتَيْنَا مُوسَى الْكِتَابَ وَقَفَّيْنَا مِن بَعْدِهِ بِالرُّسُلِ ۖ وَآتَيْنَا عِيسَى ابْنَ مَرْيَمَ الْبَيِّنَاتِ وَأَيَّدْنَاهُ بِرُوحِ الْقُدُسِ ۗ أَفَكُلَّمَا جَاءَكُمْ رَسُولٌ بِمَا لَا تَهْوَىٰ أَنفُسُكُمُ اسْتَكْبَرْتُمْ فَفَرِيقًا كَذَّبْتُمْ وَفَرِيقًا تَقْتُلُونَ
                  </div>
                  <div className="flex justify-between items-center text-sm text-neutral-500">
                    <span>{form.getValues().surahStart} {form.getValues().ayahStart}-{form.getValues().ayahEnd}</span>
                    <span>{form.getValues().surahStart === form.getValues().surahEnd ? '' : `to ${form.getValues().surahEnd}`}</span>
                  </div>
                </div>
              </div>
              
              {isLoadingMistakes ? (
                <div className="text-center py-4">Loading mistakes...</div>
              ) : student1Mistakes.length > 0 ? (
                <div className="space-y-3">
                  {student1Mistakes.map(mistake => (
                    <MistakeItem 
                      key={mistake.id} 
                      mistake={mistake} 
                      sessionId={form.getValues().id} 
                      onEdit={() => handleEditMistake(mistake)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-500 py-8">No mistakes recorded yet. Use the button above to add mistakes.</p>
              )}
            </CardContent>
          </Card>
          
          {/* Mistake tracking for Student 2 */}
          <Card className="mb-6">
            <CardHeader className="p-4 flex justify-between items-center">
              <h3 className="font-medium text-lg">Mistake Tracking: {getStudentName(form.getValues().student2Id)}</h3>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMistake(undefined);
                  setShowMistakeDialogStudent2(true);
                }}
              >
                Add Mistake
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              {isLoadingMistakes ? (
                <div className="text-center py-4">Loading mistakes...</div>
              ) : student2Mistakes.length > 0 ? (
                <div className="space-y-3">
                  {student2Mistakes.map(mistake => (
                    <MistakeItem 
                      key={mistake.id} 
                      mistake={mistake} 
                      sessionId={form.getValues().id} 
                      onEdit={() => handleEditMistake(mistake)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-neutral-500 py-8">No mistakes recorded yet. Use the button above to add mistakes.</p>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline">
              Save as Draft
            </Button>
            <Button 
              onClick={() => completeSessionMutation.mutate(form.getValues().id)}
              disabled={completeSessionMutation.isPending}
            >
              {completeSessionMutation.isPending ? "Completing..." : "Complete Session"}
            </Button>
          </div>
        </>
      )}
      
      {/* Add Mistake Dialog for Student 1 */}
      <AddMistakeDialog
        isOpen={showMistakeDialogStudent1}
        onClose={() => {
          setShowMistakeDialogStudent1(false);
          setEditingMistake(undefined);
        }}
        sessionId={form.getValues().id}
        studentId={form.getValues().student1Id}
        editingMistake={editingMistake}
      />
      
      {/* Add Mistake Dialog for Student 2 */}
      <AddMistakeDialog
        isOpen={showMistakeDialogStudent2}
        onClose={() => {
          setShowMistakeDialogStudent2(false);
          setEditingMistake(undefined);
        }}
        sessionId={form.getValues().id}
        studentId={form.getValues().student2Id}
        editingMistake={editingMistake}
      />
    </div>
  );
}
