import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    brand: "",
    price: "",
    original_price: "",
    discount_percent: "",
    short_description: "",
    description: "",
    category_id: "",
    collection_id: "",
    stock_quantity: "",
    in_stock: true,
    featured: false,
  });

  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        slug: product.slug || "",
        brand: product.brand || "",
        price: product.price?.toString() || "",
        original_price: product.original_price?.toString() || "",
        discount_percent: product.discount_percent?.toString() || "",
        short_description: product.short_description || "",
        description: product.description || "",
        category_id: product.category_id || "",
        collection_id: product.collection_id || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        in_stock: product.in_stock ?? true,
        featured: product.featured ?? false,
      });
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        const { error } = await supabase
          .from("products")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(isEdit ? "Product updated!" : "Product created!");
      navigate("/admin/products");
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title: formData.title,
      slug: formData.slug,
      brand: formData.brand || null,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : null,
      short_description: formData.short_description || null,
      description: formData.description || null,
      category_id: formData.category_id || null,
      collection_id: formData.collection_id || null,
      stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
      in_stock: formData.in_stock,
      featured: formData.featured,
    };

    mutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? "Update product details" : "Create a new product"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="original_price">Original Price (₹)</Label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_percent">Discount %</Label>
              <Input
                id="discount_percent"
                type="number"
                step="0.01"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Select
                value={formData.collection_id}
                onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections?.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="in_stock">In Stock</Label>
                <Switch
                  id="in_stock"
                  checked={formData.in_stock}
                  onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Textarea
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="admin-button"
            >
              {mutation.isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductForm;
