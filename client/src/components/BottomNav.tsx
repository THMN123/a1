import { Link, useLocation } from "wouter";
import { Home, Search, ShoppingBag, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Search },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Rewards", href: "/rewards", icon: Award },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
      <nav className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location === tab.href;
          return (
            <Link key={tab.name} href={tab.href} className="flex-1">
              <div className="flex flex-col items-center justify-center h-full w-full cursor-pointer group relative">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute -top-3 w-8 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <tab.icon
                  className={cn(
                    "w-6 h-6 transition-colors duration-200",
                    isActive ? "text-primary fill-primary/10" : "text-muted-foreground group-hover:text-primary/70"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                <span className={cn(
                  "text-[10px] mt-1 font-medium transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {tab.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
