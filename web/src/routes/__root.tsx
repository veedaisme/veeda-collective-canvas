import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools' // Optional Devtools

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      {/* Basic Layout Placeholder */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <h1>Veeda MVP</h1>
        {/* Add navigation links here later */}
      </div>
      <hr />
      <Outlet />
      {/* Optional Router Devtools */}
      <TanStackRouterDevtools />
    </>
  )
} 