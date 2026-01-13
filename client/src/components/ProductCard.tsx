import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/routes";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-sm hover:border-primary/20 transition-colors"
    >
      <div className="flex-1">
        <h4 className="font-bold text-base mb-1">{product.name}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
        <p className="font-bold text-primary">LSL {Number(product.price).toFixed(2)}</p>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-xl bg-muted overflow-hidden flex-shrink-0 relative">
          {/* Unsplash Food Image */}
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <Button 
          size="sm" 
          onClick={onAdd}
          className="w-full rounded-full h-8 bg-secondary hover:bg-primary text-white shadow-md shadow-black/10 transition-all hover:shadow-lg hover:shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
    </motion.div>
  );
}
