import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/auth-context";
import {
  useAdminGetAllSellers,
  useAdminGetAllProducts,
  useAdminToggleSellerPremium,
  useAdminToggleProductSponsored,
  useAdminDeleteSeller,
  useAdminDeleteProduct,
} from "@/hooks/use-marketplace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield, Store, Package, Star, Trash2, Loader2, StarOff, Users, Tag, LayoutDashboard,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_EMAIL = "alphuplift@gmail.com";

type Tab = "sellers" | "products";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const [tab, setTab] = useState<Tab>("sellers");
  const [confirmDelete, setConfirmDelete] = useState<{ type: "seller" | "product"; id: number; name: string } | null>(null);

  const allSellers = useAdminGetAllSellers();
  const allProducts = useAdminGetAllProducts();
  const toggleSellerPremium = useAdminToggleSellerPremium();
  const toggleProductSponsored = useAdminToggleProductSponsored();
  const deleteSeller = useAdminDeleteSeller();
  const deleteProduct = useAdminDeleteProduct();

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Admin Access Only</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          This area is restricted to Afrinza administrators. Please sign in with your admin account.
        </p>
        <Button onClick={() => setLocation("/auth")} className="rounded-full px-8 h-12 font-semibold">
          Sign In
        </Button>
      </div>
    );
  }

  const sellers = allSellers.data ?? [];
  const products = allProducts.data ?? [];

  const sponsoredSellers = sellers.filter((s) => s.isPremium).length;
  const sponsoredProducts = products.filter((p) => p.isSponsored).length;

  const handleToggleSeller = (id: number, current: boolean) => {
    toggleSellerPremium.mutate(
      { id, isPremium: !current },
      {
        onSuccess: () => toast.success(!current ? "Store marked as Sponsored" : "Sponsor badge removed"),
        onError: () => toast.error("Failed to update — check Supabase admin policy."),
      }
    );
  };

  const handleToggleProduct = (id: number, current: boolean) => {
    toggleProductSponsored.mutate(
      { id, isSponsored: !current },
      {
        onSuccess: () => toast.success(!current ? "Product marked as Sponsored" : "Sponsor removed"),
        onError: () => toast.error("Failed to update — check Supabase admin policy."),
      }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "seller") {
      deleteSeller.mutate(
        { id: confirmDelete.id },
        {
          onSuccess: () => { toast.success(`Store "${confirmDelete.name}" deleted.`); setConfirmDelete(null); },
          onError: () => toast.error("Delete failed — check Supabase admin policy."),
        }
      );
    } else {
      deleteProduct.mutate(
        { id: confirmDelete.id },
        {
          onSuccess: () => { toast.success(`Product "${confirmDelete.name}" deleted.`); setConfirmDelete(null); },
          onError: () => toast.error("Delete failed — check Supabase admin policy."),
        }
      );
    }
  };

  return (
    <div className="bg-muted/10 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f3460] to-[#1a1a2e] text-white py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Afrinza Admin Panel</h1>
              <p className="text-white/60 text-sm">Signed in as {user.email}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { icon: <Users className="w-4 h-4" />, label: "Total Sellers", value: sellers.length },
              { icon: <Package className="w-4 h-4" />, label: "Total Products", value: products.length },
              { icon: <Star className="w-4 h-4 text-amber-400" />, label: "Sponsored Stores", value: sponsoredSellers },
              { icon: <Tag className="w-4 h-4 text-amber-400" />, label: "Sponsored Products", value: sponsoredProducts },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/70 mb-1 text-xs">{stat.icon} {stat.label}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-border shadow-sm w-fit">
          <button
            onClick={() => setTab("sellers")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "sellers" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Store className="w-4 h-4" /> Sellers ({sellers.length})
          </button>
          <button
            onClick={() => setTab("products")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "products" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Package className="w-4 h-4" /> Products ({products.length})
          </button>
        </div>

        {/* Sellers tab */}
        {tab === "sellers" && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            {allSellers.isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : sellers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No sellers yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Store</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Owner</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Location</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Categories</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Sponsored</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((seller) => (
                      <tr key={seller.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {seller.avatarUrl ? (
                              <img src={seller.avatarUrl} alt={seller.storeName} className="w-9 h-9 rounded-full object-cover border border-border" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {seller.storeName[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold">{seller.storeName}</div>
                              {seller.isPremium && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 h-4 px-1.5">Sponsored</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{seller.ownerName}</td>
                        <td className="px-5 py-4 text-muted-foreground">{seller.location}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {seller.categories.slice(0, 2).map((c) => (
                              <Badge key={c} variant="outline" className="text-[10px] h-5">{c}</Badge>
                            ))}
                            {seller.categories.length > 2 && (
                              <Badge variant="outline" className="text-[10px] h-5">+{seller.categories.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleSeller(seller.id, seller.isPremium)}
                            disabled={toggleSellerPremium.isPending}
                            title={seller.isPremium ? "Remove sponsor" : "Mark as sponsored"}
                            className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-all ${seller.isPremium ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-500"}`}
                          >
                            {seller.isPremium ? <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> : <Star className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setConfirmDelete({ type: "seller", id: seller.id, name: seller.storeName })}
                            className="w-9 h-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center mx-auto transition-all"
                            title="Delete store"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Products tab */}
        {tab === "products" && (
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            {allProducts.isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No products yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Product</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Seller</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Category</th>
                      <th className="text-left px-5 py-4 font-semibold text-muted-foreground">Price</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Sponsored</th>
                      <th className="text-center px-5 py-4 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.title} className="w-10 h-10 rounded-xl object-cover border border-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold max-w-[200px] truncate">{product.title}</div>
                              {product.isSponsored && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 h-4 px-1.5">Sponsored</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{product.sellerName}</td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold">RM {parseFloat(product.price).toFixed(2)}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleProduct(product.id, product.isSponsored)}
                            disabled={toggleProductSponsored.isPending}
                            title={product.isSponsored ? "Remove sponsor" : "Mark as sponsored"}
                            className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-all ${product.isSponsored ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-muted text-muted-foreground hover:bg-amber-50 hover:text-amber-500"}`}
                          >
                            {product.isSponsored ? <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> : <Star className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setConfirmDelete({ type: "product", id: product.id, name: product.title })}
                            className="w-9 h-9 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center mx-auto transition-all"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.type === "seller" ? "Store" : "Product"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{confirmDelete?.name}"</strong>
              {confirmDelete?.type === "seller" && " and all of its products"}.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteSeller.isPending || deleteProduct.isPending}
            >
              {(deleteSeller.isPending || deleteProduct.isPending) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</>
              ) : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
