import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateOrderRequest, type UpdateOrderStatusRequest } from "@shared/routes";

export function useMyOrders() {
  return useQuery({
    queryKey: [api.orders.listMine.path],
    queryFn: async () => {
      const res = await fetch(api.orders.listMine.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return api.orders.listMine.responses[200].parse(await res.json());
    },
  });
}

export function useVendorOrders(vendorId: number) {
  return useQuery({
    queryKey: [api.orders.listVendor.path, vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const url = buildUrl(api.orders.listVendor.path, { vendorId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendor orders");
      return api.orders.listVendor.responses[200].parse(await res.json());
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateOrderRequest, "customerId" | "totalAmount">) => {
      const res = await fetch(api.orders.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create order");
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.listMine.path] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number } & UpdateOrderStatusRequest) => {
      const url = buildUrl(api.orders.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.orders.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate both user and vendor order lists to be safe
      queryClient.invalidateQueries({ queryKey: [api.orders.listMine.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.listVendor.path] });
    },
  });
}
