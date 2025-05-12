import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import NewSession from "@/pages/new-session";
import Reports from "@/pages/reports";
import Progress from "@/pages/progress";
import StudentDetail from "@/pages/student-detail";
import SessionDetail from "@/pages/session-detail";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MainLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/students" component={Students} />
            <Route path="/students/:id" component={StudentDetail} />
            <Route path="/new-session" component={NewSession} />
            <Route path="/reports" component={Reports} />
            <Route path="/progress" component={Progress} />
            <Route path="/sessions/:id" component={SessionDetail} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
