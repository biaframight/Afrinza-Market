import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Crown, Package, BadgeCheck } from "lucide-react";
import { StarRating } from "./star-rating";
import type { Seller } from "@/lib/supabase-db";
import { motion } from "framer-motion";

interface SellerCardProps {
  seller: Seller;
  index?: number;
}

export function SellerCard({ seller, index = 0 }: SellerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/sellers/${seller.id}`} className="block h-full outline-none">
        <Card className="h-full overflow-hidden hover:shadow-md transition-all duration-300 group bg-white hover:border-primary/30">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-secondary/80 relative">
            {seller.bannerUrl && (
              <img 
                src={seller.bannerUrl} 
                alt={`${seller.storeName} banner`}
                className="w-full h-full object-cover opacity-80 mix-blend-overlay"
              />
            )}
            <div className="absolute -bottom-10 left-4">
              <Avatar className="w-20 h-20 border-4 border-white shadow-sm bg-white">
                <AvatarImage src={seller.avatarUrl ?? undefined} alt={seller.storeName} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-muted text-primary">
                  {seller.storeName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {seller.isPremium && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-secondary rounded-full p-1.5 shadow-sm">
                <Crown className="w-4 h-4 fill-secondary" />
              </div>
            )}
          </div>
          
          <CardContent className="pt-12 pb-5 px-5">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              {seller.storeName}
              {seller.isVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
              )}
            </h3>
            
            <div className="flex items-center gap-1 mt-1.5 mb-3 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{seller.location}</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <StarRating rating={seller.rating} starClassName="w-3.5 h-3.5" />
                <span className="text-xs text-muted-foreground">({seller.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-accent">
                <Package className="w-3.5 h-3.5" />
                <span>{seller.productCount} items</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {seller.categories?.slice(0, 3).map((cat) => (
                <Badge key={cat} variant="outline" className="bg-muted/50 text-xs font-normal border-transparent">
                  {cat}
                </Badge>
              ))}
              {(seller.categories?.length || 0) > 3 && (
                <Badge variant="outline" className="bg-muted/50 text-xs font-normal border-transparent">
                  +{(seller.categories?.length || 0) - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
