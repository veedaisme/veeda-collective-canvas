import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMyCanvases, createCanvas, type Canvas } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { PlusCircledIcon } from "@radix-ui/react-icons"
import { formatDistanceToNow } from 'date-fns'
import { CanvasCard } from "@/components/CanvasCard"

export const Route = createFileRoute('/')({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: IndexComponent,
})

function IndexComponent() {
  const queryClient = useQueryClient()
  let createError: string | null = null;

  const { data: canvases, isLoading: isLoadingCanvases, error: fetchError } = useQuery({
    queryKey: ['canvases'],
    queryFn: fetchMyCanvases,
  })

  const { mutate: performCreateCanvas, isPending: isCreating } = useMutation({
      mutationFn: createCanvas,
      onSuccess: () => {
          createError = null;
          queryClient.invalidateQueries({ queryKey: ['canvases'] })
      },
      onError: (err) => {
          console.error("Error creating canvas:", err)
          createError = err instanceof Error ? err.message : "Failed to create canvas.";
      }
  });

  const handleCreateCanvas = () => {
    performCreateCanvas(undefined);
  }

  const showPlaceholder = !isLoadingCanvases && !fetchError && (!canvases || canvases.length === 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Canvases</h1>
          <p className="text-muted-foreground mt-1">Organize your thoughts, ideas, and knowledge in visual canvases</p>
        </div>
        <Button onClick={handleCreateCanvas} disabled={isCreating}>
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {isCreating ? 'Creating...' : 'New Canvas'}
        </Button>
      </div>

      {createError && (
        <div className="mb-6">
          <p className="text-sm text-destructive">Error: {createError}</p>
        </div>
      )}

      {isLoadingCanvases && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading canvases...</p>
        </div>
      )}

      {fetchError && (
        <div className="mb-6">
          <p className="text-sm text-destructive">Error loading canvases: {fetchError.message}</p>
        </div>
      )}

      {!isLoadingCanvases && !fetchError && (
        showPlaceholder ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed">
            <h3 className="text-lg font-semibold">No canvases found</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              You have not created any canvases yet. Get started by creating one.
            </p>
            <Button onClick={handleCreateCanvas} disabled={isCreating}>
              <PlusCircledIcon className="mr-2 h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create New Canvas'}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {canvases?.map((canvas: Canvas) => (
              <CanvasCard key={canvas.id} canvas={canvas} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
