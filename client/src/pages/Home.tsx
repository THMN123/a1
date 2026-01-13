import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { useVendors } from "@/hooks/use-vendors";
import { useQuery } from "@tanstack/react-query";
import { VendorCard } from "@/components/VendorCard";
import { BottomNav } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Star, TrendingUp, Sparkles, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { Product, Vendor } from "@shared/schema";

interface HomeFeedData {
  popularProducts: (Product & { salesCount: number })[];
  featuredVendors: Vendor[];
  recentVendors: Vendor[];
  recommendations: Product[];
}

function ProductCard({ product, vendorId }: { product: Product; vendorId?: number }) {
  return (
    <Link href={`/vendor/${product.vendorId || vendorId}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="min-w-[140px] bg-card rounded-xl border border-border/40 overflow-hidden cursor-pointer"
      >
        <div className="h-24 bg-muted">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-3">
          <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
          <p className="text-primary font-bold text-sm">LSL {product.price}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  
  const { data: feedData, isLoading: feedLoading } = useQuery<HomeFeedData>({
    queryKey: ['/api/home/feed'],
  });

  const isLoading = vendorsLoading || feedLoading;

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

  const popularProducts = feedData?.popularProducts || [];
  const recommendations = feedData?.recommendations || [];
  const featuredVendors = feedData?.featuredVendors || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-14 pb-4 bg-white sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl bg-white/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo1.png" 
              alt="A1 Services" 
              className="w-10 h-10 rounded-lg object-contain"
            />
            <div>
              <p className="text-muted-foreground text-sm font-medium">Welcome back,</p>
              <h1 className="text-xl font-display font-bold text-foreground">
                {profile?.displayName || user?.firstName || "Guest"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProfileSwitcher />
            <NotificationBell />
          </div>
        </div>

        {/* Global Search */}
        <GlobalSearch />
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
            <Link href="/shops">
              <button className="bg-white text-primary px-4 py-2 rounded-full text-xs font-bold hover:bg-white/90 transition-colors" data-testid="button-order-now">
                Order Now
              </button>
            </Link>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-[-20px] left-[40%] w-20 h-20 bg-black/5 rounded-full blur-xl" />
        </motion.div>

        {/* Categories (Horizontal Scroll) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg font-display">Categories</h3>
            <Link href="/shops">
              <span className="text-primary text-sm font-medium cursor-pointer" data-testid="link-see-all-categories">See all</span>
            </Link>
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
                data-testid={`button-category-${cat.name.toLowerCase()}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-2xl shadow-sm border border-transparent hover:border-primary transition-all">
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{cat.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Popular This Week */}
        {popularProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg font-display">Popular This Week</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
              {popularProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-testid={`product-popular-${product.id}`}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* You Might Love */}
        {recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg font-display">You Might Love</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
              {recommendations.slice(0, 6).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-testid={`product-recommendation-${product.id}`}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Vendors */}
        {featuredVendors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <h3 className="font-bold text-lg font-display">Featured Shops</h3>
            </div>
            <div className="grid gap-4">
              {featuredVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </div>
        )}

        {/* Explore - All Vendors */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg font-display">Explore Nearby</h3>
            </div>
            <Link href="/shops">
              <span className="text-primary text-sm font-medium cursor-pointer" data-testid="link-see-all-vendors">See all</span>
            </Link>
          </div>
          <div className="grid gap-6">
            {vendors?.slice(0, 5).map((vendor) => (
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
