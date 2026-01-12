import { Bell, ShoppingBag, Gift, Megaphone, Info, Check } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: "order" | "promo" | "reward" | "system";
  data: any;
  isRead: boolean;
  createdAt: string;
}

const typeIcons = {
  order: ShoppingBag,
  promo: Megaphone,
  reward: Gift,
  system: Info,
};

const typeColors = {
  order: "text-primary bg-primary/10",
  promo: "text-purple-500 bg-purple-500/10",
  reward: "text-amber-500 bg-amber-500/10",
  system: "text-blue-500 bg-blue-500/10",
};

function NotificationItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: (id: number) => void }) {
  const Icon = typeIcons[notification.type] || Info;
  const colorClass = typeColors[notification.type] || typeColors.system;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer ${
        !notification.isRead ? "bg-primary/5" : ""
      }`}
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium truncate ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>
    </motion.div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = unreadCountData?.count || 0;
  const recentNotifications = notifications?.slice(0, 10) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="p-2.5 rounded-full bg-muted hover:bg-accent text-foreground transition-colors relative" 
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-background"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 shadow-xl" 
        align="end" 
        sideOffset={8}
        data-testid="notification-dropdown"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-primary hover:text-primary"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4].map((i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">We'll notify you about orders and updates</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            <Button 
              variant="ghost" 
              className="w-full text-sm text-primary hover:text-primary"
              data-testid="link-see-all-notifications"
            >
              See all notifications
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
