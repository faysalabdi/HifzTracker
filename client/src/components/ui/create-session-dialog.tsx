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
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

const sessionSchema = z.object({
  student2Id: z.string().min(1, { message: "Please select a student partner" }),
  date: z.date().min(new Date("2000-01-01"), { message: "Please select a valid date" }),
  surahStart: z.string().min(1, { message: "Please select a starting surah" }),
  ayahStart: z.coerce.number().min(1, { message: "Please enter a valid ayah number" }),
  surahEnd: z.string().min(1, { message: "Please select an ending surah" }),
  ayahEnd: z.coerce.number().min(1, { message: "Please enter a valid ayah number" }),
  completed: z.boolean().default(false)
});

export function CreateSessionDialog({ students, studentId, trigger }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      student2Id: "",
      date: new Date(),
      surahStart: "",
      ayahStart: 1,
      surahEnd: "",
      ayahEnd: 1,
      completed: false
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data) => {
      return await apiRequest("POST", "/api/sessions", {
        ...data,
        student1Id: studentId,
        student2Id: parseInt(data.student2Id),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Session created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/student/sessions/recent"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data) {
    createSessionMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Peer Revision Session</DialogTitle>
          <DialogDescription>
            Record a revision session with another student. Fill in the session details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="student2Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revision Partner</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student partner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.filter(student => student.id !== studentId).map((student) => (
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
                  <FormLabel>Session Date</FormLabel>
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
              name="completed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Mark as completed
                    </FormLabel>
                    <p className="text-sm text-neutral-500">
                      Check this if the session is already complete
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 w-full"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? "Creating..." : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}