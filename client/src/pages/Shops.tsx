import { BottomNav } from "@/components/BottomNav";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { Search, MapPin, Star, Clock, ChevronRight, Loader2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Vendor } from "@shared/schema";

interface VendorCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export default function Shops() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: loadingCategories } = useQuery<VendorCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: vendors, isLoading: loadingVendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesCategory = selectedCategory === null || vendor.categoryId === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredVendors = filteredVendors?.filter(v => v.isFeatured);
  const regularVendors = filteredVendors?.filter(v => !v.isFeatured);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-14 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-display font-bold">Shops</h1>
            <p className="text-muted-foreground text-sm">Discover amazing vendors</p>
          </div>
          <div className="flex items-center gap-3">
            <ProfileSwitcher />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Campus</span>
            </div>
          </div>
        </div>
        
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search shops, food, services..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-xl bg-white border-border/50 focus:border-primary/50 shadow-sm"
            data-testid="input-search"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors">
            <Filter className="w-4 h-4 text-primary" />
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6">
        {loadingCategories ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-muted rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                selectedCategory === null
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
              data-testid="button-category-all"
            >
              All
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0",
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
                data-testid={`button-category-${cat.id}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {featuredVendors && featuredVendors.length > 0 && (
          <section>
            <h2 className="font-bold text-lg font-display mb-4">Featured Shops</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
              {featuredVendors.map((vendor, i) => (
                <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="min-w-[280px] rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-lg transition-shadow cursor-pointer group"
                    data-testid={`card-featured-vendor-${vendor.id}`}
                  >
                    <div className="relative h-36">
                      <img
                        src={vendor.coverImageUrl || vendor.imageUrl || `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600`}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-lg">{vendor.name}</h3>
                        <div className="flex items-center gap-2 text-white/80 text-xs">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span>{vendor.rating || "4.5"}</span>
                          <span className="opacity-50">|</span>
                          <Clock className="w-3 h-3" />
                          <span>{vendor.deliveryTime || "15-25 min"}</span>
                        </div>
                      </div>
                      {vendor.isOpen && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          OPEN
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg font-display">All Shops</h2>
            <span className="text-sm text-muted-foreground">{filteredVendors?.length || 0} shops</span>
          </div>
          
          {loadingVendors ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {regularVendors?.map((vendor, i) => (
                  <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      data-testid={`card-vendor-${vendor.id}`}
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={vendor.imageUrl || `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200`}
                          alt={vendor.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-base truncate">{vendor.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{vendor.description || vendor.location}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            {vendor.rating || "4.5"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {vendor.deliveryTime || "15-25 min"}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            vendor.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                          )}>
                            {vendor.isOpen ? "Open" : "Closed"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </AnimatePresence>
              
              {filteredVendors?.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Store className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">No shops found</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "Try a different search term" : "No vendors available in this category yet"}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function Store(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}
