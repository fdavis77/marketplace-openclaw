import { Link, Outlet, useNavigate } from "react-router-dom";
import { APP_NAME } from "../../config";
import { signOut } from "../../services/auth";
import { Button } from "../../components/Button";

export function AdminLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-linen">
      <header className="border-b border-navy/10 bg-navy text-linen">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="font-display text-lg">
            {APP_NAME} · Concierge console
          </Link>
          <Button variant="ghost" onClick={handleSignOut} className="text-linen hover:bg-linen/10">
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
