import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";

const CollectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    theme: "",
  });

  const [image, setImage] = useState<{ file?: File; url: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: collection } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        title: collection.title || "",
        slug: collection.slug || "",
        description: collection.description || "",
        theme: collection.theme || "",
      });
      if (collection.image_url) {
        setImage({ url: collection.image_url });
      }
    }
  }, [collection]);

  const handleImageUpload = (file: File | null) => {
    if (!file) return;
    
    setImage({
      file,
      url: URL.createObjectURL(file),
    });
  };

  const removeImage = () => {
    setImage(null);
  };

  const uploadImage = async (collectionId: string) => {
    if (!image?.file) return image?.url || null;

    const fileExt = image.file.name.split('.').pop();
    const fileName = `collections/${collectionId}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, image.file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      let collectionId = id;
      let imageUrl = image?.url;

      if (isEdit) {
        if (image?.file) {
          imageUrl = await uploadImage(collectionId!);
        }
        
        const { error } = await supabase
          .from("collections")
          .update({ ...data, image_url: imageUrl })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: newCollection, error } = await supabase
          .from("collections")
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        
        collectionId = newCollection.id;
        
        if (image?.file) {
          imageUrl = await uploadImage(collectionId);
          const { error: updateError } = await supabase
            .from("collections")
            .update({ image_url: imageUrl })
            .eq("id", collectionId);
          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.success(isEdit ? "Collection updated!" : "Collection created!");
      navigate("/admin/collections");
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
      description: formData.description || null,
      theme: formData.theme || null,
    };

    mutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/collections")}
            className="hover:bg-sidebar-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? "Edit Collection" : "Add New Collection"}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? "Update collection details" : "Create a new product collection"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="admin-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              Collection Details
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Collection Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="admin-input"
                    placeholder="e.g., Summer Collection"
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
                    placeholder="summer-collection"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                <Input
                  id="theme"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="admin-input"
                  placeholder="e.g., Seasonal, Limited Edition"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="admin-input min-h-[120px]"
                  placeholder="Describe this collection..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Collection Image */}
          <Card className="admin-card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              Collection Image
            </h2>

            <div className="space-y-4">
              {!image ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
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
              ) : (
                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-border">
                  <img
                    src={image.url}
                    alt="Collection"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={removeImage}
                    className="absolute top-4 right-4"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              )}

              {!image && (
                <div className="text-center py-4 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image uploaded yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="admin-card">
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/collections")}
                className="px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="admin-button px-8"
              >
                {mutation.isPending ? "Saving..." : isEdit ? "Update Collection" : "Create Collection"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CollectionForm;
