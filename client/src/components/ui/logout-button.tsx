import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function LogoutButton() {
  const [, navigate] = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("GET", "/api/auth/logout");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span>Logout</span>
    </Button>
  );
}