import { useState, useEffect } from "react";
import { Search, Package, ShoppingCart, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  type: "product" | "order" | "user";
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
}

export const GlobalSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch all searchable data
  const { data: products } = useQuery({
    queryKey: ["search-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, brand");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["search-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, razorpay_order_id, users(email, full_name)");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["search-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Prepare searchable items
    const searchableItems: SearchResult[] = [
      ...(products?.map((p) => ({
        type: "product" as const,
        id: p.id,
        title: p.title,
        subtitle: p.brand || undefined,
        icon: Package,
        searchText: `${p.title} ${p.slug} ${p.brand || ""}`,
      })) || []),
      ...(orders?.map((o) => ({
        type: "order" as const,
        id: o.id,
        title: `Order ${o.id.slice(0, 8)}`,
        subtitle: o.users?.email || o.users?.full_name || undefined,
        icon: ShoppingCart,
        searchText: `${o.id} ${o.razorpay_order_id || ""} ${o.users?.email || ""} ${o.users?.full_name || ""}`,
      })) || []),
      ...(users?.map((u) => ({
        type: "user" as const,
        id: u.id,
        title: u.full_name || u.email,
        subtitle: u.full_name ? u.email : undefined,
        icon: Users,
        searchText: `${u.full_name || ""} ${u.email}`,
      })) || []),
    ];

    // Configure Fuse.js
    const fuse = new Fuse(searchableItems, {
      keys: ["searchText"],
      threshold: 0.3,
      includeScore: true,
    });

    // Perform search
    const searchResults = fuse.search(searchQuery);
    const topResults = searchResults.slice(0, 8).map((result) => result.item);
    setResults(topResults);
    setIsOpen(topResults.length > 0);
  }, [searchQuery, products, orders, users]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case "product":
        navigate(`/admin/products/${result.id}`);
        break;
      case "order":
        navigate(`/admin/orders`);
        break;
      case "user":
        navigate(`/admin/users`);
        break;
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, orders, users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 admin-input"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
            {results.map((result, idx) => {
              const Icon = result.icon;
              return (
                <button
                  key={`${result.type}-${result.id}-${idx}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize px-2 py-1 bg-muted rounded">
                    {result.type}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
