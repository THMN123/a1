import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Moon, Sun, Globe, Shield, HelpCircle, FileText, Trash2, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";

function SettingRow({ icon: Icon, label, description, action }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <span className="font-medium block">{label}</span>
          {description && <span className="text-sm text-muted-foreground">{description}</span>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe, isLoading } = usePushNotifications();

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    setIsDark(dark);
  }, []);

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribe();
      if (success) {
        toast({ title: "Push notifications enabled", description: "You'll receive alerts for orders and updates" });
      } else if (permission === 'denied') {
        toast({ title: "Notifications blocked", description: "Please enable notifications in your browser settings", variant: "destructive" });
      }
    } else {
      await unsubscribe();
      toast({ title: "Push notifications disabled" });
    }
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast({ title: newDark ? "Dark mode enabled" : "Light mode enabled" });
  };

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
          <h1 className="text-xl font-bold font-display">Settings</h1>
        </div>
      </header>

      <main className="px-5 py-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Appearance</h2>
          <SettingRow 
            icon={isDark ? Moon : Sun} 
            label="Dark Mode" 
            description={isDark ? "Currently using dark theme" : "Currently using light theme"}
            action={
              <Switch 
                checked={isDark} 
                onCheckedChange={toggleTheme}
                data-testid="switch-dark-mode"
              />
            }
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Notifications</h2>
          {isSupported ? (
            <>
              <SettingRow 
                icon={Bell} 
                label="Push Notifications" 
                description={
                  permission === 'denied' 
                    ? "Blocked in browser settings" 
                    : isSubscribed 
                      ? "Receiving order updates and alerts" 
                      : "Enable to receive order updates"
                }
                action={
                  <Switch 
                    checked={isSubscribed} 
                    onCheckedChange={handlePushToggle}
                    disabled={isLoading || permission === 'denied'}
                    data-testid="switch-push-notifications"
                  />
                }
              />
              {!isSubscribed && permission !== 'denied' && (
                <p className="text-xs text-muted-foreground px-1">
                  Open the app in a full browser tab (not embedded preview) to enable push notifications.
                </p>
              )}
            </>
          ) : (
            <SettingRow 
              icon={Bell} 
              label="Push Notifications" 
              description="Open the app in a full browser tab to enable"
              action={null}
            />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Preferences</h2>
          <SettingRow 
            icon={Globe} 
            label="Language" 
            description="English"
            action={<span className="text-sm text-muted-foreground">EN</span>}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Support</h2>
          <SettingRow 
            icon={HelpCircle} 
            label="Help Center" 
            description="Get help with your account"
            action={null}
          />
          <SettingRow 
            icon={Shield} 
            label="Privacy Policy" 
            description="Read our privacy policy"
            action={null}
          />
          <SettingRow 
            icon={FileText} 
            label="Terms of Service" 
            description="Read our terms"
            action={null}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">Account</h2>
          <div 
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center justify-between p-4 bg-destructive/5 rounded-2xl border border-destructive/20 cursor-pointer hover:bg-destructive/10 transition-colors"
            data-testid="item-delete-account"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium block text-destructive">Delete Account</span>
                <span className="text-sm text-muted-foreground">Permanently delete your data</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pt-8">
          A1 Services v1.0.0
        </p>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data, orders, and wallet balance will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => toast({ title: "Contact support", description: "Please email support@a1services.com to delete your account." })} data-testid="button-confirm-delete">
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
