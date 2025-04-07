import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMyCanvases, createCanvas, type Canvas } from '@/lib/api' // Use path alias, import Canvas type
// Remove CSS module import
// import styles from './index.module.css';
import { supabase } from '@/lib/supabaseClient'; // Use path alias
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { PlusCircledIcon } from "@radix-ui/react-icons" // Icon for create button
import { formatDistanceToNow } from 'date-fns' // For relative dates

// --- Route Definition ---
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

// --- Component ---
function IndexComponent() {
  const queryClient = useQueryClient()
  // TODO: Use React state for createError to ensure UI updates correctly
  let createError: string | null = null;

  const { data: canvases, isLoading: isLoadingCanvases, error: fetchError } = useQuery({
    queryKey: ['canvases'],
    queryFn: fetchMyCanvases,
  })

  const { mutate: performCreateCanvas, isPending: isCreating } = useMutation({
      mutationFn: createCanvas,
      onSuccess: () => {
          createError = null; // Needs state setter for UI update
          queryClient.invalidateQueries({ queryKey: ['canvases'] })
      },
      onError: (err) => {
          console.error("Error creating canvas:", err)
          createError = err instanceof Error ? err.message : "Failed to create canvas."; // Needs state setter for UI update
      }
  });

  const handleCreateCanvas = () => {
    performCreateCanvas(undefined);
  }

  // Determine if placeholder should be shown
  const showPlaceholder = !isLoadingCanvases && !fetchError && (!canvases || canvases.length === 0);

  return (
    // Use flex column layout for the whole component area
    <div className="container max-w-screen-2xl py-6 flex flex-col flex-grow gap-6">
      {/* Header section with Title and Create Button */}
      <div className="flex items-center justify-between flex-shrink-0"> {/* Prevent header from growing */}
        <h2 className="text-2xl font-semibold tracking-tight">My Canvases</h2>
        <Button onClick={handleCreateCanvas} disabled={isCreating} size="sm">
           <PlusCircledIcon className="mr-2 h-4 w-4" />
           {isCreating ? 'Creating...' : 'Create New Canvas'}
        </Button>
      </div>

      {/* Display creation error */}
      {createError && <p className="text-sm text-destructive flex-shrink-0">{/* Prevent error from growing */}Error: {createError}</p>}

      {/* Display fetch status/results */}
      {isLoadingCanvases && <p className="text-sm text-muted-foreground flex-shrink-0">{/* Prevent loading from growing */}Loading canvases...</p>}
      {fetchError && <p className="text-sm text-destructive flex-shrink-0">{/* Prevent error from growing */}Error loading canvases: {fetchError.message}</p>}

      {/* Wrapper Div for Content (List or Placeholder) - This will grow */}
      <div
        className={`flex-grow ${showPlaceholder ? 'flex flex-col items-center justify-center' : ''}`}
      >
        {!isLoadingCanvases && !fetchError && (
          showPlaceholder ? (
              // Placeholder when no canvases exist (centering handled by parent)
              <div className="rounded-lg border border-dashed p-8 text-center"> {/* Remove centering & min-h here */}
                <h3 className="mt-4 text-lg font-semibold">No canvases found</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                   You have not created any canvases yet. Get started by creating one.
                 </p>
                 <Button onClick={handleCreateCanvas} disabled={isCreating} size="sm">
                     <PlusCircledIcon className="mr-2 h-4 w-4" />
                    {isCreating ? 'Creating...' : 'Create New Canvas'}
                  </Button>
              </div>
            ) : (
              // Grid for displaying canvas cards
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {canvases?.map((canvas: Canvas) => ( // Add optional chaining just in case
                   <Card key={canvas.id}>
                     <CardHeader>
                        <CardTitle className="truncate">{canvas.title || 'Untitled Canvas'}</CardTitle>
                        <CardDescription>
                          Created {formatDistanceToNow(new Date(canvas.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                         <Link
                          to="/canvas/$canvasId"
                          params={{ canvasId: canvas.id }}
                          className="w-full"
                         >
                           <Button variant="outline" size="sm" className="w-full">Open</Button>
                         </Link>
                      </CardFooter>
                   </Card>
                ))}
              </div>
            )
        )}
      </div> {/* End of growing wrapper */}
    </div> // End of main component div
  )
}