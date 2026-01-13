import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Store, Package, ShoppingBag, BarChart3, Settings, Plus, Pencil, Trash2, 
  Clock, DollarSign, TrendingUp, ArrowLeft, Loader2, CheckCircle, XCircle,
  Upload, Image, Camera, Bell, Volume2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLocation } from "wouter";
import type { Vendor, Product, Order } from "@shared/schema";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  category: z.string().optional(),
  prepTimeMinutes: z.string().optional(),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

const DEFAULT_CATEGORIES = [
  "Mains",
  "Sides",
  "Drinks",
  "Desserts",
  "Snacks",
  "Combos",
  "Specials",
];

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const shopFormSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  deliveryTime: z.string().optional(),
});

function OverviewTab({ vendor, analytics }: { vendor: Vendor; analytics: any }) {
  const weeklyData = analytics?.weeklyData || [
    { day: 'Mon', orders: 0, revenue: 0 },
    { day: 'Tue', orders: 0, revenue: 0 },
    { day: 'Wed', orders: 0, revenue: 0 },
    { day: 'Thu', orders: 0, revenue: 0 },
    { day: 'Fri', orders: 0, revenue: 0 },
    { day: 'Sat', orders: 0, revenue: 0 },
    { day: 'Sun', orders: 0, revenue: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics?.totalOrders || 0}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">LSL {analytics?.totalRevenue || "0.00"}</p>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">LSL {analytics?.avgOrderValue || "0.00"}</p>
              <p className="text-sm text-muted-foreground">Avg Order</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vendor.isOpen ? "Open" : "Closed"}</p>
              <p className="text-sm text-muted-foreground">Shop Status</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Weekly Orders</h3>
        <div className="h-48" data-testid="chart-weekly-orders">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Revenue Trend</h3>
        <div className="h-48" data-testid="chart-revenue-trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `LSL ${val}`} />
              <Tooltip 
                formatter={(value: number) => [`LSL ${value.toFixed(2)}`, 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(142 76% 36%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Shop Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{vendor.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span>{vendor.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery Time</span>
            <span>{vendor.deliveryTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rating</span>
            <span>{vendor.rating}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProductsTab({ products, onAdd, onEdit, onDelete }: { 
  products: Product[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Products ({products.length})</h3>
        <Button onClick={onAdd} size="sm" data-testid="button-add-product">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground">Add your first product to start selling</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id} className="p-4" data-testid={`product-item-${product.id}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium truncate">{product.name}</h4>
                    {product.category && (
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    )}
                    <Badge variant={product.isAvailable ? "default" : "secondary"}>
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="font-semibold text-primary">${product.price}</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {product.prepTimeMinutes} min
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(product)} data-testid={`button-edit-product-${product.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)} data-testid={`button-delete-product-${product.id}`}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ orders, onUpdateStatus }: { 
  orders: Order[];
  onUpdateStatus: (orderId: number, status: string) => void;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    accepted: "bg-blue-500",
    preparing: "bg-orange-500",
    ready: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  const getNextStatus = (current: string) => {
    const flow: Record<string, string> = {
      pending: "accepted",
      accepted: "preparing",
      preparing: "ready",
      ready: "completed",
    };
    return flow[current];
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Orders ({orders.length})</h3>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-4" data-testid={`order-item-${order.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Order #{order.id}</span>
                  <Badge className={statusColors[order.status]}>
                    {order.status}
                  </Badge>
                </div>
                <span className="font-semibold">${order.totalAmount}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {new Date(order.createdAt).toLocaleString()}
              </p>
              {order.status !== "completed" && order.status !== "cancelled" && (
                <div className="flex gap-2">
                  {getNextStatus(order.status) && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}
                      data-testid={`button-advance-order-${order.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as {getNextStatus(order.status)}
                    </Button>
                  )}
                  {order.status === "pending" && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onUpdateStatus(order.id, "cancelled")}
                      data-testid={`button-cancel-order-${order.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

type HoursEntry = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

function ShopSettingsTab({ vendor, onUpdate }: { vendor: Vendor; onUpdate: (data: any) => void }) {
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState(vendor.imageUrl || "");
  const [bannerUrl, setBannerUrl] = useState(vendor.coverImageUrl || "");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile: uploadLogo, isUploading: isUploadingLogo } = useUpload({
    onSuccess: (response) => {
      setLogoUrl(response.objectPath);
      onUpdate({ imageUrl: response.objectPath });
      toast({ title: "Logo uploaded successfully" });
    },
    onError: () => toast({ title: "Failed to upload logo", variant: "destructive" })
  });

  const { uploadFile: uploadBanner, isUploading: isUploadingBanner } = useUpload({
    onSuccess: (response) => {
      setBannerUrl(response.objectPath);
      onUpdate({ coverImageUrl: response.objectPath });
      toast({ title: "Banner uploaded successfully" });
    },
    onError: () => toast({ title: "Failed to upload banner", variant: "destructive" })
  });

  const { data: vendorHours = [] } = useQuery<HoursEntry[]>({
    queryKey: ['/api/vendor-admin/hours'],
  });

  const defaultHours: HoursEntry[] = DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: parseInt(day.value),
    openTime: "09:00",
    closeTime: "17:00",
    isClosed: false,
  }));

  const [hours, setHours] = useState<HoursEntry[]>(defaultHours);

  // Update hours when vendor hours load
  if (vendorHours.length > 0 && hours === defaultHours) {
    setHours(vendorHours);
  }

  const updateHoursMutation = useMutation({
    mutationFn: async (hoursData: HoursEntry[]) => {
      return await apiRequest('PUT', '/api/vendor-admin/hours', { hours: hoursData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/hours'] });
      toast({ title: "Business hours updated" });
    },
    onError: () => {
      toast({ title: "Failed to update hours", variant: "destructive" });
    }
  });

  const handleHoursChange = (dayOfWeek: number, field: 'openTime' | 'closeTime' | 'isClosed', value: string | boolean) => {
    setHours(prev => prev.map(h => 
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const saveHours = () => {
    updateHoursMutation.mutate(hours);
  };
  
  const form = useForm({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: vendor.name,
      description: vendor.description || "",
      location: vendor.location,
      deliveryTime: vendor.deliveryTime || "",
    },
  });

  const [isOpen, setIsOpen] = useState(vendor.isOpen);
  const [orderNotifications, setOrderNotifications] = useState(true);

  const toggleOpenMutation = useMutation({
    mutationFn: async (open: boolean) => {
      return await apiRequest('PUT', '/api/vendor-admin/shop', { isOpen: open });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/shop'] });
      toast({ title: isOpen ? "Shop is now open" : "Shop is now closed" });
    }
  });

  const handleToggleOpen = (checked: boolean) => {
    setIsOpen(checked);
    toggleOpenMutation.mutate(checked);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogo(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadBanner(file);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Shop Status</h3>
            <p className="text-sm text-muted-foreground">Toggle your shop open or closed</p>
          </div>
          <Switch 
            checked={isOpen} 
            onCheckedChange={handleToggleOpen}
            data-testid="switch-shop-open"
          />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Shop Images</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Shop Logo</Label>
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
              data-testid="upload-logo"
            >
              {isUploadingLogo ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <input 
              ref={logoInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleLogoUpload}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Banner Image</Label>
            <div 
              onClick={() => bannerInputRef.current?.click()}
              className="w-full h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
              data-testid="upload-banner"
            >
              {isUploadingBanner ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center">
                  <Image className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Upload Banner</span>
                </div>
              )}
            </div>
            <input 
              ref={bannerInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleBannerUpload}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">Order Notifications</h3>
              <p className="text-sm text-muted-foreground">Play sound for new orders</p>
            </div>
          </div>
          <Switch 
            checked={orderNotifications} 
            onCheckedChange={setOrderNotifications}
            data-testid="switch-order-notifications"
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Business Hours</h3>
          </div>
          <Button 
            size="sm" 
            onClick={saveHours}
            disabled={updateHoursMutation.isPending}
            data-testid="button-save-hours"
          >
            {updateHoursMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Hours
          </Button>
        </div>
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const dayHours = hours.find(h => h.dayOfWeek === parseInt(day.value)) || {
              dayOfWeek: parseInt(day.value),
              openTime: "09:00",
              closeTime: "17:00",
              isClosed: false,
            };
            return (
              <div key={day.value} className="flex items-center gap-4" data-testid={`hours-${day.label.toLowerCase()}`}>
                <div className="w-20 flex-shrink-0">
                  <span className="text-sm font-medium">{day.label.slice(0, 3)}</span>
                </div>
                <Switch
                  checked={!dayHours.isClosed}
                  onCheckedChange={(checked) => handleHoursChange(parseInt(day.value), 'isClosed', !checked)}
                  data-testid={`switch-${day.label.toLowerCase()}-open`}
                />
                {!dayHours.isClosed ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={dayHours.openTime}
                      onChange={(e) => handleHoursChange(parseInt(day.value), 'openTime', e.target.value)}
                      className="w-28"
                      data-testid={`input-${day.label.toLowerCase()}-open`}
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={dayHours.closeTime}
                      onChange={(e) => handleHoursChange(parseInt(day.value), 'closeTime', e.target.value)}
                      className="w-28"
                      data-testid={`input-${day.label.toLowerCase()}-close`}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Shop Details</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-shop-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} data-testid="input-shop-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-shop-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Time</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 15-25 min" data-testid="input-delivery-time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" data-testid="button-save-shop">
              Save Changes
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default function VendorAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string>("");
  const productImageRef = useRef<HTMLInputElement>(null);

  const { uploadFile: uploadProductImage, isUploading: isUploadingProductImage } = useUpload({
    onSuccess: (response) => {
      setProductImageUrl(response.objectPath);
      toast({ title: "Image uploaded" });
    },
    onError: () => toast({ title: "Failed to upload image", variant: "destructive" })
  });

  const productForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      prepTimeMinutes: "10",
      isAvailable: true,
      imageUrl: "",
    },
  });

  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor | null>({
    queryKey: ['/api/vendor-admin/shop'],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/vendor-admin/products'],
    enabled: !!vendor,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/vendor-admin/orders'],
    enabled: !!vendor,
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/vendor-admin/analytics'],
    enabled: !!vendor,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/vendor-admin/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/products'] });
      setProductDialogOpen(false);
      productForm.reset();
      toast({ title: "Product created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/vendor-admin/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/products'] });
      setProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({ title: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/vendor-admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/products'] });
      toast({ title: "Product deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/analytics'] });
      toast({ title: "Order updated" });
    },
  });

  const updateShopMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', '/api/vendor-admin/shop', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/shop'] });
      toast({ title: "Shop updated successfully" });
    },
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductImageUrl("");
    productForm.reset({
      name: "",
      description: "",
      price: "",
      category: "",
      prepTimeMinutes: "10",
      isAvailable: true,
      imageUrl: "",
    });
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductImageUrl(product.imageUrl || "");
    productForm.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category || "",
      prepTimeMinutes: String(product.prepTimeMinutes),
      isAvailable: product.isAvailable,
      imageUrl: product.imageUrl || "",
    });
    setProductDialogOpen(true);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadProductImage(file);
  };

  const handleProductSubmit = (data: any) => {
    const productData = {
      name: data.name,
      description: data.description || null,
      price: data.price,
      category: data.category || null,
      prepTimeMinutes: parseInt(data.prepTimeMinutes) || 10,
      isAvailable: data.isAvailable,
      imageUrl: productImageUrl || null,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  if (vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/profile')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-display">Vendor Admin</h1>
          </div>
        </header>

        <main className="px-5 py-8">
          <Card className="p-8 text-center">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Shop Found</h2>
            <p className="text-muted-foreground mb-6">
              You don't have a shop yet. Apply to become a vendor and start selling on A1 Services.
            </p>
            <Button onClick={() => navigate('/become-vendor')} data-testid="button-become-vendor">
              Become a Vendor
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold font-display">{vendor.name}</h1>
            <p className="text-sm text-muted-foreground">Vendor Dashboard</p>
          </div>
        </div>
      </header>

      <main className="px-5 py-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <ShoppingBag className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab vendor={vendor} analytics={analytics} />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab 
              products={products}
              onAdd={handleAddProduct}
              onEdit={handleEditProduct}
              onDelete={(id) => deleteProductMutation.mutate(id)}
            />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab 
              orders={orders}
              onUpdateStatus={(orderId, status) => updateOrderMutation.mutate({ orderId, status })}
            />
          </TabsContent>

          <TabsContent value="settings">
            <ShopSettingsTab 
              vendor={vendor}
              onUpdate={(data) => updateShopMutation.mutate(data)}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-product-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Product Image</Label>
                <div 
                  onClick={() => productImageRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                  data-testid="upload-product-image"
                >
                  {isUploadingProductImage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : productImageUrl ? (
                    <img src={productImageUrl} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Upload Image</span>
                    </div>
                  )}
                </div>
                <input 
                  ref={productImageRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleProductImageUpload}
                />
              </div>

              <FormField
                control={productForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-product-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="prepTimeMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-prep-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={productForm.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Available for sale</FormLabel>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                        data-testid="switch-product-available"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  data-testid="button-save-product"
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingProduct ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
