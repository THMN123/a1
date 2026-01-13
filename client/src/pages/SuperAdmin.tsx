import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  LayoutDashboard, Store, Users, Tag, TrendingUp, 
  ArrowLeft, Loader2, CheckCircle, XCircle, Star, Clock,
  DollarSign, ShoppingBag
} from "lucide-react";
import { useLocation } from "wouter";
import type { VendorApplication, Vendor, Promotion } from "@shared/schema";

function DashboardTab({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Platform Overview</h3>
      
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
              <p className="text-2xl font-bold">${analytics?.totalRevenue || "0.00"}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics?.totalVendors || 0}</p>
              <p className="text-sm text-muted-foreground">Vendors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics?.totalUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ApplicationsTab({ 
  applications, 
  onApprove, 
  onReject 
}: { 
  applications: VendorApplication[];
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
}) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingApp, setRejectingApp] = useState<VendorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingApps = applications.filter(a => a.status === 'pending');
  const reviewedApps = applications.filter(a => a.status !== 'pending');

  const handleReject = () => {
    if (rejectingApp) {
      onReject(rejectingApp.id, rejectReason);
      setRejectDialogOpen(false);
      setRejectingApp(null);
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Pending Applications ({pendingApps.length})</h3>
        {pendingApps.length === 0 ? (
          <Card className="p-6 text-center">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No pending applications</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingApps.map((app) => (
              <Card key={app.id} className="p-4" data-testid={`application-item-${app.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{app.businessName}</h4>
                    <p className="text-sm text-muted-foreground">{app.businessType}</p>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 mb-4">
                  <p>Location: {app.location}</p>
                  <p>Email: {app.email}</p>
                  <p>Phone: {app.phone}</p>
                  {app.description && <p>"{app.description}"</p>}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => onApprove(app.id)}
                    data-testid={`button-approve-${app.id}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      setRejectingApp(app);
                      setRejectDialogOpen(true);
                    }}
                    data-testid={`button-reject-${app.id}`}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {reviewedApps.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Reviewed ({reviewedApps.length})</h3>
          <div className="space-y-3">
            {reviewedApps.slice(0, 10).map((app) => (
              <Card key={app.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{app.businessName}</h4>
                    <p className="text-sm text-muted-foreground">{app.businessType}</p>
                  </div>
                  <Badge variant={app.status === 'approved' ? 'default' : 'destructive'}>
                    {app.status === 'approved' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" />Approved</>
                    ) : (
                      <><XCircle className="w-3 h-3 mr-1" />Rejected</>
                    )}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Rejecting: {rejectingApp?.businessName}
            </p>
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} data-testid="button-confirm-reject">
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VendorsTab({ 
  vendors, 
  onToggleFeatured 
}: { 
  vendors: Vendor[];
  onToggleFeatured: (id: number, featured: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">All Vendors ({vendors.length})</h3>
      
      {vendors.length === 0 ? (
        <Card className="p-6 text-center">
          <Store className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No vendors yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="p-4" data-testid={`vendor-item-${vendor.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{vendor.name}</h4>
                    {vendor.isFeatured && (
                      <Badge className="bg-yellow-500">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge variant={vendor.isOpen ? "default" : "secondary"}>
                      {vendor.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{vendor.location}</p>
                  <p className="text-sm text-muted-foreground">Rating: {vendor.rating}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Featured</span>
                  <Switch
                    checked={vendor.isFeatured}
                    onCheckedChange={(checked) => onToggleFeatured(vendor.id, checked)}
                    data-testid={`switch-featured-${vendor.id}`}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PromotionsTab({ promotions }: { promotions: Promotion[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Promotions ({promotions.length})</h3>
        <Button size="sm" data-testid="button-add-promotion">
          Add Promotion
        </Button>
      </div>
      
      {promotions.length === 0 ? (
        <Card className="p-6 text-center">
          <Tag className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No promotions yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <Card key={promo.id} className="p-4" data-testid={`promotion-item-${promo.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{promo.name}</h4>
                  <p className="text-sm text-muted-foreground">{promo.description}</p>
                  <p className="text-sm font-medium text-primary">
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountValue}% off` 
                      : `LSL ${promo.discountValue} off`}
                  </p>
                </div>
                <Badge variant={promo.isActive ? "default" : "secondary"}>
                  {promo.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/super-admin/analytics'],
  });

  const { data: applications = [] } = useQuery<VendorApplication[]>({
    queryKey: ['/api/super-admin/applications'],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['/api/super-admin/vendors'],
  });

  const { data: promotions = [] } = useQuery<Promotion[]>({
    queryKey: ['/api/super-admin/promotions'],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('PATCH', `/api/super-admin/applications/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/analytics'] });
      toast({ title: "Application approved" });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest('PATCH', `/api/super-admin/applications/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/applications'] });
      toast({ title: "Application rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject", variant: "destructive" });
    }
  });

  const featureMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      return await apiRequest('PATCH', `/api/super-admin/vendors/${id}/feature`, { isFeatured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/vendors'] });
      toast({ title: "Vendor updated" });
    },
  });

  if (analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="text-xl font-bold font-display">Super Admin</h1>
            <p className="text-sm text-muted-foreground">A1 Services Control Panel</p>
          </div>
        </div>
      </header>

      <main className="px-5 py-4">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              <LayoutDashboard className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="vendors" data-testid="tab-vendors">
              <Store className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="promotions" data-testid="tab-promotions">
              <Tag className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab 
              applications={applications}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
            />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorsTab 
              vendors={vendors}
              onToggleFeatured={(id, featured) => featureMutation.mutate({ id, isFeatured: featured })}
            />
          </TabsContent>

          <TabsContent value="promotions">
            <PromotionsTab promotions={promotions} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
