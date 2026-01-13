import { useParams, useLocation } from "wouter";
import { useVendor, useVendorProducts } from "@/hooks/use-vendors";
import { useCreateOrder } from "@/hooks/use-orders";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft, Star, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@shared/routes";

export default function VendorDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const vendorId = Number(id);
  const { data: vendor, isLoading: loadingVendor } = useVendor(vendorId);
  const { data: products, isLoading: loadingProducts } = useVendorProducts(vendorId);
  const { mutate: createOrder, isPending: creatingOrder } = useCreateOrder();
  const { toast } = useToast();

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast({
      title: "Added to cart",
      description: `${product.name} added.`,
      duration: 1500,
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    createOrder({
      vendorId,
      paymentMethod: "wallet", // Default for now
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    }, {
      onSuccess: () => {
        toast({
          title: "Order Placed!",
          description: "Track your order in the Orders tab.",
        });
        setLocation("/orders");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to place order. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  if (loadingVendor || loadingProducts) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  if (!vendor) return <div>Vendor not found</div>;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Header */}
      <div className="relative h-64">
        {/* Unsplash Restaurant Image */}
        <img 
          src={vendor.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000"} 
          alt={vendor.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        <button 
          onClick={() => window.history.back()}
          className="absolute top-12 left-5 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-6 left-5 right-5 text-white">
          <h1 className="text-3xl font-bold font-display mb-2">{vendor.name}</h1>
          <div className="flex items-center gap-4 text-sm font-medium text-white/90">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.8
            </span>
            <span>•</span>
            <span>{vendor.location}</span>
            <span>•</span>
            <span className={vendor.isOpen ? "text-green-400" : "text-red-400"}>
              {vendor.isOpen ? "Open Now" : "Closed"}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="px-5 pt-8">
        <h2 className="text-xl font-bold font-display mb-6">Menu</h2>
        
        <div className="space-y-4">
          {products?.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAdd={() => addToCart(product)} 
            />
          ))}
          {products?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-2xl border-dashed border-2 border-border">
              No products available yet.
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-5 right-5 z-50"
          >
            <Button 
              onClick={handleCheckout}
              disabled={creatingOrder}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 flex items-center justify-between px-6 text-lg font-bold"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {cartCount} items
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>View Cart</span>
                <span className="opacity-60">|</span>
                <span>LSL {cartTotal.toFixed(2)}</span>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
