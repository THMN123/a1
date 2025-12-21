import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
        <div className="w-20 h-20 bg-primary rounded-3xl mb-8 flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3">
          <span className="text-4xl font-bold text-white font-display">A1</span>
        </div>
        
        <h1 className="text-4xl font-bold font-display mb-4 text-foreground leading-tight">
          Everything you need,<br/>
          <span className="text-primary">All in one place.</span>
        </h1>
        
        <p className="text-muted-foreground mb-12 max-w-xs mx-auto text-lg">
          Order food, find services, and discover the best of your campus.
        </p>

        <Button 
          onClick={handleLogin}
          size="lg" 
          className="w-full max-w-sm h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
      
      <div className="p-8 text-center text-xs text-muted-foreground z-10">
        By continuing, you agree to our Terms of Service & Privacy Policy.
      </div>
    </div>
  );
}
