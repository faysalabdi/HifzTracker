import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { surahs } from "@/lib/constants";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student } from "@shared/schema";

const lessonSchema = z.object({
  studentId: z.string().min(1, { message: "Please select a student" }),
  date: z.date().min(new Date("2000-01-01"), { message: "Please select a valid date" }),
  surahStart: z.string().min(1, { message: "Please select a starting surah" }),
  ayahStart: z.coerce.number().min(1, { message: "Please enter a valid ayah number" }),
  surahEnd: z.string().min(1, { message: "Please select an ending surah" }),
  ayahEnd: z.coerce.number().min(1, { message: "Please enter a valid ayah number" }),
  notes: z.string().optional(),
  progress: z.string().default("In Progress")
});

interface CreateLessonDialogProps {
  students: Student[];
  teacherId: number;
  trigger: React.ReactNode;
  initialStudent?: Student | null;
}

export function CreateLessonDialog({ students, teacherId, trigger, initialStudent }: CreateLessonDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent ? initialStudent.id.toString() : "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      studentId: initialStudent ? initialStudent.id.toString() : "",
      date: new Date(),
      surahStart: "",
      ayahStart: 1,
      surahEnd: "",
      ayahEnd: 1,
      notes: "",
      progress: "In Progress" // Default value, not shown in form
    },
  });
  
  // Reset form when dialog opens with initialStudent
  useEffect(() => {
    if (open && initialStudent) {
      form.setValue("studentId", initialStudent.id.toString());
      setSelectedStudentId(initialStudent.id.toString());
    }
  }, [open, initialStudent, form]);
  
  // When a student is selected, auto-fill the starting position based on their current progress
  useEffect(() => {
    if (selectedStudentId) {
      const student = students.find(s => s.id.toString() === selectedStudentId);
      if (student && student.currentSurah) {
        // Use the student's current position to populate the starting position
        form.setValue("surahStart", student.currentSurah);
        
        // If the student has a current ayah saved, use it; otherwise default to 1
        if (student.currentAyah) {
          form.setValue("ayahStart", student.currentAyah);
        } else {
          form.setValue("ayahStart", 1);
        }
      }
    }
  }, [selectedStudentId, students, form]);

  const createLessonMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof lessonSchema>) => {
      const response = await apiRequest("POST", "/api/teacher/lessons", {
        ...formData,
        studentId: parseInt(formData.studentId),
      });
      console.log("API Response:", response); // Debug log
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Lesson created successfully",
      });
      // Refresh all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/lessons/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] }); // Refresh student data
      form.reset();
      setOpen(false);
      
      // Navigate to the lesson tracking page
      console.log("Lesson created with data:", data); // Debug log
      if (data && data.id) {
        // Make sure we have a valid lesson ID before redirecting
        const lessonId = data.id;
        console.log("Redirecting to lesson ID:", lessonId);
        setTimeout(() => {
          window.location.href = `/teacher/lesson/${lessonId}`;
        }, 300);
      } else {
        console.error("Missing lesson ID in response:", data);
        toast({
          title: "Warning",
          description: "Lesson created but couldn't navigate to it. Please check your lessons on the dashboard.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof lessonSchema>) {
    createLessonMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Schedule New Lesson</DialogTitle>
          <DialogDescription>
            Create a new lesson for your student. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedStudentId(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Lesson Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="surahStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Surah</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a surah" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {surahs.map((surah) => (
                          <SelectItem key={surah} value={surah}>
                            {surah}
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
                name="ayahStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Ayah</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="surahEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Surah</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a surah" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {surahs.map((surah) => (
                          <SelectItem key={surah} value={surah}>
                            {surah}
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
                name="ayahEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Ayah</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes or instructions for this lesson"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress field removed - progress is managed via Complete Lesson button */}

            <DialogFooter>
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 w-full"
                disabled={createLessonMutation.isPending}
              >
                {createLessonMutation.isPending ? "Creating..." : "Schedule Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}