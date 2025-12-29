import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import NewDashboardPage from "./pages/NewDashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ProductsPage } from "./pages/ProductsPage";
import { DeliveriesPage } from "./pages/DeliveriesPage";
import { AddCustomerPage } from "./pages/AddCustomerPage";
import { EditCustomerPage } from "./pages/EditCustomerPage";
import { AddProductPage } from "./pages/AddProductPage";
import { EditProductPage } from "./pages/EditProductPage";
import NewDeliveryPage from "./pages/NewDeliveryPage";
import { EditDeliveryPage } from "./pages/EditDeliveryPage";
import { CustomerSearchPage } from "./pages/CustomerSearchPage";
import QuickQuotePage from "./pages/QuickQuotePage";
import { Sidebar } from "./components/Sidebar";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row" dir="rtl">
      <main className="flex-1 p-4 lg:p-8 lg:mr-64 mt-16 lg:mt-0">
        <Routes>
          <Route path="/" element={<NewDashboardPage />} />
          <Route path="/dashboard" element={<NewDashboardPage />} />
          <Route path="/dashboard-search" element={<CustomerSearchPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<AddCustomerPage />} />
          <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<AddProductPage />} />
          <Route path="/products/:id/edit" element={<EditProductPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/deliveries/new" element={<NewDeliveryPage />} />
          <Route path="/deliveries/:id/edit" element={<EditDeliveryPage />} />
          <Route path="/quick-quote" element={<QuickQuotePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Sidebar />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
