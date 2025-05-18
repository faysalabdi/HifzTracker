import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import React, { useEffect } from "react";
import { User } from "@shared/schema";

// Original pages
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import NewSession from "@/pages/new-session";
import Reports from "@/pages/reports";
import Progress from "@/pages/progress";
import StudentDetail from "@/pages/student-detail";
import SessionDetail from "@/pages/session-detail";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

// New pages
import LoginPage from "@/pages/login";
import TeacherDashboard from "@/pages/teacher/dashboard";
import StudentDashboard from "@/pages/student/dashboard";

interface AuthenticatedRouteProps {
  component: React.ComponentType<any>;
  requiredRole?: "teacher" | "student" | null;
  params?: any;
}

// Authentication wrapper component
function AuthenticatedRoute({ component: Component, requiredRole = null, ...rest }: AuthenticatedRouteProps) {
  const [, navigate] = useLocation();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    onError: () => {
      navigate("/login");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Check if a specific role is required
  if (requiredRole && user.role !== requiredRole) {
    navigate("/");
    return null;
  }

  return (
    <MainLayout>
      <Component user={user} {...rest} />
    </MainLayout>
  );
}

// Role redirector component
interface RoleRedirectorProps {
  user: User;
}

function RoleRedirector({ user }: RoleRedirectorProps) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (user?.role === "teacher") {
      navigate("/teacher/dashboard");
    } else if (user?.role === "student") {
      navigate("/student/dashboard");
    }
  }, [user, navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="ml-2">Redirecting...</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          {/* Public route */}
          <Route path="/login" component={LoginPage} />
          
          {/* Role-based dashboards */}
          <Route path="/teacher/dashboard">
            {(params) => <AuthenticatedRoute component={TeacherDashboard} requiredRole="teacher" params={params} />}
          </Route>
          
          <Route path="/student/dashboard">
            {(params) => <AuthenticatedRoute component={StudentDashboard} requiredRole="student" params={params} />}
          </Route>
          
          {/* Default redirect to appropriate dashboard based on role */}
          <Route path="/">
            {(params) => <AuthenticatedRoute component={RoleRedirector} params={params} />}
          </Route>
          
          {/* Legacy routes (will eventually be migrated) */}
          <Route path="/dashboard">
            {(params) => <AuthenticatedRoute component={Dashboard} params={params} />}
          </Route>
          
          <Route path="/students">
            {(params) => <AuthenticatedRoute component={Students} params={params} />}
          </Route>
          
          <Route path="/students/:id">
            {(params) => <AuthenticatedRoute component={StudentDetail} params={params} />}
          </Route>
          
          <Route path="/new-session">
            {(params) => <AuthenticatedRoute component={NewSession} params={params} />}
          </Route>
          
          <Route path="/reports">
            {(params) => <AuthenticatedRoute component={Reports} params={params} />}
          </Route>
          
          <Route path="/progress">
            {(params) => <AuthenticatedRoute component={Progress} params={params} />}
          </Route>
          
          <Route path="/sessions/:id">
            {(params) => <AuthenticatedRoute component={SessionDetail} params={params} />}
          </Route>
          
          <Route path="/settings">
            {(params) => <AuthenticatedRoute component={Settings} params={params} />}
          </Route>
          
          {/* 404 Page */}
          <Route component={NotFound} />
        </Switch>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
