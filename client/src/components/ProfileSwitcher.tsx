import { RefreshCw, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileMode } from "@/contexts/ProfileModeContext";
import { useMyVendor } from "@/hooks/use-my-vendor";

export function ProfileSwitcher() {
  const { isVendorMode, toggleMode } = useProfileMode();
  const { hasVendor, vendor } = useMyVendor();

  if (!hasVendor) return null;

  return (
    <button
      onClick={toggleMode}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        isVendorMode 
          ? "bg-primary text-white" 
          : "bg-muted text-foreground"
      )}
      data-testid="button-switch-profile"
    >
      {isVendorMode ? (
        <>
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{vendor?.name || "Vendor"}</span>
          <RefreshCw className="w-3 h-3" />
        </>
      ) : (
        <>
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Personal</span>
          <RefreshCw className="w-3 h-3" />
        </>
      )}
    </button>
  );
}
