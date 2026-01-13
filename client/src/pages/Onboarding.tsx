import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, Store, Clock, Wallet, Gift, Sparkles, User, FileText, Loader2 } from "lucide-react";

const introSlides = [
  {
    icon: Store,
    title: "Welcome to A1 Services",
    description: "The World's Biggest Mall in Your Pocket. Discover local vendors, order food, and shop from your favorite campus spots.",
    color: "bg-primary"
  },
  {
    icon: Clock,
    title: "Skip the Queue",
    description: "Pre-order from your favorite vendors and pick up when it's ready. No more waiting in long lines!",
    color: "bg-green-500"
  },
  {
    icon: Wallet,
    title: "Easy Payments",
    description: "Top up your wallet and pay seamlessly. Track all your orders in one place.",
    color: "bg-blue-500"
  },
  {
    icon: Gift,
    title: "Earn Rewards",
    description: "Collect loyalty points with every order and redeem them for amazing discounts and freebies!",
    color: "bg-purple-500"
  }
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const totalSteps = introSlides.length + 1;
  const isIntroStep = step < introSlides.length;
  const isProfileStep = step === introSlides.length;

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; bio: string }) => {
      const res = await apiRequest("PUT", "/api/profiles/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      toast({ title: "Profile created!", description: "Welcome to A1 Services!" });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    }
  });

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (!displayName.trim()) {
      toast({ title: "Please enter a username", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ displayName: displayName.trim(), bio: bio.trim() });
  };

  const handleSkipIntro = () => {
    setStep(introSlides.length);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {isIntroStep && (
            <motion.div
              key={`intro-${step}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center px-8 text-center"
            >
              <div className={`w-24 h-24 rounded-full ${introSlides[step].color} flex items-center justify-center mb-8 shadow-lg`}>
                {(() => {
                  const Icon = introSlides[step].icon;
                  return <Icon className="w-12 h-12 text-white" />;
                })()}
              </div>
              <img 
                src="/images/logo1.png" 
                alt="A1 Services" 
                className="w-20 h-20 object-contain mb-6"
              />
              <h1 className="text-2xl font-bold mb-4">{introSlides[step].title}</h1>
              <p className="text-muted-foreground text-lg max-w-sm">{introSlides[step].description}</p>
            </motion.div>
          )}

          {isProfileStep && (
            <motion.div
              key="profile-setup"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col px-8 pt-16"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Set Up Your Profile</h1>
                <p className="text-muted-foreground">Let's personalize your experience</p>
              </div>

              <div className="space-y-6 max-w-sm mx-auto w-full">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Username
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="What should we call you?"
                    className="h-12 rounded-xl"
                    data-testid="input-onboarding-username"
                  />
                  <p className="text-xs text-muted-foreground">This is how other users will see you</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Bio (optional)
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a bit about yourself..."
                    className="rounded-xl resize-none"
                    rows={3}
                    data-testid="input-onboarding-bio"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12 pt-6">
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="rounded-xl h-14"
              data-testid="button-onboarding-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {isIntroStep && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleSkipIntro}
                className="rounded-xl h-14 flex-1"
                data-testid="button-onboarding-skip"
              >
                Skip
              </Button>
              <Button
                size="lg"
                onClick={handleNext}
                className="rounded-xl h-14 flex-1"
                data-testid="button-onboarding-next"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </>
          )}

          {isProfileStep && (
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={updateProfileMutation.isPending || !displayName.trim()}
              className="rounded-xl h-14 flex-1"
              data-testid="button-onboarding-complete"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Get Started
                  <ChevronRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
