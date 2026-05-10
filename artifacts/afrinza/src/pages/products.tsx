import { useState } from "react";
import { useLocation } from "wouter";
import { useGetProducts, getGetProductsQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SlidersHorizontal, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";

export default function Products() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [locFilter, setLocFilter] = useState(searchParams.get("location") || "");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl();
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (locFilter) params.append("location", locFilter);
    setLocation(`/products?${params.toString()}`);
  };

  const { data, isLoading } = useGetProducts(
    { 
      search: search || undefined, 
      category: category || undefined, 
      location: locFilter || undefined 
    },
    { query: { queryKey: getGetProductsQueryKey({ search, category, location: locFilter }) } }
  );

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setLocFilter("");
    setLocation("/products");
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Filters</h3>
          {(category || locFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground">
              Clear all
            </Button>
          )}
        </div>
        
        <Accordion type="multiple" defaultValue={["category", "location"]} className="w-full">
          <AccordionItem value="category" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-3">Category</AccordionTrigger>
            <AccordionContent>
              <RadioGroup value={category} onValueChange={(v) => { setCategory(v); setTimeout(updateUrl, 0); }} className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="cat-all" />
                  <Label htmlFor="cat-all">All Categories</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Food" id="cat-food" />
                  <Label htmlFor="cat-food">African Food</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Fashion" id="cat-fashion" />
                  <Label htmlFor="cat-fashion">Fashion & Style</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Services" id="cat-services" />
                  <Label htmlFor="cat-services">Services</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Groceries" id="cat-groceries" />
                  <Label htmlFor="cat-groceries">Groceries & Spices</Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="location" className="border-b-0 mt-4">
            <AccordionTrigger className="hover:no-underline py-3">Location</AccordionTrigger>
            <AccordionContent>
              <RadioGroup value={locFilter} onValueChange={(v) => { setLocFilter(v); setTimeout(updateUrl, 0); }} className="space-y-2 pt-2 max-h-64 overflow-y-auto pr-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="loc-all" />
                  <Label htmlFor="loc-all">Anywhere in Malaysia</Label>
                </div>
                {[
                  ["KL", "Kuala Lumpur"],
                  ["Putrajaya", "Putrajaya"],
                  ["Selangor", "Selangor"],
                  ["Shah Alam", "Shah Alam"],
                  ["Petaling Jaya", "Petaling Jaya"],
                  ["Subang Jaya", "Subang Jaya"],
                  ["Cyberjaya", "Cyberjaya"],
                  ["Puchong", "Puchong"],
                  ["Klang", "Klang"],
                  ["Kajang", "Kajang"],
                  ["Penang", "Penang"],
                  ["Georgetown", "Georgetown"],
                  ["Johor", "Johor"],
                  ["Johor Bahru", "Johor Bahru"],
                  ["Perak", "Perak"],
                  ["Ipoh", "Ipoh"],
                  ["Negeri Sembilan", "Negeri Sembilan"],
                  ["Seremban", "Seremban"],
                  ["Melaka", "Melaka"],
                  ["Pahang", "Pahang"],
                  ["Kuantan", "Kuantan"],
                  ["Kedah", "Kedah"],
                  ["Kelantan", "Kelantan"],
                  ["Terengganu", "Terengganu"],
                  ["Perlis", "Perlis"],
                  ["Sabah", "Sabah"],
                  ["Kota Kinabalu", "Kota Kinabalu"],
                  ["Sarawak", "Sarawak"],
                  ["Kuching", "Kuching"],
                  ["Labuan", "Labuan"],
                ].map(([val, lbl]) => (
                  <div key={val} className="flex items-center space-x-2">
                    <RadioGroupItem value={val} id={`loc-${val}`} />
                    <Label htmlFor={`loc-${val}`}>{lbl}</Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Explore Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading products..." : `${data?.total || 0} items found`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative w-full md:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 pr-4 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader className="mb-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FilterContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-white border border-border p-6 rounded-2xl shadow-sm">
            <FilterContent />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3 mt-2" />
                </div>
              ))}
            </div>
          ) : data?.products && data.products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {data.products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-border shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any products matching your current filters. Try adjusting your search or category.
              </p>
              <Button onClick={clearFilters} variant="outline" className="rounded-full">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
