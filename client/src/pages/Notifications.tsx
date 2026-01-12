import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, ShoppingBag, Gift, Store, Mail, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationPreferences } from "@shared/schema";

function NotificationRow({ icon: Icon, label, description, enabled, onToggle, testId }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <span className="font-medium block">{label}</span>
          <span className="text-sm text-muted-foreground">{description}</span>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
        data-testid={testId}
      />
    </div>
  );
}

export default function Notifications() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: prefs, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const res = await apiRequest("PUT", "/api/notification-preferences", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      toast({ title: "Preferences updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-display">Notifications</h1>
        </div>
      </header>

      <main className="px-5 py-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Push Notifications</h2>
          
          <NotificationRow 
            icon={ShoppingBag}
            label="Order Updates"
            description="Get notified about your order status"
            enabled={prefs?.orderUpdates ?? true}
            onToggle={(v: boolean) => handleToggle("orderUpdates", v)}
            testId="switch-order-updates"
          />
          
          <NotificationRow 
            icon={Gift}
            label="Rewards & Points"
            description="Earn points and special offers"
            enabled={prefs?.rewards ?? true}
            onToggle={(v: boolean) => handleToggle("rewards", v)}
            testId="switch-rewards"
          />
          
          <NotificationRow 
            icon={Store}
            label="New Vendors"
            description="Discover new shops on campus"
            enabled={prefs?.newVendors ?? true}
            onToggle={(v: boolean) => handleToggle("newVendors", v)}
            testId="switch-new-vendors"
          />
          
          <NotificationRow 
            icon={Bell}
            label="Promotions"
            description="Sales, discounts, and special deals"
            enabled={prefs?.promotions ?? true}
            onToggle={(v: boolean) => handleToggle("promotions", v)}
            testId="switch-promotions"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Email</h2>
          
          <NotificationRow 
            icon={Mail}
            label="Email Notifications"
            description="Receive updates via email"
            enabled={prefs?.emailNotifications ?? false}
            onToggle={(v: boolean) => handleToggle("emailNotifications", v)}
            testId="switch-email"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          You can change these preferences at any time
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
