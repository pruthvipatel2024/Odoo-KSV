import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import RoleGuard from "./components/RoleGuard";

// Pages
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgot-password";
import Dashboard from "./pages/dashboard";
import VendorList from "./pages/vendors/vendor-list";
import VendorDetail from "./pages/vendors/vendor-detail";
import RFQList from "./pages/rfqs/rfq-list";
import RFQCreate from "./pages/rfqs/rfq-create";
import RFQDetail from "./pages/rfqs/rfq-detail";
import RFQCompare from "./pages/rfqs/rfq-compare";
import POList from "./pages/purchase-orders/po-list";
import PODetail from "./pages/purchase-orders/po-detail";
import InvoiceList from "./pages/invoices/invoice-list";
import InvoiceDetail from "./pages/invoices/invoice-detail";

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Vendors (Internal only) */}
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["ADMIN", "PROCUREMENT", "MANAGER"]}>
                <VendorList />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors/:id"
          element={
            <ProtectedRoute>
              <VendorDetail />
            </ProtectedRoute>
          }
        />

        {/* RFQs (All roles, restricted checks internally) */}
        <Route
          path="/rfqs"
          element={
            <ProtectedRoute>
              <RFQList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/create"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["ADMIN", "PROCUREMENT"]}>
                <RFQCreate />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:id"
          element={
            <ProtectedRoute>
              <RFQDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rfqs/:id/compare"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={["ADMIN", "PROCUREMENT", "MANAGER"]}>
                <RFQCompare />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Purchase Orders (All roles) */}
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute>
              <POList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders/:id"
          element={
            <ProtectedRoute>
              <PODetail />
            </ProtectedRoute>
          }
        />

        {/* Invoices (All roles) */}
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute>
              <InvoiceDetail />
            </ProtectedRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
};
export default App;
