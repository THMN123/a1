import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, Loader2, CreditCard } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const topUpAmounts = [10, 25, 50, 100];

export function WalletTopUp() {
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/wallet/topup", { amount });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create checkout");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Top-up failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full px-4" data-testid="button-topup">
          <Wallet className="w-4 h-4 mr-2" />
          Top Up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Top Up Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {topUpAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-center",
                  selectedAmount === amount
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                data-testid={`button-amount-${amount}`}
              >
                <span className="text-2xl font-bold">LSL {amount}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={() => topUpMutation.mutate(selectedAmount)}
            disabled={topUpMutation.isPending}
            className="w-full h-12 rounded-xl font-bold"
            data-testid="button-confirm-topup"
          >
            {topUpMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Pay LSL {selectedAmount} with Card
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Secure payment powered by Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
