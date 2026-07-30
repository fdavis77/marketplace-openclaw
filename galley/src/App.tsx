import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { OwnerRequestForm } from "./pages/OwnerRequestForm";
import { ChefApplicationForm } from "./pages/ChefApplicationForm";
import { OwnerConfirmation, ChefConfirmation } from "./pages/Confirmation";
import { AdminLogin } from "./pages/admin/Login";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { ProtectedRoute } from "./pages/admin/ProtectedRoute";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { RequestDetail } from "./pages/admin/RequestDetail";
import { ChefDetail } from "./pages/admin/ChefDetail";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="owners" element={<OwnerRequestForm />} />
            <Route path="owners/thank-you" element={<OwnerConfirmation />} />
            <Route path="chefs/apply" element={<ChefApplicationForm />} />
            <Route path="chefs/thank-you" element={<ChefConfirmation />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/requests/:id" element={<RequestDetail />} />
              <Route path="admin/chefs/:id" element={<ChefDetail />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
