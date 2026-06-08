import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as db from "@/lib/supabase-db";

// ─── Query Keys ───────────────────────────────────────────────────

export const keys = {
  featuredProducts: () => ["products", "featured"] as const,
  products: (filters: Record<string, unknown>) => ["products", "list", filters] as const,
  product: (id: number) => ["products", id] as const,
  featuredSellers: () => ["sellers", "featured"] as const,
  sellers: (filters: Record<string, unknown>) => ["sellers", "list", filters] as const,
  seller: (id: number) => ["sellers", id] as const,
  cart: (sessionId: string) => ["cart", sessionId] as const,
  reviews: (productId: number) => ["reviews", productId] as const,
  marketplaceStats: () => ["marketplace", "stats"] as const,
};

// ─── Products ─────────────────────────────────────────────────────

export function useGetFeaturedProducts() {
  return useQuery({
    queryKey: keys.featuredProducts(),
    queryFn: db.getFeaturedProducts,
  });
}

export function useGetProducts(filters: {
  search?: string;
  category?: string;
  location?: string;
  sellerId?: number;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: keys.products(filters as Record<string, unknown>),
    queryFn: () => db.getProducts(filters),
  });
}

export function useGetProduct(id: number) {
  return useQuery({
    queryKey: keys.product(id),
    queryFn: () => db.getProductById(id),
    enabled: !!id,
  });
}

// ─── Sellers ──────────────────────────────────────────────────────

export function useGetFeaturedSellers() {
  return useQuery({
    queryKey: keys.featuredSellers(),
    queryFn: db.getFeaturedSellers,
  });
}

export function useGetSellers(filters: { location?: string; category?: string }) {
  return useQuery({
    queryKey: keys.sellers(filters as Record<string, unknown>),
    queryFn: () => db.getSellers(filters),
  });
}

export function useGetSeller(id: number) {
  return useQuery({
    queryKey: keys.seller(id),
    queryFn: () => db.getSellerById(id),
    enabled: !!id,
  });
}

export function useCreateSeller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { data: Parameters<typeof db.createSeller>[0] }) =>
      db.createSeller(input.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { data: Parameters<typeof db.createProduct>[0] }) =>
      db.createProduct(input.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateSeller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; updates: Parameters<typeof db.updateSeller>[1] }) =>
      db.updateSeller(input.id, input.updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      queryClient.invalidateQueries({ queryKey: keys.seller(id) });
    },
  });
}

export function useGetProductsBySeller(sellerId: number | null | undefined) {
  return useQuery({
    queryKey: ["products", "by-seller", sellerId],
    queryFn: () => db.getProductsBySellerId(sellerId!),
    enabled: !!sellerId,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; updates: Parameters<typeof db.updateProduct>[1] }) =>
      db.updateProduct(input.id, input.updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: keys.product(id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number }) => db.deleteProduct(input.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Cart ─────────────────────────────────────────────────────────

export function useGetCart(params: { sessionId: string }) {
  return useQuery({
    queryKey: keys.cart(params.sessionId),
    queryFn: () => db.getCart(params.sessionId),
    enabled: !!params.sessionId,
  });
}

export function useAddToCart() {
  return useMutation({
    mutationFn: (input: {
      data: { sessionId: string; productId: number; quantity: number };
    }) => db.addToCart(input.data),
  });
}

export function useRemoveFromCart() {
  return useMutation({
    mutationFn: (input: { id: number }) => db.removeFromCart(input.id),
  });
}

// ─── Orders ───────────────────────────────────────────────────────

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: {
      data: {
        sessionId: string;
        buyerName: string;
        buyerPhone: string;
        buyerAddress?: string;
        paymentMethod: string;
        deliveryMethod: string;
      };
    }) => db.createOrder(input.data),
  });
}

// ─── Reviews ──────────────────────────────────────────────────────

export function useGetReviews(params: { productId: number }) {
  return useQuery({
    queryKey: keys.reviews(params.productId),
    queryFn: () => db.getReviews(params.productId),
    enabled: !!params.productId,
  });
}

// ─── Admin ────────────────────────────────────────────────────────

export function useAdminGetAllSellers() {
  return useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: db.adminGetAllSellers,
  });
}

export function useAdminGetAllProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: db.adminGetAllProducts,
  });
}

export function useAdminToggleSellerPremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPremium }: { id: number; isPremium: boolean }) =>
      db.adminToggleSellerPremium(id, isPremium),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      qc.invalidateQueries({ queryKey: ["sellers"] });
    },
  });
}

export function useAdminToggleProductSponsored() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isSponsored }: { id: number; isSponsored: boolean }) =>
      db.adminToggleProductSponsored(id, isSponsored),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAdminDeleteSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => db.adminDeleteSeller(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["sellers"] });
    },
  });
}

export function useAdminDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => db.adminDeleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Admin Orders ─────────────────────────────────────────────────

export function useAdminGetAllOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: db.adminGetAllOrders,
  });
}

export function useAdminUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      db.adminUpdateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }),
  });
}

// ─── Marketplace Stats ────────────────────────────────────────────

export function useGetMarketplaceStats() {
  return useQuery({
    queryKey: keys.marketplaceStats(),
    queryFn: db.getMarketplaceStats,
  });
}

// ─── Visitor Tracking ─────────────────────────────────────────────

export function useAdminGetVisitorStats() {
  return useQuery({
    queryKey: ["admin", "visitor-stats"],
    queryFn: db.getVisitorStats,
    refetchInterval: 60_000,
  });
}

// ─── KYC ──────────────────────────────────────────────────────────

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sellerId, whatsapp }: { sellerId: number; whatsapp: string }) =>
      db.submitKycRequest(sellerId, whatsapp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sellers"] });
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
    },
  });
}

export function useAdminVerifySeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => db.adminVerifySeller(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      qc.invalidateQueries({ queryKey: ["sellers"] });
    },
  });
}

export function useAdminRejectKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => db.adminRejectKyc(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      qc.invalidateQueries({ queryKey: ["sellers"] });
    },
  });
}

export function useAdminRevokeVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => db.adminRevokeVerification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      qc.invalidateQueries({ queryKey: ["sellers"] });
    },
  });
}

// ─── Room Listings ─────────────────────────────────────────────────

export function useGetRoomListings(location?: string) {
  return useQuery({
    queryKey: ["rooms", location ?? "all"],
    queryFn: () => db.getRoomListings(location),
  });
}

export function useCreateRoomListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: db.createRoomListing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}
