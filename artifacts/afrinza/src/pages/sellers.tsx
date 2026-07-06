import { useState } from "react";
import { useLocation } from "wouter";
import { useGetSellers } from "@/hooks/use-marketplace";
import { MALAYSIA_LOCATIONS, CITIES_BY_COUNTRY, LOCATION_COUNTRIES } from "@/lib/malaysia-locations";
import { SellerCard } from "@/components/seller-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sellers() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [locFilter, setLocFilter] = useState(searchParams.get("location") || "");
  const [locCountry, setLocCountry] = useState("");

  const { data, isLoading } = useGetSellers({ location: locFilter || undefined });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (locFilter) params.append("location", locFilter);
    setLocation(`/sellers?${params.toString()}`);
  };

  const filteredSellers = data?.sellers.filter(
    (s) =>
      !search ||
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-primary rounded-3xl p-8 md:p-12 mb-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold font-serif mb-4">Discover Sellers</h1>
          <p className="text-primary-foreground/90 text-lg mb-8">
            Connect directly with businesses bringing the best of Africa to the diaspora.
            Support the community and find authentic products.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by store name..."
                className="pl-10 h-12 bg-white text-foreground border-transparent rounded-xl md:rounded-full shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-12 px-4 rounded-xl md:rounded-full bg-white text-foreground border-transparent shadow-sm outline-none cursor-pointer sm:w-48"
              value={locCountry}
              onChange={(e) => {
                setLocCountry(e.target.value);
                setLocFilter("");
                setTimeout(() => {
                  const form = e.target.closest("form");
                  if (form) form.requestSubmit();
                }, 0);
              }}
            >
              <option value="">All Countries</option>
              {LOCATION_COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {locCountry && (
              <select
                className="h-12 px-4 rounded-xl md:rounded-full bg-white text-foreground border-transparent shadow-sm outline-none cursor-pointer sm:w-44"
                value={locFilter}
                onChange={(e) => {
                  setLocFilter(e.target.value);
                  setTimeout(() => {
                    const form = e.target.closest("form");
                    if (form) form.requestSubmit();
                  }, 0);
                }}
              >
                <option value="">All Cities</option>
                {(CITIES_BY_COUNTRY[locCountry] ?? []).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            )}
            <Button type="submit" variant="secondary" className="h-12 rounded-xl md:rounded-full px-8 font-bold">
              Find Stores
            </Button>
          </form>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">All Stores</h2>
        <span className="text-muted-foreground bg-muted px-3 py-1 rounded-full text-sm font-medium">
          {isLoading ? "..." : `${filteredSellers?.length || 0} stores`}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="w-full h-[320px] rounded-2xl" />
          ))}
        </div>
      ) : filteredSellers && filteredSellers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSellers.map((seller, i) => (
            <SellerCard key={seller.id} seller={seller} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-sm">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No sellers found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We couldn't find any sellers matching your criteria. Try adjusting your search or location filter.
          </p>
          <Button onClick={() => { setSearch(""); setLocFilter(""); }} variant="outline" className="rounded-full">
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
