import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { ProfileModeProvider } from "@/contexts/ProfileModeContext";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import VendorDetails from "@/pages/VendorDetails";
import Orders from "@/pages/Orders";
import Shops from "@/pages/Shops";
import Rewards from "@/pages/Rewards";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import Addresses from "@/pages/Addresses";
import VendorDashboard from "@/pages/VendorDashboard";
import VendorAdmin from "@/pages/VendorAdmin";
import BecomeVendor from "@/pages/BecomeVendor";
import SuperAdmin from "@/pages/SuperAdmin";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/api/login" component={() => null} /> {/* Handled by backend */}
      <Route path="/api/logout" component={() => null} /> {/* Handled by backend */}
      
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      
      <Route path="/vendor/:id">
        {() => <ProtectedRoute component={VendorDetails} />}
      </Route>

      <Route path="/orders">
        {() => <ProtectedRoute component={Orders} />}
      </Route>

      <Route path="/shops">
        {() => <ProtectedRoute component={Shops} />}
      </Route>

      <Route path="/rewards">
        {() => <ProtectedRoute component={Rewards} />}
      </Route>

      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>

      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>

      <Route path="/notifications">
        {() => <ProtectedRoute component={Notifications} />}
      </Route>

      <Route path="/addresses">
        {() => <ProtectedRoute component={Addresses} />}
      </Route>

      <Route path="/vendor-dashboard">
        {() => <ProtectedRoute component={VendorDashboard} />}
      </Route>

      <Route path="/vendor-admin">
        {() => <ProtectedRoute component={VendorAdmin} />}
      </Route>

      <Route path="/become-vendor">
        {() => <ProtectedRoute component={BecomeVendor} />}
      </Route>

      <Route path="/super-admin">
        {() => <ProtectedRoute component={SuperAdmin} />}
      </Route>

      <Route path="/login" component={Login} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileModeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ProfileModeProvider>
    </QueryClientProvider>
  );
}

export default App;
