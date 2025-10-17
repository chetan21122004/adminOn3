import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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

const Products = () => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(name),
          collection:collections(title),
          images:product_images(image_url, is_primary)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted successfully");
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete product");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Link to="/admin/products/new">
            <Button className="admin-button gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Products Table */}
        <div className="admin-card">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading products...</div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Collection</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const primaryImage = product.images?.find((img: any) => img.is_primary)?.image_url;
                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.title}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-muted-foreground">{product.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td>{product.category?.name || "-"}</td>
                        <td>{product.collection?.title || "-"}</td>
                        <td className="font-medium">₹{Number(product.price).toLocaleString()}</td>
                        <td>
                          <span className={product.stock_quantity && product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}>
                            {product.stock_quantity || 0}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              product.in_stock
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {product.in_stock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/products/${product.id}/edit`}>
                              <Button variant="ghost" size="icon" className="hover:text-primary">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-destructive"
                              onClick={() => setDeleteId(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No products yet</p>
              <Link to="/admin/products/new">
                <Button className="admin-button gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Product
                </Button>
              </Link>
            </div>
          )}
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

const Package = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

export default Products;
