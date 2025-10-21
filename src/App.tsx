import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import Collections from "./pages/admin/Collections";
import CollectionForm from "./pages/admin/CollectionForm";
import Codes from "./pages/admin/Codes";
import CodeForm from "./pages/admin/CodeForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminGuard><Dashboard /></AdminGuard>} />
            <Route path="/admin/products" element={<AdminGuard><Products /></AdminGuard>} />
            <Route path="/admin/products/new" element={<AdminGuard><ProductForm /></AdminGuard>} />
            <Route path="/admin/products/:id" element={<AdminGuard><ProductForm /></AdminGuard>} />
            <Route path="/admin/collections" element={<AdminGuard><Collections /></AdminGuard>} />
            <Route path="/admin/collections/new" element={<AdminGuard><CollectionForm /></AdminGuard>} />
            <Route path="/admin/collections/:id" element={<AdminGuard><CollectionForm /></AdminGuard>} />
            <Route path="/admin/codes" element={<AdminGuard><Codes /></AdminGuard>} />
            <Route path="/admin/codes/new" element={<AdminGuard><CodeForm /></AdminGuard>} />
            <Route path="/admin/codes/:id" element={<AdminGuard><CodeForm /></AdminGuard>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
