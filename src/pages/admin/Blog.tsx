import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Blog() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*, users(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete blog post");
      console.error(error);
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blog Posts</h1>
            <p className="text-muted-foreground mt-1">Manage your blog content</p>
          </div>
          <Link to="/admin/blog/new">
            <Button className="admin-button">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading blog posts...</p>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="admin-card text-center py-12">
            <p className="text-muted-foreground mb-4">No blog posts yet</p>
            <Link to="/admin/blog/new">
              <Button className="admin-button">
                <Plus className="h-4 w-4 mr-2" />
                Create your first post
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div key={post.id} className="admin-card">
                <div className="flex gap-4">
                  {post.banner_image && (
                    <img
                      src={post.banner_image}
                      alt={post.title}
                      className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-2 truncate">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      By {post.users?.full_name || post.users?.email || "Unknown"} •{" "}
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-muted-foreground line-clamp-2">
                      {post.content.substring(0, 200)}...
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to={`/admin/blog/${post.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
