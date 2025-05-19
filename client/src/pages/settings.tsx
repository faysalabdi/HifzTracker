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
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure your application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Dark Mode</h4>
                    <p className="text-sm text-neutral-500">Switch between light and dark themes</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-neutral-500">Receive email updates about sessions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Reminders</h4>
                    <p className="text-sm text-neutral-500">Get reminders for scheduled sessions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="pt-4 border-t border-neutral-200">
                <h4 className="font-medium mb-4">Display Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default View</label>
                    <select className="w-full p-2 border border-neutral-200 rounded-md">
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>All Time</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Items Per Page</label>
                    <select className="w-full p-2 border border-neutral-200 rounded-md">
                      <option>10</option>
                      <option>25</option>
                      <option>50</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
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