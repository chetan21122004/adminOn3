import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect } from "react";

interface CodeFormData {
  code: string;
  discount_percent: number;
  is_active: boolean;
  valid_from: string;
  valid_to: string;
}

export default function CodeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { register, handleSubmit, setValue, watch } = useForm<CodeFormData>({
    defaultValues: {
      is_active: true,
      valid_from: new Date().toISOString().split("T")[0],
    },
  });

  const isActive = watch("is_active");

  const { data: code, isLoading } = useQuery({
    queryKey: ["discount-code", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (code) {
      setValue("code", code.code);
      setValue("discount_percent", code.discount_percent);
      setValue("is_active", code.is_active);
      setValue("valid_from", code.valid_from ? new Date(code.valid_from).toISOString().split("T")[0] : "");
      setValue("valid_to", code.valid_to ? new Date(code.valid_to).toISOString().split("T")[0] : "");
    }
  }, [code, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: CodeFormData) => {
      const payload = {
        code: data.code.toUpperCase(),
        discount_percent: data.discount_percent,
        is_active: data.is_active,
        valid_from: data.valid_from ? new Date(data.valid_from).toISOString() : null,
        valid_to: data.valid_to ? new Date(data.valid_to).toISOString() : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("discount_codes")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("discount_codes")
          .insert(payload);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Code updated successfully" : "Code created successfully");
      navigate("/admin/codes");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save discount code");
    },
  });

  const onSubmit = (data: CodeFormData) => {
    if (data.discount_percent < 0 || data.discount_percent > 100) {
      toast.error("Discount percent must be between 0 and 100");
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
      <div className="max-w-3xl">
        <Link
          to="/admin/codes"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Codes
        </Link>

        <div className="admin-card">
          <h1 className="text-2xl font-bold mb-6">
            {isEditing ? "Edit Discount Code" : "Create Discount Code"}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                {...register("code", { required: true })}
                placeholder="SUMMER2024"
                className="admin-input uppercase"
              />
              <p className="text-sm text-muted-foreground">
                Enter a unique code (will be converted to uppercase)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_percent">Discount Percentage *</Label>
              <Input
                id="discount_percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register("discount_percent", { required: true, valueAsNumber: true })}
                placeholder="10"
                className="admin-input"
              />
              <p className="text-sm text-muted-foreground">
                Enter discount percentage (0-100)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="date"
                  {...register("valid_from")}
                  className="admin-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_to">Valid To</Label>
                <Input
                  id="valid_to"
                  type="date"
                  {...register("valid_to")}
                  className="admin-input"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setValue("is_active", checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="admin-button" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : isEditing ? "Update Code" : "Create Code"}
              </Button>
              <Link to="/admin/codes">
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
