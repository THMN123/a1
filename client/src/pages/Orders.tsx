import { useMyOrders } from "@/hooks/use-orders";
import { BottomNav } from "@/components/BottomNav";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { Loader2, Package, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Order } from "@shared/schema";

function StatusBadge({ status }: { status: Order["status"] }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accepted: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-purple-100 text-purple-700 border-purple-200",
    ready: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-gray-100 text-gray-600 border-gray-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const icons = {
    pending: Clock,
    accepted: CheckCircle2,
    preparing: Package,
    ready: CheckCircle2,
    completed: CheckCircle2,
    cancelled: XCircle,
  };

  const Icon = icons[status] || Package;

  return (
    <span className={cn(
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", 
      styles[status] || styles.pending
    )}>
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useMyOrders();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-14 pb-4 sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">My Orders</h1>
          <ProfileSwitcher />
        </div>
      </header>

      <main className="px-5 mt-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Start exploring to place your first order!</p>
          </div>
        ) : (
          orders?.map((order) => (
            <div 
              key={order.id} 
              className="bg-card p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Order #{order.id}</h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(order.createdAt), "PPP 'at' p")}
                  </p>
                </div>
                <StatusBadge status={order.status as any} />
              </div>

              <div className="border-t border-dashed border-border my-4" />

              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </div>
                <div className="text-xl font-bold text-primary">
                  LSL {Number(order.totalAmount).toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
