import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { Vendor } from "@shared/schema";

export function useMyVendor() {
  const { user } = useAuth();
  
  const { data: vendors, isLoading, isFetching } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: !!user,
  });

  const myVendor = (vendors || []).find(v => v.ownerId === user?.id);
  
  return {
    vendor: myVendor,
    hasVendor: !!myVendor,
    isLoading: isLoading || isFetching,
  };
}
