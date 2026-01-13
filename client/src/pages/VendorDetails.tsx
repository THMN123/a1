import { useParams, useLocation } from "wouter";
import { useVendor, useVendorProducts } from "@/hooks/use-vendors";
import { useCreateOrder } from "@/hooks/use-orders";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft, Star, ShoppingBag, Loader2, Briefcase, Upload, FileText, X, Image as ImageIcon, Calendar, Send, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, Vendor } from "@shared/schema";

export default function VendorDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const vendorId = Number(id);
  const { data: vendor, isLoading: loadingVendor } = useVendor(vendorId);
  const { data: products, isLoading: loadingProducts } = useVendorProducts(vendorId);
  const { mutate: createOrder, isPending: creatingOrder } = useCreateOrder();
  const { toast } = useToast();

  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingData, setBookingData] = useState({ serviceName: "", description: "" });
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const isServiceVendor = vendor?.vendorType === "service";

  const serviceBookingMutation = useMutation({
    mutationFn: async (data: { vendorId: number; serviceName: string; description: string; attachments: string[] }) => {
      return await apiRequest('POST', '/api/service-requests', data);
    },
    onSuccess: () => {
      setBookingOpen(false);
      setBookingData({ serviceName: "", description: "" });
      setUploadedFiles([]);
      toast({
        title: "Service Request Sent!",
        description: "The vendor will review your request and get back to you.",
      });
      setLocation("/orders");
    },
    onError: () => {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/objects/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setUploadedFiles(prev => [...prev, { name: file.name, url: data.url }]);
        }
      }
    } catch (err) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceBooking = () => {
    if (!bookingData.serviceName.trim()) {
      toast({ title: "Please enter a service name", variant: "destructive" });
      return;
    }
    serviceBookingMutation.mutate({
      vendorId,
      serviceName: bookingData.serviceName,
      description: bookingData.description,
      attachments: uploadedFiles.map(f => f.url)
    });
  };

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

  const openCheckout = () => {
    if (cart.length === 0 || !vendor) return;
    // Set default fulfillment method based on what vendor offers
    if (vendor.offersPickup) {
      setFulfillmentMethod("pickup");
    } else if (vendor.offersDelivery) {
      setFulfillmentMethod("delivery");
    }
    setDeliveryAddress("");
    setCheckoutOpen(true);
  };

  const canPlaceOrder = () => {
    if (fulfillmentMethod === "delivery" && !deliveryAddress.trim()) {
      return false;
    }
    return true;
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (fulfillmentMethod === "delivery" && !deliveryAddress.trim()) {
      toast({ title: "Please enter a delivery address", variant: "destructive" });
      return;
    }
    
    createOrder({
      vendorId,
      paymentMethod: "wallet",
      fulfillmentMethod,
      deliveryAddress: fulfillmentMethod === "delivery" ? deliveryAddress : undefined,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    }, {
      onSuccess: () => {
        setCheckoutOpen(false);
        setCart([]);
        toast({
          title: "Order Placed!",
          description: `Your order will be ready for ${fulfillmentMethod === "pickup" ? "pickup" : "delivery"}.`,
        });
        setLocation("/orders");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.message || "Failed to place order. Please try again.",
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

      {/* Content - Conditional based on vendor type */}
      <div className="px-5 pt-8">
        {isServiceVendor ? (
          <>
            {/* Service Vendor UI */}
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-700">Service Provider</Badge>
              {vendor.customBusinessType && (
                <Badge variant="outline">{vendor.customBusinessType}</Badge>
              )}
            </div>

            {vendor.tags && vendor.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-6">
                {vendor.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h2 className="text-xl font-bold font-display mb-4">Services Offered</h2>
            
            <div className="space-y-4 mb-6">
              {products?.map((product) => (
                <div 
                  key={product.id}
                  className="p-4 bg-card rounded-2xl border border-border/50 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      <p className="text-primary font-bold">Starting from LSL {product.price}</p>
                    </div>
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-lg object-cover ml-4" />
                    )}
                  </div>
                </div>
              ))}
              {products?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-2xl border-dashed border-2 border-border">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No services listed yet.</p>
                  <p className="text-sm">Contact the vendor directly.</p>
                </div>
              )}
            </div>

            {/* Portfolio Gallery */}
            {vendor.portfolioImages && vendor.portfolioImages.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold font-display mb-4">Portfolio</h2>
                <div className="grid grid-cols-3 gap-2">
                  {vendor.portfolioImages.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden">
                      <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Book Now Button */}
            <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
                  data-testid="button-book-now"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now / Inquire
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle>Book a Service</DialogTitle>
                  <DialogDescription>
                    Send a service request to {vendor.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Service Needed</label>
                    <Input
                      placeholder="e.g., Document Printing, Logo Design..."
                      value={bookingData.serviceName}
                      onChange={(e) => setBookingData(prev => ({ ...prev, serviceName: e.target.value }))}
                      data-testid="input-service-name"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Details / Instructions</label>
                    <Textarea
                      placeholder="Describe what you need..."
                      value={bookingData.description}
                      onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      data-testid="input-service-description"
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Attachments (PDFs, Images, Documents)</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                      data-testid="button-upload-files"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploading ? "Uploading..." : "Upload Files"}
                    </Button>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm flex-1 truncate">{file.name}</span>
                            <button
                              onClick={() => removeFile(i)}
                              className="p-1 hover:bg-background rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleServiceBooking}
                    disabled={serviceBookingMutation.isPending}
                    className="w-full"
                    data-testid="button-send-request"
                  >
                    {serviceBookingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Request
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            {/* Product Vendor UI (Original) */}
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
          </>
        )}
      </div>

      {/* Floating Cart Button - Only for product vendors */}
      <AnimatePresence>
        {!isServiceVendor && cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-5 right-5 z-50"
          >
            <Button 
              onClick={openCheckout}
              disabled={creatingOrder}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 flex items-center justify-between px-6 text-lg font-bold"
              data-testid="button-open-checkout"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {cartCount} items
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>Checkout</span>
                <span className="opacity-60">|</span>
                <span>LSL {cartTotal.toFixed(2)}</span>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>
              Choose how you want to receive your order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Order Summary */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h4 className="font-medium mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>LSL {(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                  <span>Total</span>
                  <span>LSL {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Fulfillment Method Selection */}
            <div>
              <h4 className="font-medium mb-3">How would you like to receive your order?</h4>
              <div className="grid gap-3">
                {vendor?.offersPickup && (
                  <button
                    onClick={() => setFulfillmentMethod("pickup")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      fulfillmentMethod === "pickup" 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="button-pickup"
                  >
                    <div className={`p-3 rounded-full ${fulfillmentMethod === "pickup" ? "bg-primary text-white" : "bg-muted"}`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Pickup</div>
                      <div className="text-sm text-muted-foreground">Collect from {vendor?.location}</div>
                    </div>
                  </button>
                )}
                
                {vendor?.offersDelivery && (
                  <button
                    onClick={() => setFulfillmentMethod("delivery")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      fulfillmentMethod === "delivery" 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid="button-delivery"
                  >
                    <div className={`p-3 rounded-full ${fulfillmentMethod === "delivery" ? "bg-primary text-white" : "bg-muted"}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Delivery</div>
                      <div className="text-sm text-muted-foreground">We'll bring it to you</div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Address Input */}
            {fulfillmentMethod === "delivery" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Delivery Address</label>
                <Textarea
                  placeholder="Enter your delivery address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="resize-none"
                  data-testid="input-delivery-address"
                />
              </div>
            )}

            {/* Place Order Button */}
            <Button
              onClick={handleCheckout}
              disabled={creatingOrder || !canPlaceOrder()}
              className="w-full h-12"
              data-testid="button-place-order"
            >
              {creatingOrder ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Place Order - LSL {cartTotal.toFixed(2)}
            </Button>
            {fulfillmentMethod === "delivery" && !deliveryAddress.trim() && (
              <p className="text-xs text-destructive text-center">Please enter a delivery address</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
