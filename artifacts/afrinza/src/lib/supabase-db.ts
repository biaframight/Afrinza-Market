import { supabase } from "./supabase";

// ─── App-level types (camelCase) ─────────────────────────────────

export interface Seller {
  id: number;
  userId: string | null;
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
    userId: r.user_id ?? null,
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
  userId?: string | null;
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
      user_id: input.userId ?? null,
    })
    .select()
    .single();
  throwIfError(data, error, "createSeller");
  return mapSeller(data);
}

export async function getSellerByUserId(userId: string): Promise<Seller | null> {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[Supabase / getSellerByUserId]", error.message);
    return null;
  }
  return data ? mapSeller(data) : null;
}

export async function updateSeller(
  id: number,
  updates: {
    storeName?: string;
    ownerName?: string;
    description?: string;
    location?: string;
    categories?: string[];
    whatsapp?: string;
    avatarUrl?: string | null;
  }
): Promise<Seller> {
  const payload: Record<string, unknown> = {};
  if (updates.storeName !== undefined) payload.store_name = updates.storeName;
  if (updates.ownerName !== undefined) payload.owner_name = updates.ownerName;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.categories !== undefined) payload.categories = updates.categories;
  if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
  const { data, error } = await supabase
    .from("sellers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  throwIfError(data, error, "updateSeller");
  return mapSeller(data);
}

export async function getProductsBySellerId(sellerId: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  throwIfError(data, error, "getProductsBySellerId");
  return (data as Record<string, any>[]).map(mapProduct);
}

export async function updateProduct(
  id: number,
  updates: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
    stock?: number;
    imageUrl?: string | null;
    deliveryOptions?: string[];
    paymentMethods?: string[];
  }
): Promise<Product> {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.stock !== undefined) payload.stock = updates.stock;
  if (updates.imageUrl !== undefined) {
    payload.image_url = updates.imageUrl;
    if (updates.imageUrl) payload.images = [updates.imageUrl];
  }
  if (updates.deliveryOptions !== undefined) payload.delivery_options = updates.deliveryOptions;
  if (updates.paymentMethods !== undefined) payload.payment_methods = updates.paymentMethods;
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  throwIfError(data, error, "updateProduct");
  return mapProduct(data);
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    const msg = `[Supabase / deleteProduct] ${error.message}`;
    console.error(msg);
    throw new Error(msg);
  }
}

export async function uploadProductImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("[Supabase / uploadProductImage]", error.message);
    return null;
  }
  const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(data.path);
  return publicUrl;
}

export async function createProduct(input: {
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  sellerId: number;
  sellerName: string;
  sellerWhatsapp: string;
  sellerAvatar?: string | null;
  imageUrl?: string | null;
  stock: number;
  deliveryOptions: string[];
  paymentMethods: string[];
}): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      title: input.title,
      description: input.description,
      price: input.price,
      category: input.category,
      location: input.location,
      seller_id: input.sellerId,
      seller_name: input.sellerName,
      seller_whatsapp: input.sellerWhatsapp,
      seller_avatar: input.sellerAvatar ?? null,
      image_url: input.imageUrl ?? null,
      images: input.imageUrl ? [input.imageUrl] : [],
      stock: input.stock,
      delivery_options: input.deliveryOptions,
      payment_methods: input.paymentMethods,
      is_sponsored: false,
      is_premium_seller: false,
    })
    .select()
    .single();
  throwIfError(data, error, "createProduct");
  return mapProduct(data);
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

// ─── Admin Functions ──────────────────────────────────────────────

export async function adminGetAllSellers(): Promise<Seller[]> {
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .order("joined_at", { ascending: false });
  throwIfError(data, error, "adminGetAllSellers");
  return (data as Record<string, any>[]).map(mapSeller);
}

export async function adminGetAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(data, error, "adminGetAllProducts");
  return (data as Record<string, any>[]).map(mapProduct);
}

export async function adminToggleSellerPremium(id: number, isPremium: boolean): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .update({ is_premium: isPremium })
    .eq("id", id)
    .select()
    .single();
  throwIfError(data, error, "adminToggleSellerPremium");
  return mapSeller(data);
}

export async function adminToggleProductSponsored(id: number, isSponsored: boolean): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({ is_sponsored: isSponsored })
    .eq("id", id)
    .select()
    .single();
  throwIfError(data, error, "adminToggleProductSponsored");
  return mapProduct(data);
}

export async function adminDeleteSeller(id: number): Promise<void> {
  await supabase.from("products").delete().eq("seller_id", id);
  const { error } = await supabase.from("sellers").delete().eq("id", id);
  if (error) throw new Error(`[Supabase / adminDeleteSeller] ${error.message}`);
}

export async function adminDeleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`[Supabase / adminDeleteProduct] ${error.message}`);
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
