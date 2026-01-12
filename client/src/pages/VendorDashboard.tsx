import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Store, Package, DollarSign, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Vendor, Order } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  accepted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ready: "bg-green-500/10 text-green-600 border-green-500/20",
  completed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

function OrderCard({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (status: string) => void }) {
  const nextStatus: Record<string, string | null> = {
    pending: "accepted",
    accepted: "preparing",
    preparing: "ready",
    ready: "completed",
    completed: null,
    cancelled: null,
  };

  const next = nextStatus[order.status];

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold">Order #{order.id}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Badge className={statusColors[order.status]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="font-bold text-primary">${order.totalAmount}</span>
          <div className="flex gap-2">
            {order.status === "pending" && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onUpdateStatus("cancelled")}
                data-testid={`button-cancel-${order.id}`}
              >
                <XCircle className="w-4 h-4 mr-1" /> Decline
              </Button>
            )}
            {next && (
              <Button 
                size="sm" 
                onClick={() => onUpdateStatus(next)}
                data-testid={`button-next-${order.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" /> 
                {next === "accepted" ? "Accept" : next === "preparing" ? "Start Preparing" : next === "ready" ? "Mark Ready" : "Complete"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VendorDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const myVendor = vendors.find(v => v.ownerId === user?.id);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/vendors", myVendor?.id, "orders"],
    enabled: !!myVendor,
    queryFn: async () => {
      if (!myVendor) return [];
      const res = await fetch(`/api/vendors/${myVendor.id}/orders`);
      return res.json();
    }
  });

  const toggleOpenMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      if (!myVendor) return;
      const res = await apiRequest("PATCH", `/api/vendors/${myVendor.id}/open`, { isOpen });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: myVendor?.isOpen ? "Shop closed" : "Shop opened" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", myVendor?.id, "orders"] });
      toast({ title: "Order updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update order", description: error.message, variant: "destructive" });
    }
  });

  const isLoading = vendorsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!myVendor) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-display">Vendor Dashboard</h1>
          </div>
        </header>
        
        <main className="px-5 py-12 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Become a Vendor</h2>
          <p className="text-muted-foreground mb-6">Start selling on A1 Services and reach students across campus</p>
          <Button onClick={() => navigate('/shops')} data-testid="button-become-vendor">
            <Store className="w-4 h-4 mr-2" /> Open Your Shop
          </Button>
        </main>
        
        <BottomNav />
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === "pending");
  const activeOrders = orders.filter(o => ["accepted", "preparing", "ready"].includes(o.status));
  const completedOrders = orders.filter(o => ["completed", "cancelled"].includes(o.status));
  
  const todayRevenue = orders
    .filter(o => o.status === "completed" && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-display">{myVendor.name}</h1>
              <p className="text-sm text-muted-foreground">{myVendor.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{myVendor.isOpen ? "Open" : "Closed"}</span>
            <Switch 
              checked={myVendor.isOpen} 
              onCheckedChange={(v) => toggleOpenMutation.mutate(v)}
              data-testid="switch-shop-open"
            />
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{pendingOrders.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{activeOrders.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">${todayRevenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1" data-testid="tab-pending">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1" data-testid="tab-active">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1" data-testid="tab-history">
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-4">
            {pendingOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending orders</p>
            ) : (
              pendingOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-4">
            {activeOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active orders</p>
            ) : (
              activeOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            {completedOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No order history</p>
            ) : (
              completedOrders.slice(0, 20).map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={() => {}}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
