import { motion } from "framer-motion";
import { Link } from "wouter";
import { Star, MapPin, Clock } from "lucide-react";
import type { Vendor } from "@shared/routes";

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link href={`/vendor/${vendor.id}`}>
      <motion.div
        whileHover={{ y: -4, shadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
        whileTap={{ scale: 0.98 }}
        className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm cursor-pointer group"
      >
        <div className="relative h-40 bg-muted overflow-hidden">
          {/* Unsplash Food/Restaurant Image */}
          <img
            src={vendor.imageUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800"}
            alt={vendor.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-xs font-bold text-foreground">4.8</span>
          </div>
          
          {!vendor.isOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full text-sm border border-white/20">
                Closed Now
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-bold text-foreground font-display line-clamp-1">
            {vendor.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
            {vendor.description || "Best food and services on campus"}
          </p>
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {vendor.location}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              10-20 min
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
