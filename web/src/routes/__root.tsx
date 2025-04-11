import { MenuBar } from "@/components/MenuBar";
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools'; // Optional Devtools

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
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
