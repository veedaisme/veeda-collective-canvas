import { createRootRoute, Outlet, useNavigate, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools' // Optional Devtools
import { useAuth } from '@/contexts/AuthContext'; // Use path alias
import { Button } from "@/components/ui/button"
import { MenuBar } from "@/components/MenuBar"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { user, signOut, loading } = useAuth(); // Get auth state and signOut function
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to login page after sign out
      navigate({ to: '/login' });
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show an error message to the user
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <MenuBar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      {/* Optional Router Devtools - only rendered in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
}
