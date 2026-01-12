import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, MapPin, Home, Building, Edit, Trash2, Star, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SavedAddress } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const addressFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  address: z.string().min(1, "Address is required"),
  building: z.string().optional(),
  room: z.string().optional(),
  instructions: z.string().optional(),
});

const labelIcons: Record<string, any> = {
  "Home": Home,
  "Dorm": Building,
  "Office": Building,
};

function AddressCard({ address, onEdit, onDelete, onSetDefault }: { 
  address: SavedAddress; 
  onEdit: () => void; 
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const Icon = labelIcons[address.label] || MapPin;
  
  return (
    <div className="p-4 bg-card rounded-2xl border border-border/50 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{address.label}</span>
              {address.isDefault && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{address.address}</p>
            {address.building && <p className="text-xs text-muted-foreground">{address.building} {address.room && `- ${address.room}`}</p>}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t border-border/50">
        {!address.isDefault && (
          <Button variant="ghost" size="sm" onClick={onSetDefault} className="flex-1" data-testid={`button-default-${address.id}`}>
            <Star className="w-4 h-4 mr-1" /> Set Default
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit} data-testid={`button-edit-${address.id}`}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive" data-testid={`button-delete-${address.id}`}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Addresses() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const form = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: "",
      address: "",
      building: "",
      room: "",
      instructions: "",
    },
  });

  const { data: addresses = [], isLoading } = useQuery<SavedAddress[]>({
    queryKey: ["/api/addresses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/addresses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address added" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add address", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/addresses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address updated" });
      setIsDialogOpen(false);
      setEditingAddress(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update address", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/addresses/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete address", description: error.message, variant: "destructive" });
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/addresses/${id}/default`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Default address updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to set default", description: error.message, variant: "destructive" });
    }
  });

  const openAddDialog = () => {
    setEditingAddress(null);
    form.reset({ label: "", address: "", building: "", room: "", instructions: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: SavedAddress) => {
    setEditingAddress(address);
    form.reset({
      label: address.label,
      address: address.address,
      building: address.building || "",
      room: address.room || "",
      instructions: address.instructions || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/profile')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-display">Saved Addresses</h1>
          </div>
          <Button size="sm" onClick={openAddDialog} data-testid="button-add-address">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </header>

      <main className="px-5 py-6 space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No addresses saved</h3>
            <p className="text-muted-foreground text-sm mb-4">Add your delivery addresses for faster checkout</p>
            <Button onClick={openAddDialog} data-testid="button-add-first-address">
              <Plus className="w-4 h-4 mr-2" /> Add Address
            </Button>
          </div>
        ) : (
          addresses.map((address) => (
            <AddressCard 
              key={address.id} 
              address={address}
              onEdit={() => openEditDialog(address)}
              onDelete={() => deleteMutation.mutate(address.id)}
              onSetDefault={() => setDefaultMutation.mutate(address.id)}
            />
          ))
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Home, Dorm, Office..." data-testid="input-label" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Campus Road" data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Block A" data-testid="input-building" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="101" data-testid="input-room" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Instructions</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Call when you arrive..." className="resize-none" data-testid="input-instructions" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-address">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingAddress ? "Save Changes" : "Add Address"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
