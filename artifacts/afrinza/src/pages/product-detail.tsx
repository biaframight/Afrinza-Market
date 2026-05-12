import { useParams } from "wouter";
import { useGetProduct, useGetReviews, useAddToCart, keys } from "@/hooks/use-marketplace";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, MessageCircle, ShoppingCart, Truck, CreditCard, ShieldCheck, User } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { useState } from "react";
import { getSessionId } from "@/lib/session";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [quantity, setQuantity] = useState(1);
  const sessionId = getSessionId();
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useGetProduct(id);
  const { data: reviewsData } = useGetReviews({ productId: id });
  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    if (!product) return;

    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.cart(sessionId) });
          toast.success("Added to cart", {
            description: `${quantity}x ${product.title} added to your cart.`,
          });
        },
        onError: () => {
          toast.error("Failed to add to cart");
        },
      }
    );
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const text = encodeURIComponent(`Hi, I'm interested in "${product.title}" listed on Afrinza.`);
    window.open(`https://wa.me/${product.sellerWhatsapp.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <Skeleton className="w-full aspect-square rounded-2xl" />
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <p className="text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : [product.imageUrl].filter(Boolean) as string[];
  const mainImage = allImages[0] || "";

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="flex flex-col lg:flex-row">

            <div className="w-full lg:w-1/2 p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square rounded-2xl overflow-hidden bg-white border border-border/40 relative"
              >
                {mainImage ? (
                  <img src={mainImage} alt={product.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
                {product.isSponsored && (
                  <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground text-sm py-1 px-3">
                    Sponsored
                  </Badge>
                )}
              </motion.div>

              {allImages.length > 1 && (
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button key={idx} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary shrink-0 transition-all">
                      <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full lg:w-1/2 p-6 md:p-8 lg:border-l border-border/50 flex flex-col">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="bg-muted text-foreground border-transparent">
                  {product.category}
                </Badge>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {product.location}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-3 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} />
                  <span className="font-medium text-sm ml-1">{parseFloat(String(product.rating)).toFixed(1)}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border"></div>
                <a href="#reviews" className="text-sm text-primary hover:underline">
                  {product.reviewCount} reviews
                </a>
                <div className="w-1 h-1 rounded-full bg-border"></div>
                <span className="text-sm text-muted-foreground">
                  {product.stock ? `${product.stock} in stock` : "In stock"}
                </span>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-primary tracking-tight">RM {parseFloat(String(product.price)).toFixed(2)}</span>
              </div>

              <div className="prose prose-sm text-muted-foreground mb-8 max-w-none">
                <p>{product.description || "No description provided for this product."}</p>
              </div>

              <div className="mt-auto space-y-6">
                <Separator />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Delivery:</span>
                    <span className="text-muted-foreground">
                      {product.deliveryOptions?.join(", ") || "Contact seller"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">Payment:</span>
                    <span className="text-muted-foreground">
                      {product.paymentMethods?.join(", ") || "Cash on delivery, Transfer"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="flex items-center border border-border rounded-full h-14 bg-white w-full sm:w-32">
                    <button
                      className="w-10 flex items-center justify-center text-xl text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >-</button>
                    <div className="flex-1 text-center font-semibold">{quantity}</div>
                    <button
                      className="w-10 flex items-center justify-center text-xl text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setQuantity((q) => (product.stock && q >= product.stock ? q : q + 1))}
                    >+</button>
                  </div>

                  <Button
                    size="lg"
                    className="flex-1 h-14 rounded-full text-base font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={handleAddToCart}
                    disabled={addToCart.isPending}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-14 rounded-full border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5 font-bold"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-border">
              <h3 className="font-semibold text-lg mb-4">About the Seller</h3>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16 border border-border">
                  <AvatarImage src={product.sellerAvatar ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {product.sellerName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    {product.sellerName}
                    {product.isPremiumSeller && <ShieldCheck className="w-4 h-4 text-secondary" />}
                  </h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {product.location}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-full" onClick={() => window.location.href = `/sellers/${product.sellerId}`}>
                Visit Store
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2" id="reviews">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold font-serif mb-2">Customer Reviews</h3>
                  <div className="flex items-center gap-2">
                    <StarRating rating={reviewsData?.averageRating || product.rating} className="w-5 h-5" />
                    <span className="font-bold text-lg">{reviewsData?.averageRating || product.rating}</span>
                    <span className="text-muted-foreground">({reviewsData?.total || product.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviewsData.reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{review.buyerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No reviews yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to review this product!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
