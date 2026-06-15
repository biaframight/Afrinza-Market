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
  isVerified: boolean;
  kycStatus: "none" | "pending" | "verified" | "rejected";
  kycWhatsapp: string | null;
  kycSubmittedAt: string | null;
  isActive: boolean;
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
    isVerified: r.is_verified ?? false,
    kycStatus: (r.kyc_status ?? "none") as Seller["kycStatus"],
    kycWhatsapp: r.kyc_whatsapp ?? null,
    kycSubmittedAt: r.kyc_submitted_at ?? null,
    isActive: r.is_active ?? true,
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
  const { data: inactiveRows } = await supabase.from("sellers").select("id").eq("is_active", false);
  const inactiveIds = (inactiveRows ?? []).map((r: any) => r.id as number);

  let query = supabase.from("products").select("*").eq("is_sponsored", true).order("created_at", { ascending: false });
  if (inactiveIds.length > 0) {
    query = query.not("seller_id", "in", `(${inactiveIds.join(",")})`);
  }

  const { data, error } = await query;
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

  // Exclude products belonging to deactivated sellers
  const { data: inactiveRows } = await supabase.from("sellers").select("id").eq("is_active", false);
  const inactiveIds = (inactiveRows ?? []).map((r: any) => r.id as number);
  if (inactiveIds.length > 0) {
    query = query.not("seller_id", "in", `(${inactiveIds.join(",")})`);
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  query = query
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

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
    .order("joined_at", { ascending: true });
  throwIfError(data, error, "getFeaturedSellers");
  const sellers = data.map(mapSeller).filter((s) => s.isActive);
  return { sellers, total: sellers.length };
}

export async function getSellers(filters: {
  location?: string;
  category?: string;
}): Promise<{ sellers: Seller[]; total: number }> {
  let query = supabase.from("sellers").select("*");
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);

  query = query
    .order("is_premium", { ascending: false })
    .order("joined_at", { ascending: true });

  const { data, error } = await query;
  throwIfError(data, error, "getSellers");
  let sellers = data.map(mapSeller).filter((s) => s.isActive);
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
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: true });
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
    images?: string[];
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
  if (updates.images !== undefined) {
    payload.images = updates.images;
    payload.image_url = updates.images[0] ?? null;
  } else if (updates.imageUrl !== undefined) {
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
  images?: string[];
  stock: number;
  deliveryOptions: string[];
  paymentMethods: string[];
}): Promise<Product> {
  const resolvedImages = input.images ?? (input.imageUrl ? [input.imageUrl] : []);
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
      image_url: resolvedImages[0] ?? null,
      images: resolvedImages,
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

  const firstProduct = cart.items[0]?.product;
  const sellerId   = firstProduct?.sellerId   ?? null;
  const sellerName = firstProduct?.sellerName ?? null;

  const { error: orderError } = await supabase
    .from("orders")
    .insert({
      session_id:      input.sessionId,
      buyer_name:      input.buyerName,
      buyer_phone:     input.buyerPhone,
      buyer_address:   input.buyerAddress ?? null,
      total:           cart.total.toFixed(2),
      payment_method:  input.paymentMethod,
      delivery_method: input.deliveryMethod,
      status:          "pending",
      seller_id:       sellerId,
      seller_name:     sellerName,
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
  // 1. Get seller record to find user_id
  const { data: sellerRow } = await supabase
    .from("sellers").select("id, user_id").eq("id", id).maybeSingle();
  const userId = (sellerRow as any)?.user_id ?? null;

  // 2. Get product IDs so we can clean cart_items
  const { data: productRows } = await supabase
    .from("products").select("id").eq("seller_id", id);
  const productIds = ((productRows ?? []) as any[]).map((p) => p.id as number);
  if (productIds.length > 0) {
    await supabase.from("cart_items").delete().in("product_id", productIds);
  }

  // 3. Delete seller-linked data
  await supabase.from("reviews").delete().eq("seller_id", id);
  await supabase.from("subscription_payments").delete().eq("seller_id", id);
  await supabase.from("products").delete().eq("seller_id", id);

  // 4. If user_id exists: clean up SP profile, SP subscriptions, room listings
  if (userId) {
    const { data: spRow } = await supabase
      .from("service_providers").select("id").eq("user_id", userId).maybeSingle();
    if (spRow) {
      await supabase.from("service_provider_subscriptions").delete().eq("provider_id", (spRow as any).id);
      await supabase.from("service_providers").delete().eq("id", (spRow as any).id);
    }
    await supabase.from("room_listings").delete().eq("user_id", userId);
  }

  // 5. Finally delete the seller record itself
  const { error } = await supabase.from("sellers").delete().eq("id", id);
  if (error) throw new Error(`[Supabase / adminDeleteSeller] ${error.message}`);
}

export async function adminGetAllServiceProviders(): Promise<ServiceProvider[]> {
  const { data, error } = await supabase
    .from("service_providers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`[Supabase / adminGetAllServiceProviders] ${error.message}`);
  return ((data ?? []) as any[]).map(mapServiceProvider);
}

export async function adminDeleteServiceProvider(id: number): Promise<void> {
  // 1. Get SP record to find user_id
  const { data: spRow } = await supabase
    .from("service_providers").select("id, user_id").eq("id", id).maybeSingle();
  const userId = (spRow as any)?.user_id ?? null;

  // 2. Delete SP subscriptions
  await supabase.from("service_provider_subscriptions").delete().eq("provider_id", id);

  // 3. Delete room listings linked to this user
  if (userId) {
    await supabase.from("room_listings").delete().eq("user_id", userId);
  }

  // 4. Delete service provider record
  const { error } = await supabase.from("service_providers").delete().eq("id", id);
  if (error) throw new Error(`[Supabase / adminDeleteServiceProvider] ${error.message}`);
}

export async function adminToggleSellerActive(id: number, isActive: boolean): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();
  throwIfError(data, error, "adminToggleSellerActive");
  return mapSeller(data);
}

export async function adminDeleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`[Supabase / adminDeleteProduct] ${error.message}`);
}

// ─── KYC ──────────────────────────────────────────────────────────

export async function submitKycRequest(sellerId: number, whatsapp: string): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .update({
      kyc_status: "pending",
      kyc_whatsapp: whatsapp.trim(),
      kyc_submitted_at: new Date().toISOString(),
    })
    .eq("id", sellerId)
    .select()
    .single();
  throwIfError(data, error, "submitKycRequest");
  return mapSeller(data);
}

export async function adminVerifySeller(sellerId: number): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .update({ is_verified: true, kyc_status: "verified" })
    .eq("id", sellerId)
    .select()
    .single();
  throwIfError(data, error, "adminVerifySeller");
  return mapSeller(data);
}

export async function adminRejectKyc(sellerId: number): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .update({ kyc_status: "rejected" })
    .eq("id", sellerId)
    .select()
    .single();
  throwIfError(data, error, "adminRejectKyc");
  return mapSeller(data);
}

export async function adminRevokeVerification(sellerId: number): Promise<Seller> {
  const { data, error } = await supabase
    .from("sellers")
    .update({
      is_verified: false,
      kyc_status: "none",
      kyc_whatsapp: null,
      kyc_submitted_at: null,
    })
    .eq("id", sellerId)
    .select()
    .single();
  throwIfError(data, error, "adminRevokeVerification");
  return mapSeller(data);
}

// ─── Admin Orders ─────────────────────────────────────────────────

export interface AdminOrder {
  id: number;
  sessionId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string | null;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  status: string;
  sellerId: number | null;
  sellerName: string | null;
  createdAt: string;
}

function mapOrder(row: Record<string, any>): AdminOrder {
  return {
    id: row.id,
    sessionId: row.session_id,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    buyerAddress: row.buyer_address ?? null,
    total: parseFloat(row.total),
    paymentMethod: row.payment_method,
    deliveryMethod: row.delivery_method,
    status: row.status,
    sellerId: row.seller_id ?? null,
    sellerName: row.seller_name ?? null,
    createdAt: row.created_at,
  };
}

export async function adminGetAllOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(data, error, "adminGetAllOrders");
  return (data as Record<string, any>[]).map(mapOrder);
}

export async function adminUpdateOrderStatus(id: number, status: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`[Supabase / adminUpdateOrderStatus] ${error.message}`);
}

// ─── Visitor Tracking ─────────────────────────────────────────────

export async function trackPageView(sessionId: string, path: string): Promise<void> {
  await supabase.from("page_views").insert({ session_id: sessionId, path });
}

export interface VisitorDay {
  date: string;
  uniqueVisitors: number;
  pageViews: number;
}

export interface VisitorStats {
  today: { uniqueVisitors: number; pageViews: number };
  days: VisitorDay[];
  topPages: { path: string; views: number }[];
  totalUniqueVisitors: number;
}

export async function getVisitorStats(): Promise<VisitorStats> {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("page_views")
    .select("session_id, path, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(`[Supabase / getVisitorStats] ${error.message}`);

  const rows = (data ?? []) as { session_id: string; path: string; created_at: string }[];

  const dayMap: Record<string, { sessions: Set<string>; views: number }> = {};
  const pathMap: Record<string, number> = {};
  const allSessions = new Set<string>();

  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { sessions: new Set(), views: 0 };
    dayMap[day].sessions.add(row.session_id);
    dayMap[day].views++;
    allSessions.add(row.session_id);
    pathMap[row.path] = (pathMap[row.path] ?? 0) + 1;
  }

  const days: VisitorDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = dayMap[key];
    days.push({
      date: key,
      uniqueVisitors: entry ? entry.sessions.size : 0,
      pageViews: entry ? entry.views : 0,
    });
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayEntry = dayMap[todayKey];

  const topPages = Object.entries(pathMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, views]) => ({ path, views }));

  return {
    today: {
      uniqueVisitors: todayEntry?.sessions.size ?? 0,
      pageViews: todayEntry?.views ?? 0,
    },
    days,
    topPages,
    totalUniqueVisitors: allSessions.size,
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

// ─── Subscription Payments ────────────────────────────────────────

export interface SubscriptionPayment {
  id: number;
  sellerId: number;
  month: string;
  amount: number;
  receiptUrl: string | null;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
  confirmedAt: string | null;
  storeName?: string;
  ownerName?: string;
}

function mapSubscriptionPayment(r: Record<string, any>): SubscriptionPayment {
  return {
    id: r.id,
    sellerId: r.seller_id,
    month: r.month,
    amount: parseFloat(r.amount),
    receiptUrl: r.receipt_url ?? null,
    status: r.status as "pending" | "confirmed" | "rejected",
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at ?? null,
    storeName: r.sellers?.store_name,
    ownerName: r.sellers?.owner_name,
  };
}

export async function uploadReceiptImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `receipts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(`[Supabase / uploadReceiptImage] ${error.message}`);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function createSubscriptionPayment(payload: {
  sellerId: number;
  month: string;
  receiptUrl: string;
}): Promise<SubscriptionPayment> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .upsert(
      { seller_id: payload.sellerId, month: payload.month, receipt_url: payload.receiptUrl, status: "pending" },
      { onConflict: "seller_id,month" }
    )
    .select()
    .single();
  if (error) throw new Error(`[Supabase / createSubscriptionPayment] ${error.message}`);
  return mapSubscriptionPayment(data);
}

export async function getSellerCurrentSubscription(
  sellerId: number,
  month: string
): Promise<SubscriptionPayment | null> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("month", month)
    .maybeSingle();
  if (error) throw new Error(`[Supabase / getSellerCurrentSubscription] ${error.message}`);
  return data ? mapSubscriptionPayment(data) : null;
}

export async function adminGetAllSubscriptions(): Promise<SubscriptionPayment[]> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("*, sellers(store_name, owner_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`[Supabase / adminGetAllSubscriptions] ${error.message}`);
  return (data ?? []).map(mapSubscriptionPayment);
}

export async function adminConfirmSubscription(id: number): Promise<void> {
  const { error } = await supabase
    .from("subscription_payments")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`[Supabase / adminConfirmSubscription] ${error.message}`);
}

export async function adminRejectSubscription(id: number): Promise<void> {
  const { error } = await supabase
    .from("subscription_payments")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) throw new Error(`[Supabase / adminRejectSubscription] ${error.message}`);
}

// ─── Room Listings ────────────────────────────────────────────────

export interface RoomListing {
  id: number;
  listerName: string;
  whatsapp: string;
  location: string;
  title: string;
  description: string | null;
  pricePerMonth: number | null;
  roomType: string;
  amenities: string[];
  availableFrom: string | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

function mapRoomListing(r: Record<string, any>): RoomListing {
  return {
    id: r.id,
    listerName: r.lister_name,
    whatsapp: r.whatsapp,
    location: r.location,
    title: r.title,
    description: r.description ?? null,
    pricePerMonth: r.price_per_month != null ? parseFloat(r.price_per_month) : null,
    roomType: r.room_type,
    amenities: r.amenities ?? [],
    availableFrom: r.available_from ?? null,
    images: r.images ?? [],
    isActive: r.is_active ?? true,
    createdAt: r.created_at,
  };
}

export async function getRoomListings(location?: string): Promise<RoomListing[]> {
  let query = supabase
    .from("room_listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (location && location !== "all") {
    query = query.eq("location", location);
  }

  const { data, error } = await query;
  if (error) throw new Error(`[Supabase / getRoomListings] ${error.message}`);
  return (data ?? []).map(mapRoomListing);
}

export async function createRoomListing(payload: {
  listerName: string;
  whatsapp: string;
  location: string;
  title: string;
  roomType: string;
  pricePerMonth: number | null;
  description: string;
  amenities: string[];
  availableFrom: string | null;
  images?: string[];
}): Promise<RoomListing> {
  const { data, error } = await supabase
    .from("room_listings")
    .insert({
      lister_name: payload.listerName,
      whatsapp: payload.whatsapp,
      location: payload.location,
      title: payload.title,
      room_type: payload.roomType,
      price_per_month: payload.pricePerMonth,
      description: payload.description,
      amenities: payload.amenities,
      available_from: payload.availableFrom,
      images: payload.images ?? [],
    })
    .select()
    .single();
  if (error) throw new Error(`[Supabase / createRoomListing] ${error.message}`);
  return mapRoomListing(data);
}

export async function getRoomListingsByWhatsapp(whatsapp: string): Promise<RoomListing[]> {
  const { data, error } = await supabase
    .from("room_listings")
    .select("*")
    .eq("whatsapp", whatsapp)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`[Supabase / getRoomListingsByWhatsapp] ${error.message}`);
  return (data ?? []).map(mapRoomListing);
}

export async function updateRoomListing(id: number, updates: {
  title?: string;
  description?: string;
  pricePerMonth?: number | null;
  roomType?: string;
  location?: string;
  amenities?: string[];
  availableFrom?: string | null;
}): Promise<RoomListing> {
  const { data, error } = await supabase
    .from("room_listings")
    .update({
      title: updates.title,
      description: updates.description,
      price_per_month: updates.pricePerMonth,
      room_type: updates.roomType,
      location: updates.location,
      amenities: updates.amenities,
      available_from: updates.availableFrom ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`[Supabase / updateRoomListing] ${error.message}`);
  return mapRoomListing(data);
}

export async function deleteRoomListing(id: number): Promise<void> {
  const { error } = await supabase.from("room_listings").delete().eq("id", id);
  if (error) throw new Error(`[Supabase / deleteRoomListing] ${error.message}`);
}

// ─── Service Providers ─────────────────────────────────────────────

export interface ServiceProvider {
  id: number;
  userId: string | null;
  providerName: string;
  businessName: string | null;
  location: string;
  whatsapp: string;
  description: string | null;
  experience: string | null;
  serviceTypes: string[];
  customServiceType: string | null;
  photos: string[];
  isVerified: boolean;
  kycStatus: string;
  kycWhatsapp: string | null;
  isActive: boolean;
  createdAt: string;
}

function mapServiceProvider(r: Record<string, any>): ServiceProvider {
  return {
    id: r.id,
    userId: r.user_id ?? null,
    providerName: r.provider_name,
    businessName: r.business_name ?? null,
    location: r.location,
    whatsapp: r.whatsapp,
    description: r.description ?? null,
    experience: r.experience ?? null,
    serviceTypes: r.service_types ?? [],
    customServiceType: r.custom_service_type ?? null,
    photos: r.photos ?? [],
    isVerified: r.is_verified ?? false,
    kycStatus: r.kyc_status ?? "none",
    kycWhatsapp: r.kyc_whatsapp ?? null,
    isActive: r.is_active ?? true,
    createdAt: r.created_at,
  };
}

export async function getServiceProviders(location?: string): Promise<ServiceProvider[]> {
  let query = supabase
    .from("service_providers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (location && location !== "all") {
    query = query.eq("location", location);
  }
  const { data, error } = await query;
  if (error) throw new Error(`[Supabase / getServiceProviders] ${error.message}`);
  return (data ?? []).map(mapServiceProvider);
}

export async function getServiceProviderByUserId(userId: string): Promise<ServiceProvider | null> {
  const { data, error } = await supabase
    .from("service_providers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`[Supabase / getServiceProviderByUserId] ${error.message}`);
  return data ? mapServiceProvider(data) : null;
}

export async function createServiceProvider(payload: {
  userId: string | null;
  providerName: string;
  businessName: string;
  location: string;
  whatsapp: string;
  description: string;
  experience: string;
  serviceTypes: string[];
  customServiceType: string | null;
  photos: string[];
}): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from("service_providers")
    .insert({
      user_id: payload.userId,
      provider_name: payload.providerName,
      business_name: payload.businessName,
      location: payload.location,
      whatsapp: payload.whatsapp,
      description: payload.description,
      experience: payload.experience,
      service_types: payload.serviceTypes,
      custom_service_type: payload.customServiceType,
      photos: payload.photos,
    })
    .select()
    .single();
  if (error) throw new Error(`[Supabase / createServiceProvider] ${error.message}`);
  return mapServiceProvider(data);
}

export async function updateServiceProvider(id: number, updates: {
  providerName?: string;
  businessName?: string;
  location?: string;
  description?: string;
  experience?: string;
  serviceTypes?: string[];
  customServiceType?: string | null;
}): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from("service_providers")
    .update({
      provider_name: updates.providerName,
      business_name: updates.businessName,
      location: updates.location,
      description: updates.description,
      experience: updates.experience,
      service_types: updates.serviceTypes,
      custom_service_type: updates.customServiceType ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`[Supabase / updateServiceProvider] ${error.message}`);
  return mapServiceProvider(data);
}

export async function submitServiceProviderKyc(providerId: number, whatsapp: string): Promise<void> {
  const { error } = await supabase
    .from("service_providers")
    .update({ kyc_status: "pending", kyc_whatsapp: whatsapp })
    .eq("id", providerId);
  if (error) throw new Error(`[Supabase / submitServiceProviderKyc] ${error.message}`);
}

export async function adminVerifyServiceProvider(providerId: number): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from("service_providers")
    .update({ is_verified: true, kyc_status: "verified" })
    .eq("id", providerId)
    .select()
    .single();
  if (error) throw new Error(`[Supabase / adminVerifyServiceProvider] ${error.message}`);
  return mapServiceProvider(data);
}

export async function adminRejectSpKyc(providerId: number): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from("service_providers")
    .update({ kyc_status: "rejected" })
    .eq("id", providerId)
    .select()
    .single();
  if (error) throw new Error(`[Supabase / adminRejectSpKyc] ${error.message}`);
  return mapServiceProvider(data);
}

export async function adminRevokeSpVerification(providerId: number): Promise<ServiceProvider> {
  const { data, error } = await supabase
    .from("service_providers")
    .update({ is_verified: false, kyc_status: "none", kyc_whatsapp: null })
    .eq("id", providerId)
    .select()
    .single();
  if (error) throw new Error(`[Supabase / adminRevokeSpVerification] ${error.message}`);
  return mapServiceProvider(data);
}

export async function uploadServicePhoto(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("service-photos").upload(path, file);
  if (error) { console.error("Service photo upload error:", error.message); return null; }
  return supabase.storage.from("service-photos").getPublicUrl(path).data.publicUrl;
}

export async function uploadRoomPhoto(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("room-photos").upload(path, file);
  if (error) { console.error("Room photo upload error:", error.message); return null; }
  return supabase.storage.from("room-photos").getPublicUrl(path).data.publicUrl;
}

// ─── Service Provider Subscriptions ────────────────────────────────

export interface ServiceProviderSub {
  id: number;
  providerId: number;
  month: string;
  receiptUrl: string;
  status: string;
  createdAt: string;
}

function mapServiceProviderSub(r: Record<string, any>): ServiceProviderSub {
  return {
    id: r.id,
    providerId: r.provider_id,
    month: r.month,
    receiptUrl: r.receipt_url,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function getServiceProviderSub(providerId: number, month: string): Promise<ServiceProviderSub | null> {
  const { data, error } = await supabase
    .from("service_provider_subscriptions")
    .select("*")
    .eq("provider_id", providerId)
    .eq("month", month)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[Supabase / getServiceProviderSub] ${error.message}`);
  return data ? mapServiceProviderSub(data) : null;
}

export async function createServiceProviderSub(payload: {
  providerId: number;
  month: string;
  receiptUrl: string;
}): Promise<void> {
  const { error } = await supabase
    .from("service_provider_subscriptions")
    .insert({
      provider_id: payload.providerId,
      month: payload.month,
      receipt_url: payload.receiptUrl,
    });
  if (error) throw new Error(`[Supabase / createServiceProviderSub] ${error.message}`);
}

export async function uploadServiceProviderReceipt(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("service-photos").upload(path, file);
  if (error) throw new Error(`Receipt upload failed: ${error.message}`);
  return supabase.storage.from("service-photos").getPublicUrl(path).data.publicUrl;
}
