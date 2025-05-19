import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

/**
 * This component performs an automatic login as a teacher for development purposes
 */
export default function AutoLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const login = async () => {
      try {
        // Automatically log in as teacher1
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "teacher1", role: "teacher" }),
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Login failed");
        }

        const data = await response.json();
        
        toast({
          title: "Auto-login successful!",
          description: `Welcome, ${data.name}`,
        });
        
        // Redirect to teacher dashboard
        navigate("/teacher/dashboard");
      } catch (error) {
        console.error("Auto-login failed:", error);
        toast({
          title: "Auto-login failed",
          description: "Please try manual login",
          variant: "destructive",
        });
        
        // Redirect to login page
        navigate("/login");
      }
    };

    login();
  }, [navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <h1 className="text-3xl font-heading">Hifz Tracker</h1>
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-xl">Logging you in automatically...</p>
      </div>
    </div>
  );
}