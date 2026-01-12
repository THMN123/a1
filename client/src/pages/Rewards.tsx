import { BottomNav } from "@/components/BottomNav";
import { Award, Trophy, Gift, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profiles";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Reward } from "@shared/schema";

export default function Rewards() {
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("POST", `/api/rewards/redeem/${rewardId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to redeem reward");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards/history"] });
      toast({ title: "Reward redeemed!", description: "Check your history for the voucher code." });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Redemption failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

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
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {rewards?.map((reward) => (
              <div key={reward.id} className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  {reward.imageUrl ? (
                    <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Gift className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base">{reward.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {reward.pointsRequired} pts
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => redeemMutation.mutate(reward.id)}
                      disabled={redeemMutation.isPending || (profile?.loyaltyPoints || 0) < reward.pointsRequired}
                      className="h-8 rounded-full px-4 text-xs font-bold"
                    >
                      {redeemMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                      Redeem
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
