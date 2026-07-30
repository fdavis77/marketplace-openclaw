import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center text-navy/60">Loading…</div>;
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
