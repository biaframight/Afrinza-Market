import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ShieldCheck, Crown } from "lucide-react";
import { StarRating } from "./star-rating";
import type { Product } from "@/lib/supabase-db";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/products/${product.id}`} className="block h-full outline-none">
        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 group border-transparent hover:border-primary/20 bg-white">
          <div className="relative aspect-square overflow-hidden bg-white">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            
            {product.isSponsored && (
              <Badge className="absolute top-3 left-3 bg-secondary text-secondary-foreground hover:bg-secondary font-medium">
                Sponsored
              </Badge>
            )}

            <div className="absolute bottom-3 left-3 flex gap-2">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground shadow-sm flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-primary" />
                {product.location}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 mt-1">
              <StarRating rating={product.rating} className="gap-0.5" starClassName="w-3.5 h-3.5" />
              <span className="text-xs text-muted-foreground ml-1">({product.reviewCount})</span>
            </div>

            <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/50">
              <div className="font-bold text-lg text-primary">
                RM {parseFloat(String(product.price)).toFixed(2)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {product.isPremiumSeller && <Crown className="w-3.5 h-3.5 text-secondary" />}
                <span className="truncate max-w-[100px]">{product.sellerName}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
