import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertMistakeSchema, InsertMistake, Mistake } from "@shared/schema";
import { mistakeTypes } from "@/lib/constants";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddMistakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  studentId: number;
  editingMistake?: Mistake;
}

export function AddMistakeDialog({ 
  isOpen, 
  onClose, 
  sessionId, 
  studentId,
  editingMistake 
}: AddMistakeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = !!editingMistake;

  const form = useForm<InsertMistake>({
    resolver: zodResolver(insertMistakeSchema),
    defaultValues: editingMistake 
      ? {
          sessionId: editingMistake.sessionId,
          studentId: editingMistake.studentId,
          type: editingMistake.type,
          page: editingMistake.page,
          line: editingMistake.line,
          description: editingMistake.description
        }
      : {
          sessionId,
          studentId,
          type: "tajweed",
          page: 1,
          line: 1,
          description: ""
        }
  });

  async function onSubmit(data: InsertMistake) {
    setIsSubmitting(true);
    try {
      if (isEditing && editingMistake) {
        await apiRequest("PUT", `/api/mistakes/${editingMistake.id}`, data);
      } else {
        await apiRequest("POST", "/api/mistakes", data);
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/mistakes/session/${sessionId}`] });
      
      toast({
        title: isEditing ? "Mistake updated" : "Mistake added",
        description: isEditing 
          ? "Mistake has been updated successfully"
          : "New mistake has been added successfully",
      });
      
      form.reset({
        sessionId,
        studentId,
        type: "tajweed",
        page: 1,
        line: 1,
        description: ""
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'add'} mistake. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Mistake' : 'Add New Mistake'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mistakeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="page"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="line"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Line</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the mistake"
                      className="h-20"
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
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Mistake" : "Add Mistake")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
