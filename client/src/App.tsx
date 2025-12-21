import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import VendorDetails from "@/pages/VendorDetails";
import Orders from "@/pages/Orders";
import Explore from "@/pages/Explore";
import Rewards from "@/pages/Rewards";
import Profile from "@/pages/Profile";
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

      <Route path="/explore">
        {() => <ProtectedRoute component={Explore} />}
      </Route>

      <Route path="/rewards">
        {() => <ProtectedRoute component={Rewards} />}
      </Route>

      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>

      <Route path="/login" component={Login} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
