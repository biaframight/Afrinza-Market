import { Link, useLocation } from "wouter";
import {
  useGetCart,
  useAddToCart,
  useRemoveFromCart,
  keys,
} from "@/hooks/use-marketplace";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Cart() {
  const [, setLocation] = useLocation();
  const sessionId = getSessionId();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({ sessionId });
  const updateCartMutation = useAddToCart();
  const removeMutation = useRemoveFromCart();

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;

    updateCartMutation.mutate(
      { data: { sessionId, productId, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.cart(sessionId) });
        },
      }
    );
  };

  const removeItem = (cartItemId: number) => {
    removeMutation.mutate(
      { id: cartItemId },
      {
        onSuccess: () => {
          toast.success("Item removed from cart");
          queryClient.invalidateQueries({ queryKey: keys.cart(sessionId) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold font-serif mb-8">Your Cart</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="w-full h-32 rounded-2xl" />
            ))}
          </div>
          <div className="w-full md:w-80">
            <Skeleton className="w-full h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasItems = cart?.items && cart.items.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-8">Your Cart</h1>

      {!hasItems ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-sm">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Your cart is empty</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Looks like you haven't added anything to your cart yet. Discover amazing products from our sellers.
          </p>
          <Button asChild size="lg" className="rounded-full font-bold px-8">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-6 border-b border-border text-sm font-medium text-muted-foreground bg-muted/20">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-border">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center">
                    <div className="col-span-6 flex gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-border/50 shrink-0">
                        {item.product?.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <Link href={`/products/${item.productId}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                          {item.product?.title || "Product Unavailable"}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">RM {parseFloat(String(item.product?.price || 0)).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-2 truncate">Seller: {item.product?.sellerName}</p>
                      </div>
                    </div>

                    <div className="col-span-3 flex justify-between md:justify-center items-center mt-4 md:mt-0">
                      <span className="md:hidden text-sm font-medium text-muted-foreground">Quantity:</span>
                      <div className="flex items-center border border-border rounded-full bg-muted/10 h-10 w-28">
                        <button
                          className="w-8 flex justify-center items-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={updateCartMutation.isPending || item.quantity <= 1}
                        >-</button>
                        <span className="flex-1 text-center font-medium text-sm">{item.quantity}</span>
                        <button
                          className="w-8 flex justify-center items-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={updateCartMutation.isPending}
                        >+</button>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-between md:justify-end items-center mt-2 md:mt-0">
                      <span className="md:hidden text-sm font-medium text-muted-foreground">Total:</span>
                      <span className="font-bold text-primary">
                        RM {(parseFloat(String(item.product?.price || 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-end md:justify-center mt-2 md:mt-0 border-t border-border pt-4 md:pt-0 md:border-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[340px] shrink-0">
            <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-6 font-serif">Order Summary</h3>

              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
                  <span className="font-medium">RM {parseFloat(String(cart.total)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-muted-foreground italic">Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
                  <span className="font-bold text-base">Total</span>
                  <span className="font-bold text-2xl text-primary">RM {parseFloat(String(cart.total)).toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all mb-4"
                onClick={() => setLocation("/checkout")}
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You won't be charged yet. Payment is handled directly with sellers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
