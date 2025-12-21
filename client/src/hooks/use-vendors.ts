import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateVendorRequest } from "@shared/routes";

export function useVendors() {
  return useQuery({
    queryKey: [api.vendors.list.path],
    queryFn: async () => {
      const res = await fetch(api.vendors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return api.vendors.list.responses[200].parse(await res.json());
    },
  });
}

export function useVendor(id: number) {
  return useQuery({
    queryKey: [api.vendors.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.vendors.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendor");
      return api.vendors.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CreateVendorRequest, "ownerId">) => {
      const res = await fetch(api.vendors.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create vendor");
      return api.vendors.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.vendors.list.path] }),
  });
}

export function useVendorProducts(vendorId: number) {
  return useQuery({
    queryKey: [api.products.listByVendor.path, vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const url = buildUrl(api.products.listByVendor.path, { vendorId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.listByVendor.responses[200].parse(await res.json());
    },
  });
}
