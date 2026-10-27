import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { OwnerLayout } from "./layouts/OwnerLayout";
import { StaffLayout } from "./layouts/StaffLayout";
import { homeFor, useAuth } from "./lib/auth";
import type { Role } from "./lib/types";
import { AdminAI } from "./pages/admin/AdminAI";
import { AdminAnnouncements } from "./pages/admin/AdminAnnouncements";
import { AdminSystemSettings } from "./pages/admin/AdminSystem";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminShops } from "./pages/admin/AdminShops";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { Login, Register } from "./pages/auth/Auth";
import { OAuthCallback } from "./pages/auth/OAuthCallback";
import { PrintPage } from "./pages/PrintPage";
import { Landing } from "./pages/landing/Landing";
import { OwnerBroadcast } from "./pages/owner/OwnerBroadcast";
import { OwnerInbox } from "./pages/owner/OwnerInbox";
import { OwnerOrders } from "./pages/owner/OwnerOrders";
import { OwnerOverview } from "./pages/owner/OwnerOverview";
import { OwnerProducts } from "./pages/owner/OwnerProducts";
import { OwnerSettings } from "./pages/owner/OwnerSettings";
import { OwnerOAuthCallback } from "./pages/owner/OwnerOAuthCallback";
import { StaffChat, StaffHelp, StaffOrders, StaffProducts, StaffProfile } from "./pages/staff/StaffPages";



function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted">Loading…</div>;
  if (!user) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/print/:orderId" element={<RequireRole roles={["owner", "staff"]}><PrintPage /></RequireRole>} />

      <Route path="/admin" element={<RequireRole roles={["super_admin"]}><AdminLayout /></RequireRole>}>
        <Route index element={<AdminDashboard />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="ai" element={<AdminAI />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="settings" element={<AdminSystemSettings />} />
        <Route path="logs" element={<AdminSystemSettings defaultTab="logs" />} />
      </Route>

      <Route path="/owner" element={<RequireRole roles={["owner"]}>
        <OwnerLayout />
      </RequireRole>}>
        <Route index element={<OwnerOverview />} />
        <Route path="inbox" element={<OwnerInbox />} />
        <Route path="products" element={<OwnerProducts />} />
        <Route path="orders" element={<OwnerOrders />} />
        <Route path="broadcast" element={<OwnerBroadcast />} />
        <Route path="settings" element={<OwnerSettings />} />
        <Route path="settings/callback" element={<OwnerOAuthCallback />} />
      </Route>

      <Route path="/staff" element={<RequireRole roles={["staff", "owner"]}><StaffLayout /></RequireRole>}>
        <Route index element={<StaffChat />} />
        <Route path="products" element={<StaffProducts />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="profile" element={<StaffProfile />} />
        <Route path="help" element={<StaffHelp />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

