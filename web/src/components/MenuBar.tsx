import { Link, useRouter } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import React, { useState, useRef, useEffect } from "react"
import { PersonIcon } from '@radix-ui/react-icons'

export function MenuBar() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = router.state.location.pathname

  // Custom dropdown state
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await signOut()
    router.navigate({ to: '/login' })
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl">
            Veeda
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              to="/"
              className={pathname === "/" ? "font-medium" : "text-muted-foreground"}
            >
              Dashboard
            </Link>
            {/* <Link
              to="/explore"
              className={pathname === "/explore" ? "font-medium" : "text-muted-foreground"}
            >
              Explore
            </Link> */}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {!loading && user && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 flex items-center justify-center"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="User menu"
              >
                <PersonIcon className="h-6 w-6" />
                <span className="sr-only">User menu</span>
              </Button>
              {open && (
                <div className="absolute right-0 mt-2 w-40 rounded-md bg-white shadow-lg border z-50 py-1">
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" tabIndex={0}>
                    Profile
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" tabIndex={0}>
                    Settings
                  </button>
                  <div className="my-1 border-t" />
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={handleLogout}
                    tabIndex={0}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
