import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, X, Store, Package, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Vendor, Product } from "@shared/schema";

interface VendorCategory {
  id: number;
  name: string;
  icon: string;
}

type SearchType = "all" | "shops" | "products";

export function GlobalSearch() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<VendorCategory[]>({
    queryKey: ["/api/categories"],
  });

  const filteredVendors = vendors.filter((vendor) => {
    const matchesQuery = query === "" || 
      vendor.name.toLowerCase().includes(query.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === null || vendor.categoryId === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const filteredProducts = products.filter((product) => {
    const matchesQuery = query === "" || 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase());
    const vendor = vendors.find(v => v.id === product.vendorId);
    const matchesCategory = selectedCategory === null || vendor?.categoryId === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const showVendors = searchType === "all" || searchType === "shops";
  const showProducts = searchType === "all" || searchType === "products";

  const hasResults = (showVendors && filteredVendors.length > 0) || (showProducts && filteredProducts.length > 0);
  const showResults = isOpen && query.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (path: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search food, shops, services..." 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-transparent focus:bg-white focus:border-primary/50 transition-all"
          data-testid="input-global-search"
        />
        {query && (
          <button 
            onClick={() => setQuery("")}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm border border-border/50 cursor-pointer hover:border-primary/50"
        >
          <Filter className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card rounded-xl border border-border shadow-xl z-50 max-h-[60vh] overflow-hidden"
          >
            <div className="p-3 border-b border-border/50">
              <div className="flex gap-2 mb-3">
                {(["all", "shops", "products"] as SearchType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      searchType === type
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                    data-testid={`filter-${type}`}
                  >
                    {type === "all" ? "All" : type === "shops" ? "Shops" : "Products"}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                    selectedCategory === null
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1",
                      selectedCategory === cat.id
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[40vh]">
              {!query ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Start typing to search...
                </div>
              ) : !hasResults ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {showVendors && filteredVendors.length > 0 && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase">
                        <Store className="w-3 h-3" />
                        Shops ({filteredVendors.length})
                      </div>
                      {filteredVendors.slice(0, 5).map((vendor) => (
                        <button
                          key={vendor.id}
                          onClick={() => handleItemClick(`/vendor/${vendor.id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                          data-testid={`search-vendor-${vendor.id}`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            <img 
                              src={vendor.imageUrl || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100"} 
                              alt={vendor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{vendor.description}</p>
                          </div>
                          {vendor.isOpen && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              Open
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {showProducts && filteredProducts.length > 0 && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase">
                        <Package className="w-3 h-3" />
                        Products ({filteredProducts.length})
                      </div>
                      {filteredProducts.slice(0, 5).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleItemClick(`/vendor/${product.vendorId}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                          data-testid={`search-product-${product.id}`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            <img 
                              src={product.imageUrl || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100"} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                          </div>
                          <span className="text-primary font-bold text-sm">LSL {product.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
