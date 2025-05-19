import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters long",
  }),
  role: z.enum(["student", "teacher"], {
    required_error: "Please select a role",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      role: "teacher", // Default to teacher for testing
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      setIsLoading(true);
      setLoginError(null);
      console.log("Attempting login with:", data);
      
      try {
        // Direct fetch for login to handle specific errors
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include"
        });
        
        // Get the response data
        const responseText = await response.text();
        const responseData = responseText ? JSON.parse(responseText) : {};
        
        if (!response.ok) {
          console.error("Login error:", responseData);
          throw new Error(responseData.message || "Login failed");
        }
        
        return responseData;
      } catch (error) {
        console.error("Login error:", error);
        setLoginError(error instanceof Error ? error.message : "Login failed");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      console.log("Login successful:", data);
      toast({
        title: "Login successful!",
        description: `Welcome back, ${data.name}`,
      });
      
      // Refresh the page after successful login to ensure updated auth state
      setTimeout(() => {
        // Redirect based on role
        if (data.role === "teacher") {
          window.location.href = "/teacher/dashboard";
        } else {
          window.location.href = "/student/dashboard";
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: loginError || "Invalid username or role. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-heading">Hifz Tracker</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="student" />
                          </FormControl>
                          <FormLabel className="font-normal">Student</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="teacher" />
                          </FormControl>
                          <FormLabel className="font-normal">Teacher</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="mt-4 text-sm text-center text-neutral-500">
                <p>For demo, use:</p>
                <p>Teacher: teacher1 or teacher2</p>
                <p>Student: student1, student2, etc.</p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}