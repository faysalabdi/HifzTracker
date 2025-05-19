import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Handle saving settings
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully."
      });
    }, 1000);
  };
  
  // Handle logout
  const handleLogout = () => {
    // Redirect to logout endpoint
    window.location.href = "/api/auth/logout";
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-heading font-semibold mb-6">Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-24 h-24 mx-auto bg-primary-100 rounded-full flex items-center justify-center text-primary-500 text-2xl font-bold">
                UT
              </div>
              <div className="text-center">
                <h3 className="font-medium">User Teacher</h3>
                <p className="text-sm text-neutral-500">teacher@example.com</p>
              </div>
              <Button variant="outline" className="w-full mt-2">
                Edit Profile
              </Button>
              <Button 
                variant="destructive" 
                className="w-full mt-3"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}