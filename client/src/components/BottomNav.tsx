import { Link, useLocation } from "wouter";
import { Home, Store, ShoppingBag, Award, User, LayoutDashboard, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProfileMode } from "@/contexts/ProfileModeContext";
import { useMyVendor } from "@/hooks/use-my-vendor";

export function BottomNav() {
  const [location] = useLocation();
  const { isVendorMode, toggleMode } = useProfileMode();
  const { hasVendor } = useMyVendor();

  const personalTabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shops", href: "/shops", icon: Store },
    { name: "Orders", href: "/orders", icon: ShoppingBag },
    { name: "Rewards", href: "/rewards", icon: Award },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const vendorTabs = [
    { name: "Dashboard", href: "/vendor-admin", icon: LayoutDashboard },
    { name: "Orders", href: "/vendor-dashboard", icon: ShoppingBag },
    { name: "Shop", href: "/shops", icon: Store },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const tabs = isVendorMode && hasVendor ? vendorTabs : personalTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <AnimatePresence>
        {hasVendor && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-center pb-2"
          >
            <button
              onClick={toggleMode}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all",
                isVendorMode 
                  ? "bg-primary text-white" 
                  : "bg-white dark:bg-card text-foreground border border-border"
              )}
              data-testid="button-switch-profile"
            >
              <RefreshCw className="w-4 h-4" />
              {isVendorMode ? "Switch to Personal" : "Switch to Vendor"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="bg-white dark:bg-background border-t border-border pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
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
    </div>
  );
}
