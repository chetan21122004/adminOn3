import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

const Dashboard = () => {
  // Fetch metrics
  const { data: productsCount } = useQuery({
    queryKey: ["products-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: ordersCount } = useQuery({
    queryKey: ["orders-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: usersCount } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: revenue } = useQuery({
    queryKey: ["revenue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "delivered");
      
      const total = data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      return total;
    },
  });

  const metrics = [
    {
      title: "Total Products",
      value: productsCount || 0,
      icon: Package,
      change: "+12%",
      trending: "up" as const,
    },
    {
      title: "Total Orders",
      value: ordersCount || 0,
      icon: ShoppingCart,
      change: "+8%",
      trending: "up" as const,
    },
    {
      title: "Total Users",
      value: usersCount || 0,
      icon: Users,
      change: "+23%",
      trending: "up" as const,
    },
    {
      title: "Revenue",
      value: `₹${(revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: "+15%",
      trending: "up" as const,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to On3 Admin</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <Card key={metric.title} className="metric-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                  <h3 className="text-2xl font-bold">{metric.value}</h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <metric.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm mt-2">
                {metric.trending === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={metric.trending === "up" ? "text-green-500" : "text-red-500"}>
                  {metric.change}
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card className="admin-card">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="text-muted-foreground">
            Recent orders will be displayed here...
          </div>
        </Card>

        {/* Top Products */}
        <Card className="admin-card">
          <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
          <div className="text-muted-foreground">
            Top products will be displayed here...
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
