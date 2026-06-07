import { useParams } from "wouter";
import { useGetSeller, useGetProducts } from "@/hooks/use-marketplace";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { MapPin, MessageCircle, Crown, Store, Calendar, Package, BadgeCheck } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function SellerDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: seller, isLoading: isSellerLoading } = useGetSeller(id);
  const { data: productsData, isLoading: isProductsLoading } = useGetProducts({ sellerId: id });

  const handleWhatsApp = () => {
    if (!seller) return;
    const text = encodeURIComponent(
      `Hi ${seller.ownerName}, I'm interested in products from your store ${seller.storeName} on Afrinza.`
    );
    window.open(`https://wa.me/${seller.whatsapp.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  if (isSellerLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="w-full h-48 md:h-64 rounded-3xl mb-8" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <Skeleton className="h-64 rounded-3xl" />
          </div>
          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Store className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Store not found</h2>
        <p className="text-muted-foreground">This seller might have been removed or doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <div className="w-full h-48 md:h-72 bg-gradient-to-r from-primary to-secondary relative">
        {seller.bannerUrl && (
          <img
            src={seller.bannerUrl}
            alt={seller.storeName}
            className="w-full h-full object-cover opacity-80 mix-blend-overlay"
          />
        )}
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border -mt-20 md:-mt-24 relative z-10 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-md bg-white -mt-16 md:-mt-20 shrink-0">
              <AvatarImage src={seller.avatarUrl ?? undefined} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-muted text-primary">
                {seller.storeName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
                      {seller.storeName}
                    </h1>
                    {seller.isPremium && (
                      <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/30 border-transparent gap-1 font-semibold">
                        <Crown className="w-3.5 h-3.5 fill-current" /> Premium
                      </Badge>
                    )}
                    {seller.isVerified && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent gap-1 font-semibold">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                      </Badge>
                    )}
                  </div>

                  <p className="text-lg text-muted-foreground mb-4">By {seller.ownerName}</p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-foreground">
                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{seller.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                      <StarRating rating={seller.rating} className="gap-0.5" starClassName="w-4 h-4" />
                      <span className="font-bold">{parseFloat(String(seller.rating)).toFixed(1)}</span>
                      <span className="text-muted-foreground">({seller.reviewCount})</span>
                    </div>

                    {seller.joinedAt && (
                      <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {format(new Date(seller.joinedAt), "MMM yyyy")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                  <Button
                    size="lg"
                    className="w-full md:w-auto h-14 rounded-full border-2 bg-[#25D366] text-white hover:bg-[#20b858] font-bold shadow-md shadow-[#25D366]/20"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5 mr-2 fill-current" />
                    Contact Seller
                  </Button>
                </div>
              </div>

              {seller.description && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-muted-foreground leading-relaxed max-w-4xl">
                    {seller.description}
                  </p>
                </div>
              )}

              {seller.categories && seller.categories.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {seller.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="bg-white px-4 py-1.5 border-border text-sm">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Store Products
          </h2>
          <span className="text-muted-foreground font-medium">
            {productsData?.total || seller.productCount} items
          </span>
        </div>

        {isProductsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : productsData?.products && productsData.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {productsData.products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-sm">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">No products yet</h3>
            <p className="text-muted-foreground">This seller hasn't listed any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
