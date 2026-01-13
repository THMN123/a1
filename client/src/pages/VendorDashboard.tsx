import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Store, Package, DollarSign, Clock, CheckCircle, XCircle, Loader2, Bell, X, MapPin, Settings, FileText, Download, Briefcase } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import type { Vendor, Order, ServiceRequest } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  accepted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  preparing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  ready: "bg-green-500/10 text-green-600 border-green-500/20",
  completed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  quoted: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  in_progress: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

function ServiceRequestCard({ request, onUpdateStatus }: { request: ServiceRequest; onUpdateStatus: (status: string) => void }) {
  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'Document';
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold">{request.serviceName}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Badge className={statusColors[request.status] || statusColors.pending}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
          </Badge>
        </div>

        {request.description && (
          <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
        )}

        {request.attachments && request.attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <FileText className="w-4 h-4" /> Attachments ({request.attachments.length})
            </p>
            <div className="space-y-1">
              {request.attachments.map((url, i) => {
                const fileName = getFileName(url);
                return (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                    <span className="text-sm truncate flex-1">{fileName}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDownload(url, fileName)}
                      data-testid={`button-download-${i}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {request.quotedPrice && (
          <p className="text-sm mb-2">
            <span className="text-muted-foreground">Quoted: </span>
            <span className="font-bold text-primary">LSL {request.quotedPrice}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          {request.status === "pending" && (
            <>
              <Button size="sm" variant="destructive" onClick={() => onUpdateStatus("cancelled")} data-testid={`button-decline-request-${request.id}`}>
                <XCircle className="w-4 h-4 mr-1" /> Decline
              </Button>
              <Button size="sm" onClick={() => onUpdateStatus("accepted")} data-testid={`button-accept-request-${request.id}`}>
                <CheckCircle className="w-4 h-4 mr-1" /> Accept
              </Button>
            </>
          )}
          {request.status === "accepted" && (
            <Button size="sm" onClick={() => onUpdateStatus("in_progress")} data-testid={`button-start-request-${request.id}`}>
              Start Working
            </Button>
          )}
          {request.status === "in_progress" && (
            <Button size="sm" onClick={() => onUpdateStatus("completed")} data-testid={`button-complete-request-${request.id}`}>
              <CheckCircle className="w-4 h-4 mr-1" /> Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
          <div className="flex flex-col items-end gap-1">
            <Badge className={statusColors[order.status]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            {order.fulfillmentMethod && (
              <Badge variant="outline" className="text-xs">
                {order.fulfillmentMethod === "pickup" ? (
                  <><Package className="w-3 h-3 mr-1" />Pickup</>
                ) : (
                  <><MapPin className="w-3 h-3 mr-1" />Delivery</>
                )}
              </Badge>
            )}
          </div>
        </div>

        {order.fulfillmentMethod === "delivery" && order.deliveryAddress && (
          <div className="mb-3 p-2 bg-blue-500/5 rounded-lg text-sm">
            <span className="text-muted-foreground">Deliver to: </span>
            {order.deliveryAddress}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="font-bold text-primary">LSL {order.totalAmount}</span>
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
  const { isSupported, isSubscribed, permission, subscribe, isLoading: pushLoading } = usePushNotifications();
  const [showPushBanner, setShowPushBanner] = useState(true);

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

  const { data: serviceRequests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ["/api/vendors", myVendor?.id, "service-requests"],
    enabled: !!myVendor && myVendor.vendorType === "service",
    queryFn: async () => {
      if (!myVendor) return [];
      const res = await fetch(`/api/vendors/${myVendor.id}/service-requests`);
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

  const updateFulfillmentMutation = useMutation({
    mutationFn: async (data: { offersPickup?: boolean; offersDelivery?: boolean }) => {
      if (!myVendor) return;
      const res = await apiRequest("PATCH", `/api/vendors/${myVendor.id}/fulfillment`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Settings updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update settings", description: error.message, variant: "destructive" });
    }
  });

  const updateServiceRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/service-requests/${requestId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", myVendor?.id, "service-requests"] });
      toast({ title: "Request updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update request", description: error.message, variant: "destructive" });
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

  const pendingRequests = serviceRequests.filter(r => r.status === "pending");
  const activeRequests = serviceRequests.filter(r => ["accepted", "in_progress"].includes(r.status));
  const isServiceVendor = myVendor?.vendorType === "service";

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
        {isSupported && !isSubscribed && showPushBanner && permission !== 'denied' && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3 relative">
            <Bell className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Enable Push Notifications</p>
              <p className="text-xs text-muted-foreground mb-2">Get instant alerts when customers place orders</p>
              <Button 
                size="sm" 
                onClick={async () => {
                  const success = await subscribe();
                  if (success) {
                    toast({ title: "Notifications enabled!", description: "You'll now receive order alerts" });
                    setShowPushBanner(false);
                  }
                }}
                disabled={pushLoading}
                data-testid="button-enable-push"
              >
                <Bell className="w-4 h-4 mr-1" />
                Enable Notifications
              </Button>
            </div>
            <button 
              onClick={() => setShowPushBanner(false)}
              className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
              data-testid="button-dismiss-push-banner"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

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
              <p className="text-2xl font-bold">LSL {todayRevenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className={`w-full grid ${isServiceVendor ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeOrders.length})
            </TabsTrigger>
            {isServiceVendor && (
              <TabsTrigger value="requests" data-testid="tab-requests">
                <Briefcase className="w-4 h-4 mr-1" />
                {pendingRequests.length > 0 && <span className="ml-1">({pendingRequests.length})</span>}
              </TabsTrigger>
            )}
            <TabsTrigger value="history" data-testid="tab-history">
              History
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4" />
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
          
          {isServiceVendor && (
            <TabsContent value="requests" className="mt-4">
              {serviceRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No service requests yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Customer document uploads will appear here</p>
                </div>
              ) : (
                <>
                  {pendingRequests.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending Requests</h3>
                      {pendingRequests.map(request => (
                        <ServiceRequestCard
                          key={request.id}
                          request={request}
                          onUpdateStatus={(status) => updateServiceRequestMutation.mutate({ requestId: request.id, status })}
                        />
                      ))}
                    </div>
                  )}
                  {activeRequests.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">In Progress</h3>
                      {activeRequests.map(request => (
                        <ServiceRequestCard
                          key={request.id}
                          request={request}
                          onUpdateStatus={(status) => updateServiceRequestMutation.mutate({ requestId: request.id, status })}
                        />
                      ))}
                    </div>
                  )}
                  {serviceRequests.filter(r => ["completed", "cancelled"].includes(r.status)).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed</h3>
                      {serviceRequests.filter(r => ["completed", "cancelled"].includes(r.status)).map(request => (
                        <ServiceRequestCard
                          key={request.id}
                          request={request}
                          onUpdateStatus={() => {}}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          )}

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

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fulfillment Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Pickup</p>
                      <p className="text-sm text-muted-foreground">Customers collect orders at your location</p>
                    </div>
                  </div>
                  <Switch
                    checked={myVendor.offersPickup}
                    onCheckedChange={(checked) => {
                      if (!checked && !myVendor.offersDelivery) {
                        toast({ title: "At least one option required", variant: "destructive" });
                        return;
                      }
                      updateFulfillmentMutation.mutate({ offersPickup: checked });
                    }}
                    data-testid="switch-offers-pickup"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Delivery</p>
                      <p className="text-sm text-muted-foreground">Deliver orders to customers</p>
                    </div>
                  </div>
                  <Switch
                    checked={myVendor.offersDelivery}
                    onCheckedChange={(checked) => {
                      if (!checked && !myVendor.offersPickup) {
                        toast({ title: "At least one option required", variant: "destructive" });
                        return;
                      }
                      updateFulfillmentMutation.mutate({ offersDelivery: checked });
                    }}
                    data-testid="switch-offers-delivery"
                  />
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Customers will see these options during checkout
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
