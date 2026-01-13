import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Store, CheckCircle, Clock, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { VendorApplication } from "@shared/schema";

const applicationSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  customBusinessType: z.string().optional(),
  vendorType: z.enum(["product", "service"]).default("product"),
  tags: z.string().optional(),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
});

export default function BecomeVendor() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      businessName: "",
      businessType: "",
      customBusinessType: "",
      vendorType: "product" as const,
      tags: "",
      description: "",
      location: "",
      phone: "",
      email: "",
    },
  });

  const selectedBusinessType = form.watch("businessType");
  const selectedVendorType = form.watch("vendorType");

  const { data: application, isLoading } = useQuery<VendorApplication | null>({
    queryKey: ['/api/vendor-admin/application'],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/vendor-admin/application', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-admin/application'] });
      toast({ title: "Application submitted!", description: "We'll review your application and get back to you soon." });
    },
    onError: () => {
      toast({ title: "Failed to submit", variant: "destructive" });
    }
  });

  const handleSubmit = (data: any) => {
    submitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (application) {
    return (
      <div className="min-h-screen bg-background">
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
            <h1 className="text-xl font-bold font-display">Application Status</h1>
          </div>
        </header>

        <main className="px-5 py-8">
          <Card className="p-6 text-center">
            {application.status === 'pending' && (
              <>
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Application Under Review</h2>
                <p className="text-muted-foreground mb-4">
                  Your application for "{application.businessName}" is being reviewed. 
                  We'll notify you once a decision is made.
                </p>
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                </p>
              </>
            )}

            {application.status === 'approved' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Application Approved!</h2>
                <p className="text-muted-foreground mb-6">
                  Congratulations! Your vendor application has been approved.
                  You can now access your vendor dashboard.
                </p>
                <Button onClick={() => navigate('/vendor-admin')} data-testid="button-go-to-dashboard">
                  Go to Vendor Dashboard
                </Button>
              </>
            )}

            {application.status === 'rejected' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Application Not Approved</h2>
                <p className="text-muted-foreground mb-4">
                  Unfortunately, your application was not approved at this time.
                </p>
                {application.rejectionReason && (
                  <Card className="p-4 bg-muted/50 text-left mb-4">
                    <p className="text-sm font-medium">Reason:</p>
                    <p className="text-sm text-muted-foreground">{application.rejectionReason}</p>
                  </Card>
                )}
                <p className="text-sm text-muted-foreground">
                  You can contact support if you have questions.
                </p>
              </>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
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
          <h1 className="text-xl font-bold font-display">Become a Vendor</h1>
        </div>
      </header>

      <main className="px-5 py-6">
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Join A1 Services</h2>
              <p className="text-sm text-muted-foreground">Start selling to campus customers</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">5%</p>
              <p className="text-xs text-muted-foreground">Commission</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Setup Fee</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">24h</p>
              <p className="text-xs text-muted-foreground">Approval</p>
            </div>
          </div>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your shop name" {...field} data-testid="input-business-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you offer?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-vendor-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="product">Products (Food, Items, Goods)</SelectItem>
                      <SelectItem value="service">Services (Print, Repair, Custom Work)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-business-type">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="food">Food & Beverages</SelectItem>
                      <SelectItem value="grocery">Groceries</SelectItem>
                      <SelectItem value="services">General Services</SelectItem>
                      <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                      <SelectItem value="print">Print & Stationery</SelectItem>
                      <SelectItem value="tech">Tech & Repairs</SelectItem>
                      <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                      <SelectItem value="custom">Custom / Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedBusinessType === "custom" && (
              <FormField
                control={form.control}
                name="customBusinessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Business Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Artisanal Mechanic, Custom Tailor..." 
                        {...field} 
                        data-testid="input-custom-business-type" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Searchable Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., plumber, electrician, fast delivery (comma separated)" 
                      {...field} 
                      data-testid="input-tags" 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Help customers find you with relevant keywords
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your business..."
                      {...field} 
                      data-testid="input-business-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Building or area on campus" {...field} data-testid="input-business-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 8900" {...field} data-testid="input-business-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="business@email.com" {...field} data-testid="input-business-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitMutation.isPending}
              data-testid="button-submit-application"
            >
              {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
