import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Codes() {
  const queryClient = useQueryClient();

  const { data: codes, isLoading } = useQuery({
    queryKey: ["discount-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("discount_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      toast.success("Discount code deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete discount code");
      console.error(error);
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this discount code?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Discount Codes</h1>
            <p className="text-muted-foreground mt-1">Manage your discount codes and promotions</p>
          </div>
          <Link to="/admin/codes/new">
            <Button className="admin-button">
              <Plus className="h-4 w-4 mr-2" />
              New Code
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading discount codes...</p>
          </div>
        ) : !codes || codes.length === 0 ? (
          <div className="admin-card text-center py-12">
            <p className="text-muted-foreground mb-4">No discount codes yet</p>
            <Link to="/admin/codes/new">
              <Button className="admin-button">
                <Plus className="h-4 w-4 mr-2" />
                Create your first code
              </Button>
            </Link>
          </div>
        ) : (
          <div className="admin-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Status</th>
                  <th>Valid From</th>
                  <th>Valid To</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => {
                  const isExpired = code.valid_to && new Date(code.valid_to) < new Date();
                  const isActive = code.is_active && !isExpired;

                  return (
                    <tr key={code.id}>
                      <td className="font-mono font-medium">{code.code}</td>
                      <td>{code.discount_percent}%</td>
                      <td>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={isActive ? "bg-primary" : ""}
                        >
                          {isExpired ? "Expired" : code.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td>{formatDate(code.valid_from)}</td>
                      <td>{formatDate(code.valid_to)}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/codes/${code.id}`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(code.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
