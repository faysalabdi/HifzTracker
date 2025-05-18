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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student } from "@shared/schema";

const assignStudentSchema = z.object({
  studentId: z.string().min(1, { message: "Please select a student" }),
});

interface AssignStudentDialogProps {
  unassignedStudents: Student[];
  teacherId: number;
  trigger: React.ReactNode;
}

export function AssignStudentDialog({ unassignedStudents, teacherId, trigger }: AssignStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(assignStudentSchema),
    defaultValues: {
      studentId: "",
    },
  });

  const assignStudentMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest("POST", "/api/teacher/students/assign", {
        teacherId,
        studentId: parseInt(data.studentId),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/stats"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign student. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data) {
    assignStudentMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign New Student</DialogTitle>
          <DialogDescription>
            Select a student to assign to your teaching list.
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
                      {unassignedStudents.map((student) => (
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

            <DialogFooter>
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 w-full"
                disabled={assignStudentMutation.isPending || unassignedStudents.length === 0}
              >
                {assignStudentMutation.isPending ? "Assigning..." : "Assign Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}