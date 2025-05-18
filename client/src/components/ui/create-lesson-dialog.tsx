import { useState } from "react";
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
  progress: z.number().min(0).max(100)
});

interface CreateLessonDialogProps {
  students: Student[];
  teacherId: number;
  trigger: React.ReactNode;
}

export function CreateLessonDialog({ students, teacherId, trigger }: CreateLessonDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      studentId: "",
      date: new Date(),
      surahStart: "",
      ayahStart: 1,
      surahEnd: "",
      ayahEnd: 1,
      notes: "",
      progress: 0
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest("POST", "/api/teacher/lessons", {
        ...data,
        studentId: parseInt(data.studentId),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lesson created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/lessons/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data) {
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
                    onValueChange={field.onChange}
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

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      defaultValue={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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