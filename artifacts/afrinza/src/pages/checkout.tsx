import { useState } from "react";
import { useLocation } from "wouter";
import { 
  useGetCart, 
  getGetCartQueryKey,
  useCreateOrder
} from "@workspace/api-client-react";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronLeft, MapPin, Truck, MessageCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const DEFAULT_WHATSAPP = "60173346205";

const checkoutSchema = z.object({
  buyerName: z.string().min(2, "Name must be at least 2 characters"),
  buyerPhone: z.string().min(8, "Valid phone number required"),
  buyerAddress: z.string().min(10, "Please provide full delivery address"),
  paymentMethod: z.string(),
  deliveryMethod: z.string(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function buildWhatsAppMessage(data: CheckoutFormValues, items: { title: string; qty: number; price: string }[], total: string) {
  const lines = [
    `*New Order from Afrinza Marketplace*`,
    ``,
    `*Buyer:* ${data.buyerName}`,
    `*Phone:* ${data.buyerPhone}`,
    `*Address:* ${data.buyerAddress}`,
    `*Delivery:* ${data.deliveryMethod}`,
    `*Payment:* WhatsApp Order`,
    ``,
    `*Items Ordered:*`,
    ...items.map((it) => `• ${it.title} x${it.qty} — RM ${it.price}`),
    ``,
    `*Total: RM ${total}*`,
    ``,
    `Please confirm my order. Thank you!`,
  ];
  return encodeURIComponent(lines.join("\n"));
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [sellerWhatsApp, setSellerWhatsApp] = useState<string>(DEFAULT_WHATSAPP);

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const createOrder = useCreateOrder();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      buyerName: "",
      buyerPhone: "",
      buyerAddress: "",
      paymentMethod: "WhatsApp Order",
      deliveryMethod: "Grab Delivery",
    },
  });

  const onSubmit = (data: CheckoutFormValues) => {
    createOrder.mutate({
      data: { sessionId, ...data }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });

        // Build WhatsApp redirect
        const items = (cart?.items || []).map((it) => ({
          title: it.product?.title || "Item",
          qty: it.quantity,
          price: (parseFloat(String(it.product?.price || 0)) * it.quantity).toFixed(2),
        }));
        const total = parseFloat(String(cart?.total || 0)).toFixed(2);
        const message = buildWhatsAppMessage(data, items, total);

        // Use seller WhatsApp if available in first item, else default
        const phone = sellerWhatsApp.replace(/\D/g, "");
        const waUrl = `https://wa.me/${phone}?text=${message}`;

        setIsSuccess(true);
        window.scrollTo(0, 0);

        // Open WhatsApp after short delay
        setTimeout(() => {
          window.open(waUrl, "_blank");
        }, 800);
      },
      onError: () => {
        toast.error("Failed to place order. Please try again.");
      }
    });
  };

  if (isSuccess) {
    const items = (cart?.items || []).map((it) => ({
      title: it.product?.title || "Item",
      qty: it.quantity,
      price: (parseFloat(String(it.product?.price || 0)) * it.quantity).toFixed(2),
    }));
    const total = "0.00";
    const formData = form.getValues();
    const message = buildWhatsAppMessage(formData, items, total);
    const phone = sellerWhatsApp.replace(/\D/g, "");
    const waUrl = `https://wa.me/${phone}?text=${message}`;

    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-serif mb-4">Order Placed!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your order has been recorded. A WhatsApp chat with the seller is opening so you can confirm details and arrange payment.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe59] text-white font-bold px-8 py-4 rounded-full text-base shadow-lg mb-6 transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          Open WhatsApp Chat with Seller
        </a>
        <br />
        <Button variant="ghost" onClick={() => setLocation("/")} className="rounded-full mt-2">
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (isLoading || (!cart?.items.length && !createOrder.isPending)) {
    if (!isLoading && !cart?.items.length) setLocation("/cart");
    return <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/cart")} className="rounded-full bg-white shadow-sm border border-border">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold font-serif">Checkout</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8">

            <div className="flex-1 space-y-8">
              {/* Delivery Info */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Delivery Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="buyerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" className="h-12 bg-muted/30" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="buyerPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your WhatsApp Number</FormLabel>
                      <FormControl><Input placeholder="+60 12-345 6789" className="h-12 bg-muted/30" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="buyerAddress" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Full Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Unit number, Building name, Street, Postcode, City, State" className="min-h-[100px] resize-none bg-muted/30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Delivery Method */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                  <div className="bg-accent/10 p-2 rounded-full text-accent">
                    <Truck className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Delivery Method</h2>
                </div>
                <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-3">
                        {[
                          { value: "Grab Delivery", label: "Grab / Lalamove", desc: "Same day delivery (Buyer pays rider)" },
                          { value: "Afrinza Rider", label: "Afrinza Rider", desc: "African rider network — reliable & fast" },
                          { value: "Self Pickup", label: "Self Pickup", desc: "Collect from seller location" },
                        ].map((opt) => (
                          <FormItem key={opt.value} className="flex items-center space-x-3 space-y-0 rounded-xl border border-border p-4 bg-white hover:bg-muted/30 cursor-pointer transition-colors [&:has([data-state=checked])]:border-accent [&:has([data-state=checked])]:bg-accent/5">
                            <FormControl><RadioGroupItem value={opt.value} /></FormControl>
                            <div className="flex-1">
                              <FormLabel className="font-semibold cursor-pointer">{opt.label}</FormLabel>
                              <p className="text-sm text-muted-foreground mt-0.5">{opt.desc}</p>
                            </div>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
                  <div className="bg-[#25D366]/20 p-2 rounded-full">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <h2 className="text-xl font-bold">Payment Method</h2>
                </div>

                {/* WhatsApp — Primary (active) */}
                <div className="rounded-xl border-2 border-[#25D366] bg-[#25D366]/5 p-4 mb-4 flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full border-2 border-[#25D366] bg-[#25D366] flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm flex items-center gap-2">
                      WhatsApp Order
                      <Badge className="bg-[#25D366] text-white text-[10px] px-2">Active</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Order sent to seller via WhatsApp. Agree on payment directly.</p>
                  </div>
                  <MessageCircle className="w-6 h-6 text-[#25D366]" />
                </div>

                {/* Other methods — Coming Soon */}
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3 ml-1">More payment options (coming soon)</p>
                <div className="space-y-3 opacity-60 pointer-events-none select-none">
                  {[
                    { label: "Touch 'n Go eWallet", desc: "TNG eWallet / DuitNow QR" },
                    { label: "Bank Transfer / DuitNow", desc: "Online banking transfer" },
                    { label: "Cash on Delivery", desc: "Pay on receipt" },
                    { label: "Stripe / Card", desc: "Visa, Mastercard & more" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-border p-4 flex items-center gap-4 bg-muted/20">
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          {m.label}
                          <Badge variant="outline" className="text-[10px] px-2 border-muted-foreground/30 text-muted-foreground">
                            <Lock className="w-2.5 h-2.5 mr-1" />Coming Soon
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[380px] shrink-0">
              <div className="bg-white rounded-3xl border border-border shadow-sm p-6 md:p-8 sticky top-24">
                <h3 className="text-xl font-bold mb-6 font-serif border-b border-border/50 pb-4">Order Summary</h3>
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                        {item.product?.imageUrl && (
                          <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="font-medium text-sm line-clamp-2 leading-tight">{item.product?.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-semibold text-sm">
                        RM {(parseFloat(String(item.product?.price || 0)) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6 text-sm border-t border-border/50 pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cart?.itemCount} items)</span>
                    <span className="font-medium">RM {parseFloat(String(cart?.total || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t border-border pt-4 mt-2 flex justify-between items-center">
                    <span className="font-bold text-base">Total</span>
                    <span className="font-bold text-3xl text-primary">RM {parseFloat(String(cart?.total || 0)).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all mb-3 bg-[#25D366] hover:bg-[#1ebe59] text-white flex items-center gap-2"
                  disabled={createOrder.isPending}
                >
                  <MessageCircle className="w-5 h-5" />
                  {createOrder.isPending ? "Processing..." : "Place Order via WhatsApp"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your order details will be sent to the seller on WhatsApp to confirm payment & delivery.
                </p>
              </div>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}
