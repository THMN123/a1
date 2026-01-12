import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { LogOut, User, Wallet, Settings, Bell, ChevronRight, Store, MapPin, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const profileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfileItem({ icon: Icon, label, value, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-bold text-primary">{value}</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: profile?.phone || "",
      address: profile?.address || "",
      bio: profile?.bio || "",
      profileImageUrl: profile?.profileImageUrl || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/profiles/me", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Update failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-14 pb-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-muted border-4 border-white shadow-xl mb-4 overflow-hidden relative group">
          <img 
            src={profile?.profileImageUrl || user?.profileImageUrl || "https://github.com/shadcn.png"} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold font-display">{user?.firstName || "User"} {user?.lastName || ""}</h1>
        <p className="text-muted-foreground text-sm">{user?.email}</p>
      </header>

      <main className="px-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-1">
            <span className="text-sm text-muted-foreground">Wallet</span>
            <span className="text-xl font-bold text-primary">${profile?.walletBalance || "0.00"}</span>
          </div>
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-1">
            <span className="text-sm text-muted-foreground">Points</span>
            <span className="text-xl font-bold text-primary">{profile?.loyaltyPoints || 0}</span>
          </div>
        </div>

        {isEditing ? (
          <div className="bg-card p-6 rounded-2xl border border-border/50 space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+27 123 456 789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Room 101, Block B" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Tell us about yourself..." className="resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateProfileMutation.isPending}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <>
            <ProfileItem icon={User} label="Personal Info" onClick={() => setIsEditing(true)} />
            <ProfileItem icon={MapPin} label="Saved Addresses" />
            <ProfileItem icon={Wallet} label="Wallet" value="Top Up" />
            <ProfileItem icon={Bell} label="Notifications" />
            <ProfileItem icon={Store} label="Vendor Dashboard" />
            <ProfileItem icon={Settings} label="Settings" />
          </>
        )}

        <div className="pt-8">
          <Button 
            onClick={() => logout()} 
            variant="destructive" 
            className="w-full h-12 rounded-xl shadow-lg shadow-destructive/20 font-bold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
