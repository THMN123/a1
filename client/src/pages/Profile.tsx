import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { LogOut, User, Wallet, Settings, Bell, ChevronRight, Store, MapPin, ShieldCheck, Camera, BadgeCheck, Calendar, Phone, Home, FileText, ShoppingBag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { WalletTopUp } from "@/components/WalletTopUp";
import { useLocation } from "wouter";
import { useUpload } from "@/hooks/use-upload";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  displayName: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfileItem({ icon: Icon, label, value, onClick, testId }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group"
      data-testid={testId}
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
  const [location, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);


  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const objectPath = response.objectPath;
      const imageUrl = objectPath.startsWith('/') ? objectPath : `/${objectPath}`;
      updateProfileImageMutation.mutate({ profileImageUrl: imageUrl });
    },
    onError: (error) => {
      setProfileImagePreview(null);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  });

  const updateProfileImageMutation = useMutation({
    mutationFn: async (values: { profileImageUrl: string }) => {
      const res = await apiRequest("PUT", "/api/profiles/me", values);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.profileImageUrl) {
        setProfileImagePreview(data.profileImageUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      toast({ title: "Profile picture updated!" });
    },
    onError: () => {
      setProfileImagePreview(null);
    }
  });

  const handleProfilePicClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please choose an image under 5MB", variant: "destructive" });
        return;
      }
      const localUrl = URL.createObjectURL(file);
      setProfileImagePreview(localUrl);
      await uploadFile(file);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('topup') === 'success') {
      toast({ title: "Top-up successful!", description: "Your wallet has been credited." });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      window.history.replaceState({}, '', '/profile');
    } else if (params.get('topup') === 'cancelled') {
      toast({ title: "Top-up cancelled", description: "No payment was made.", variant: "destructive" });
      window.history.replaceState({}, '', '/profile');
    }
  }, [location, toast]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: profile?.phone || "",
      address: profile?.address || "",
      bio: profile?.bio || "",
      profileImageUrl: profile?.profileImageUrl || "",
      displayName: profile?.displayName || "",
      dateOfBirth: profile?.dateOfBirth || "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        phone: profile.phone || "",
        address: profile.address || "",
        bio: profile.bio || "",
        profileImageUrl: profile.profileImageUrl || "",
        displayName: profile.displayName || "",
        dateOfBirth: profile.dateOfBirth || "",
      });
    }
  }, [profile, form]);

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

  const totalOrdersCount = profile?.totalOrders || 0;
  const displayImage = profileImagePreview || profile?.profileImageUrl || user?.profileImageUrl || "https://github.com/shadcn.png";
  const displayName = profile?.displayName || user?.firstName || "User";

  return (
    <div className="min-h-screen bg-background pb-24">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        data-testid="input-profile-picture"
      />
      
      <header className="px-5 pt-14 pb-8 flex flex-col items-center">
        <div 
          className="w-24 h-24 rounded-full bg-muted border-4 border-white shadow-xl mb-4 overflow-hidden relative group cursor-pointer"
          onClick={handleProfilePicClick}
          data-testid="button-change-profile-pic"
        >
          <img 
            src={displayImage} 
            alt="Profile" 
            className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold font-display">{displayName} {user?.lastName || ""}</h1>
          {profile?.isVerified && (
            <BadgeCheck className="w-5 h-5 text-primary" data-testid="icon-verified" />
          )}
        </div>
        <p className="text-muted-foreground text-sm">{user?.email}</p>
        {profile?.bio && (
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">{profile.bio}</p>
        )}
      </header>

      <main className="px-5 space-y-4">
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-1">
            <Wallet className="w-5 h-5 text-primary mb-1" />
            <span className="text-lg font-bold text-primary">LSL {profile?.walletBalance || "0.00"}</span>
            <span className="text-xs text-muted-foreground">Wallet</span>
          </div>
          <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-1">
            <ShoppingBag className="w-5 h-5 text-primary mb-1" />
            <span className="text-lg font-bold text-primary">{totalOrdersCount}</span>
            <span className="text-xs text-muted-foreground">Orders</span>
          </div>
          <div className="p-3 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-1">
            <BadgeCheck className="w-5 h-5 text-primary mb-1" />
            <span className="text-lg font-bold text-primary">{profile?.loyaltyPoints || 0}</span>
            <span className="text-xs text-muted-foreground">Points</span>
          </div>
        </div>
        
        <div className="flex justify-center mb-2">
          <WalletTopUp />
        </div>

        {isEditing ? (
          <div className="bg-card p-6 rounded-2xl border border-border/50 space-y-4">
            <h3 className="text-lg font-semibold mb-2">Edit Personal Info</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="What should we call you?" data-testid="input-display-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+27 123 456 789" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-dob" />
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
                        <Input {...field} placeholder="Room 101, Block B" data-testid="input-address" />
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
                        <Textarea {...field} placeholder="Tell us about yourself..." className="resize-none" data-testid="input-bio" />
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
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <>
            <ProfileItem icon={User} label="Personal Info" onClick={() => setIsEditing(true)} testId="item-personal-info" />
            <ProfileItem icon={MapPin} label="Saved Addresses" onClick={() => navigate('/addresses')} testId="item-addresses" />
            <ProfileItem icon={Bell} label="Notifications" onClick={() => navigate('/notifications')} testId="item-notifications" />
            <ProfileItem icon={Store} label="Vendor Dashboard" onClick={() => navigate('/vendor-admin')} testId="item-vendor-dashboard" />
            {profile?.role === 'admin' && (
              <ProfileItem icon={ShieldCheck} label="Super Admin" onClick={() => navigate('/super-admin')} testId="item-super-admin" />
            )}
            <ProfileItem icon={Settings} label="Settings" onClick={() => navigate('/settings')} testId="item-settings" />
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
