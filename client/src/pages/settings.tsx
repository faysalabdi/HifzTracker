import React, { useState } from "react";
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
import { LogOut, Save, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

// Edit Profile schema
const editProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Get current user data
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Edit profile form
  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        username: user.username,
      });
    }
  }, [user, form]);

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
  
  // Handle profile update
  const onUpdateProfile = async (data: EditProfileFormValues) => {
    try {
      await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive"
      });
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Redirect to logout endpoint
    window.location.href = "/api/auth/logout";
  };
  
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

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
                {user?.name?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0) || ''}
              </div>
              <div className="text-center">
                <h3 className="font-medium">{user?.name}</h3>
                <p className="text-sm text-neutral-500">{user?.username}</p>
                <div className="mt-1">
                  <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                    {user?.role === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={() => setEditDialogOpen(true)}
              >
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
        
        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUpdateProfile)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}