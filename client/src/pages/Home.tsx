import { useAuth } from "@/hooks/use-auth";
import { useVendors } from "@/hooks/use-vendors";
import { VendorCard } from "@/components/VendorCard";
import { BottomNav } from "@/components/BottomNav";
import { Bell, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();
  const { data: vendors, isLoading } = useVendors();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-4 pt-12 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-full w-full" />
        <div className="h-40 bg-muted rounded-2xl w-full" />
        <div className="space-y-4">
          <div className="h-64 bg-muted rounded-2xl w-full" />
          <div className="h-64 bg-muted rounded-2xl w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-14 pb-4 bg-white sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl bg-white/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {user?.firstName || "Guest"} 👋
            </h1>
          </div>
          <button className="p-2.5 rounded-full bg-muted hover:bg-accent text-foreground transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search food, shops, services..." 
            className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-transparent focus:bg-white focus:border-primary/50 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm border border-border/50 cursor-pointer hover:border-primary/50">
            <Filter className="w-4 h-4 text-foreground" />
          </div>
        </div>
      </header>

      <main className="px-5 space-y-8 mt-6">
        {/* Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-primary h-40 flex items-center p-6 shadow-xl shadow-primary/20"
        >
          <div className="relative z-10 w-2/3">
            <h2 className="text-2xl font-bold text-white font-display mb-2">Skip the Queue</h2>
            <p className="text-white/80 text-sm mb-4">Order ahead and pick up your items instantly.</p>
            <button className="bg-white text-primary px-4 py-2 rounded-full text-xs font-bold hover:bg-white/90 transition-colors">
              Order Now
            </button>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-[-20px] left-[40%] w-20 h-20 bg-black/5 rounded-full blur-xl" />
          {/* Abstract graphic or simple illustration could go here */}
        </motion.div>

        {/* Categories (Horizontal Scroll) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg font-display">Categories</h3>
            <span className="text-primary text-sm font-medium cursor-pointer">See all</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
            {[
              { name: "Food", icon: "🍔" },
              { name: "Coffee", icon: "☕" },
              { name: "Groceries", icon: "🥦" },
              { name: "Services", icon: "🔧" },
              { name: "Print", icon: "🖨️" }
            ].map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 min-w-[72px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-2xl shadow-sm border border-transparent hover:border-primary transition-all">
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Popular Vendors */}
        <div>
          <h3 className="font-bold text-lg font-display mb-4">Popular Near You</h3>
          <div className="grid gap-6">
            {vendors?.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
            {vendors?.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No vendors found. Check back later!
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
