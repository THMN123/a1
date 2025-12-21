import { BottomNav } from "@/components/BottomNav";
import { Award, Trophy, Gift } from "lucide-react";
import { useProfile } from "@/hooks/use-profiles";

export default function Rewards() {
  const { data: profile } = useProfile();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-14 pb-8 bg-primary text-white rounded-b-[2.5rem] shadow-xl shadow-primary/20">
        <h1 className="text-3xl font-display font-bold mb-2">Rewards</h1>
        <p className="opacity-90">Earn points with every purchase</p>
        
        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80 mb-1">Total Points</p>
            <p className="text-4xl font-bold font-display">{profile?.loyaltyPoints || 0}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
      </header>

      <main className="px-5 mt-8 space-y-6">
        <h3 className="font-bold text-lg font-display">Available Rewards</h3>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base">Free Coffee</h4>
              <p className="text-sm text-muted-foreground mb-2">Redeem at any cafe vendor</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">500 pts</span>
                <button className="text-xs font-bold bg-secondary text-white px-3 py-1.5 rounded-full opacity-50 cursor-not-allowed">
                  Redeem
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
