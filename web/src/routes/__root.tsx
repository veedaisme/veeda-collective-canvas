import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools' // Optional Devtools
import styles from './__root.module.css'; // Import CSS Module

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <h1>Veeda MVP</h1>
        {/* TODO: Add navigation links here later (e.g., using <Link> from TanStack Router) */}
        {/* <nav>
          <Link to="/">Home</Link> <Link to="/about">About</Link>
        </nav> */}
      </header>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      {/* Optional Router Devtools - only rendered in development */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  )
} 