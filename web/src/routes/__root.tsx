import { createRootRoute, Outlet, useNavigate, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools' // Optional Devtools
import { useAuth } from '@/contexts/AuthContext'; // Use path alias
import { Button } from "@/components/ui/button"

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
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              {/* <Icons.logo className="h-6 w-6" /> Replace with actual logo if available */}
              <span className="font-bold">Veeda</span>
            </Link>
            {/* TODO: Add navigation links here if user is logged in */}
            {/* <nav className="flex items-center gap-6 text-sm">
              <Link to="/" className="text-foreground/60 hover:text-foreground/80">
                Dashboard
              </Link>
            </nav> */}
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
             {!loading && user && (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                  {/* Optionally show email: <span className="ml-2 text-xs text-muted-foreground">({user.email})</span> */}
                </Button>
             )}
             {/* Can add Login/Signup buttons here if user is NOT logged in and not on auth pages */}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      {/* Optional Router Devtools - only rendered in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
} 