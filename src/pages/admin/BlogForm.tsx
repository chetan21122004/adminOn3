import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  banner_image: string;
}

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const { register, handleSubmit, setValue, watch } = useForm<BlogFormData>();

  const title = watch("title");

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (post) {
      setValue("title", post.title);
      setValue("slug", post.slug);
      setValue("content", post.content);
      setValue("banner_image", post.banner_image || "");
    }
  }, [post, setValue]);

  useEffect(() => {
    if (title && !isEditing) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  }, [title, isEditing, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      if (!user) throw new Error("Not authenticated");

      const payload = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        banner_image: data.banner_image || null,
        author_id: user.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("blogs")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("blogs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Post updated successfully" : "Post created successfully");
      navigate("/admin/blog");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save blog post");
    },
  });

  const onSubmit = (data: BlogFormData) => {
    if (!data.title || !data.slug || !data.content) {
      toast.error("Please fill in all required fields");
      return;
    }
    saveMutation.mutate(data);
  };

  if (isEditing && isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <Link
          to="/admin/blog"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        <div className="admin-card">
          <h1 className="text-2xl font-bold mb-6">
            {isEditing ? "Edit Blog Post" : "Create Blog Post"}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title", { required: true })}
                placeholder="Enter post title"
                className="admin-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register("slug", { required: true })}
                placeholder="post-url-slug"
                className="admin-input"
              />
              <p className="text-sm text-muted-foreground">
                Auto-generated from title, or customize it
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_image">Banner Image URL</Label>
              <Input
                id="banner_image"
                {...register("banner_image")}
                placeholder="https://example.com/image.jpg"
                className="admin-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                {...register("content", { required: true })}
                placeholder="Write your blog post content here..."
                className="admin-input min-h-[300px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="admin-button" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : isEditing ? "Update Post" : "Create Post"}
              </Button>
              <Link to="/admin/blog">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
