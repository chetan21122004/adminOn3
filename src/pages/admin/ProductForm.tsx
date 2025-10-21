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
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";

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

  const [images, setImages] = useState<Array<{ file?: File; url: string; isPrimary: boolean; id?: string }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

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

  const { data: existingImages } = useQuery({
    queryKey: ["product-images", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
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

  useEffect(() => {
    if (existingImages) {
      setImages(existingImages.map(img => ({
        url: img.image_url,
        isPrimary: img.is_primary,
        id: img.id
      })));
    }
  }, [existingImages]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0
    }));

    setImages([...images, ...newImages]);
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    if (image.id) {
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);
      
      if (error) {
        toast.error("Failed to delete image");
        return;
      }
    }
    
    const newImages = images.filter((_, i) => i !== index);
    if (image.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    setImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    setImages(images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const uploadImages = async (productId: string) => {
    const imagesToUpload = images.filter(img => img.file);
    
    for (const image of imagesToUpload) {
      if (!image.file) continue;
      
      const fileExt = image.file.name.split('.').pop();
      const fileName = `${productId}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: publicUrl,
          is_primary: image.isPrimary,
          alt_text: formData.title
        });

      if (dbError) throw dbError;
    }

    // Update existing images primary status
    for (const image of images.filter(img => img.id)) {
      const { error } = await supabase
        .from("product_images")
        .update({ is_primary: image.isPrimary })
        .eq("id", image.id);
      
      if (error) throw error;
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      let productId = id;
      
      if (isEdit) {
        const { error } = await supabase
          .from("products")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        productId = newProduct.id;
      }

      await uploadImages(productId);
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/products")}
            className="hover:bg-sidebar-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? "Update product details" : "Fill in the details to create a new product"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="admin-card">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">Product Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="admin-input"
                        placeholder="Enter product title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug" className="text-sm font-medium">URL Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="admin-input"
                        placeholder="product-url-slug"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="admin-input"
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description" className="text-sm font-medium">Short Description</Label>
                    <Textarea
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      className="admin-input min-h-[80px]"
                      placeholder="Brief product description (2-3 lines)"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Full Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="admin-input min-h-[160px]"
                      placeholder="Detailed product description, features, specifications..."
                      rows={6}
                    />
                  </div>
                </div>
              </Card>

              {/* Pricing */}
              <Card className="admin-card">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  Pricing
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Current Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="admin-input"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_price" className="text-sm font-medium">Original Price (₹)</Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      className="admin-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_percent" className="text-sm font-medium">Discount %</Label>
                    <Input
                      id="discount_percent"
                      type="number"
                      step="0.01"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      className="admin-input"
                      placeholder="0"
                    />
                  </div>
                </div>
              </Card>

              {/* Product Images */}
              <Card className="admin-card">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  Product Images
                </h2>
                
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Image Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            image.isPrimary ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!image.isPrimary && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setPrimaryImage(index)}
                                className="text-xs"
                              >
                                Set Primary
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {images.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No images uploaded yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - Organization & Settings */}
            <div className="space-y-6">
              {/* Organization */}
              <Card className="admin-card">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  Organization
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger className="admin-input">
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
                    <Label htmlFor="collection" className="text-sm font-medium">Collection</Label>
                    <Select
                      value={formData.collection_id}
                      onValueChange={(value) => setFormData({ ...formData, collection_id: value })}
                    >
                      <SelectTrigger className="admin-input">
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
                </div>
              </Card>

              {/* Inventory */}
              <Card className="admin-card">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <div className="h-8 w-1 bg-primary rounded-full" />
                  Inventory
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity" className="text-sm font-medium">Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="admin-input"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <Label htmlFor="in_stock" className="text-sm font-medium cursor-pointer">In Stock</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Product is available for purchase</p>
                    </div>
                    <Switch
                      id="in_stock"
                      checked={formData.in_stock}
                      onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <Label htmlFor="featured" className="text-sm font-medium cursor-pointer">Featured Product</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Show on homepage</p>
                    </div>
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <Card className="admin-card">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/products")}
                className="px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="admin-button px-8"
              >
                {mutation.isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductForm;
