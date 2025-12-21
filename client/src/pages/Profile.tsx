import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { LogOut, User, Wallet, Settings, Bell, ChevronRight, Store } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-14 pb-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-muted border-4 border-white shadow-xl mb-4 overflow-hidden">
          <img 
            src={user?.profileImageUrl || "https://github.com/shadcn.png"} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold font-display">{user?.firstName} {user?.lastName}</h1>
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

        <ProfileItem icon={User} label="Personal Info" />
        <ProfileItem icon={Wallet} label="Wallet" value="Top Up" />
        <ProfileItem icon={Bell} label="Notifications" />
        <ProfileItem icon={Store} label="Vendor Dashboard" />
        <ProfileItem icon={Settings} label="Settings" />

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
