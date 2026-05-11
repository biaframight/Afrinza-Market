import { supabase } from "./supabase";

// ─── App-level types (camelCase) ─────────────────────────────────

export interface Seller {
  id: number;
  storeName: string;
  ownerName: string;
  description: string | null;
  location: string;
  categories: string[];
  whatsapp: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isPremium: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  joinedAt: string | null;
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  price: string;
  category: string;
  location: string;
  imageUrl: string | null;
  images: string[];
  sellerId: number;
  sellerName: string;
  sellerWhatsapp: string;
  sellerAvatar: string | null;
  isSponsored: boolean;
  isPremiumSeller: boolean;
  rating: number;
  reviewCount: number;
  stock: number;
  deliveryOptions: string[];
  paymentMethods: string[];
  createdAt: string | null;
}

export interface CartItemWithProduct {
  id: number;
  sessionId: string;
  productId: number;
  quantity: number;
  createdAt: string | null;
  product: Product | null;
}

export interface CartResponse {
  items: CartItemWithProduct[];
  total: number;
  itemCount: number;
}

export interface Review {
  id: number;
  productId: number;
  buyerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  total: number;
}

// ─── Row → App type mappers ───────────────────────────────────────

function mapSeller(r: Record<string, any>): Seller {
  return {
    id: r.id,
    storeName: r.store_name,
    ownerName: r.owner_name,
    description: r.description ?? null,
    location: r.location,
    categories: r.categories ?? [],
    whatsapp: r.whatsapp,
    avatarUrl: r.avatar_url ?? null,
    bannerUrl: r.banner_url ?? null,
    isPremium: r.is_premium ?? false,
    rating: r.rating ?? 0,
    reviewCount: r.review_count ?? 0,
    productCount: r.product_count ?? 0,
    joinedAt: r.joined_at ?? null,
  };
}

function mapProduct(r: Record<string, any>): Product {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    price: String(r.price),
    category: r.category,
    location: r.location,
    imageUrl: r.image_url ?? null,
    images: r.images ?? [],
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    sellerWhatsapp: r.seller_whatsapp,
    sellerAvatar: r.seller_avatar ?? null,
    isSponsored: r.is_sponsored ?? false,
    isPremiumSeller: r.is_premium_seller ?? false,
    rating: r.rating ?? 0,
    reviewCount: r.review_count ?? 0,
    stock: r.stock ?? 1,
    deliveryOptions: r.delivery_options ?? [],
    paymentMethods: r.payment_methods ?? [],
    createdAt: r.created_at ?? null,
  };
}

function mapReview(r: Record<string, any>): Review {
  return {
    id: r.id,
    productId: r.product_id,
    buyerName: r.buyer_name,
    rating: r.rating,
    comment: r.comment ?? null,
    createdAt: r.created_at,
  };
}

function mapCartItem(r: Record<string, any>): CartItemWithProduct {
  return {
    id: r.id,
    sessionId: r.session_id,
    productId: r.product_id,
    quantity: r.quantity,
    createdAt: r.created_at ?? null,
    product: r.products ? mapProduct(r.products) : null,
  };
}

function throwIfError<T>(data: T | null, error: { message: string; code?: string } | null, context = ""): asserts data is T {
  if (error) {
    const msg = `[Supabase${context ? ` / ${context}` : ""}] ${error.message}`;
    console.error(msg, { code: error.code });
    throw new Error(msg);
  }
  if (data === null) {
    const msg = `[Supabase${context ? ` / ${context}` : ""}] No data returned`;
    console.error(msg);
    throw new Error(msg);
  }
}

// ─── Products ─────────────────────────────────────────────────────

export async function getFeaturedProducts(): Promise<{ products: Product[]; total: number }> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_sponsored", true)
    .limit(10);
  throwIfError(data, error, "getFeaturedProducts");
  const products = data.map(mapProduct);
  return { products, total: products.length };
}

export async function getProducts(filters: {
  search?: string;
  category?: string;
  location?: string;
  sellerId?: number;
  limit?: number;
  offset?: number;
}): Promise<{ products: Product[]; total: number }> {
  let query = supabase.from("products").select("*");

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.sellerId) query = query.eq("seller_id", filters.sellerId);
  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  throwIfError(data, error, "getProducts");
  const products = data.map(mapProduct);
  return { products, total: products.length };
}

export async function getProductById(id: number): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  throwIfError(data, error, "getProductById");
  return mapProduct(data);
}

// ─── Sellers ──────────────────────────────────────────────────────

export async function getFeaturedSellers(): Promise<{ sellers: Seller[]; total: number }> {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("is_premium", true)
    .limit(8);
  throwIfError(data, error, "getFeaturedSellers");
  const sellers = data.map(mapSeller);
  return { sellers, total: sellers.length };
}

export async function getSellers(filters: {
  location?: string;
  category?: string;
}): Promise<{ sellers: Seller[]; total: number }> {
  let query = supabase.from("sellers").select("*");
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);

  const { data, error } = await query;
  throwIfError(data, error, "getSellers");
  let sellers = data.map(mapSeller);
  if (filters.category) {
    sellers = sellers.filter((s) => s.categories.includes(filters.category!));
  }
  return { sellers, total: sellers.length };
}

export async function getSellerById(id: number): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", id)
    .single();
  throwIfError(data, error, "getSellerById");
  return mapSeller(data);
}

export async function createSeller(input: {
  storeName: string;
  ownerName: string;
  description: string;
  location: string;
  categories: string[];
  whatsapp: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .insert({
      store_name: input.storeName,
      owner_name: input.ownerName,
      description: input.description,
      location: input.location,
      categories: input.categories,
      whatsapp: input.whatsapp,
      avatar_url: input.avatarUrl ?? null,
      banner_url: input.bannerUrl ?? null,
    })
    .select()
    .single();
  throwIfError(data, error, "createSeller");
  return mapSeller(data);
}

// ─── Cart ─────────────────────────────────────────────────────────

export async function getCart(sessionId: string): Promise<CartResponse> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, products(*)")
    .eq("session_id", sessionId);

  if (error) { console.error("[Supabase / getCart]", error.message); throw new Error(`[Supabase] ${error.message}`); }

  const items = (data ?? []).map(mapCartItem).filter((i) => i.product !== null);
  const total = items.reduce(
    (sum, item) => sum + parseFloat(String(item.product?.price ?? 0)) * item.quantity,
    0
  );

  return { items, total, itemCount: items.length };
}

export async function addToCart(input: {
  sessionId: string;
  productId: number;
  quantity: number;
}): Promise<CartItemWithProduct> {
  const { data: existing } = await supabase
    .from("cart_items")
    .select("*")
    .eq("session_id", input.sessionId)
    .eq("product_id", input.productId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + (input.quantity ?? 1) })
      .eq("id", existing.id)
      .select("*, products(*)")
      .single();
    throwIfError(data, error);
    return mapCartItem(data);
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      session_id: input.sessionId,
      product_id: input.productId,
      quantity: input.quantity ?? 1,
    })
    .select("*, products(*)")
    .single();
  throwIfError(data, error);
  return mapCartItem(data);
}

export async function removeFromCart(id: number): Promise<void> {
  const { error } = await supabase.from("cart_items").delete().eq("id", id);
  if (error) throw new Error(`[Supabase] ${error.message}`);
}

// ─── Orders ───────────────────────────────────────────────────────

export async function createOrder(input: {
  sessionId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress?: string;
  paymentMethod: string;
  deliveryMethod: string;
}): Promise<{ id: number }> {
  const cart = await getCart(input.sessionId);
  if (cart.items.length === 0) throw new Error("Cart is empty");

  const { error: orderError } = await supabase
    .from("orders")
    .insert({
      session_id: input.sessionId,
      buyer_name: input.buyerName,
      buyer_phone: input.buyerPhone,
      buyer_address: input.buyerAddress ?? null,
      total: cart.total.toFixed(2),
      payment_method: input.paymentMethod,
      delivery_method: input.deliveryMethod,
      status: "pending",
    });

  if (orderError) {
    console.error("[Supabase / createOrder]", orderError.message);
    throw new Error(`[Supabase] ${orderError.message}`);
  }

  await supabase.from("cart_items").delete().eq("session_id", input.sessionId);

  return { id: Date.now() };
}

// ─── Reviews ──────────────────────────────────────────────────────

export async function getReviews(productId: number): Promise<ReviewsResponse> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`[Supabase] ${error.message}`);

  const reviews = (data ?? []).map(mapReview);
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return {
    reviews,
    averageRating: parseFloat(averageRating.toFixed(1)),
    total: reviews.length,
  };
}

// ─── Marketplace Stats ────────────────────────────────────────────

export async function getMarketplaceStats(): Promise<{
  totalSellers: number;
  totalProducts: number;
  totalLocations: number;
  totalCategories: number;
  featuredSellers: number;
}> {
  const [sellersRes, productsRes, featuredRes] = await Promise.all([
    supabase.from("sellers").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("sellers")
      .select("id", { count: "exact", head: true })
      .eq("is_premium", true),
  ]);

  return {
    totalSellers: sellersRes.count ?? 0,
    totalProducts: productsRes.count ?? 0,
    totalLocations: 13,
    totalCategories: 8,
    featuredSellers: featuredRes.count ?? 0,
  };
}
