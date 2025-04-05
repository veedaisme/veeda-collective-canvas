import { useState, useEffect } from 'react'; // Import hooks
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCanvasById, updateCanvasTitle, Canvas } from '../lib/api' // Import update function and type
import styles from './canvas.$canvasId.module.css';

// --- Route Definition ---
// Loader function to fetch data before the component renders
const loader = async ({ params }: { params: { canvasId: string } }) => {
  // Use queryClient from the router context for prefetching (optional but good practice)
  // const queryClient = Route.router.options.context.queryClient; // Get query client
  // await queryClient.prefetchQuery({ queryKey: ['canvas', params.canvasId], queryFn: () => fetchCanvasById(params.canvasId) })

  const canvas = await fetchCanvasById(params.canvasId);
  if (!canvas) {
    // TODO: Could redirect to a 404 page or throw a specific error
    throw new Error('Canvas not found');
  }
  return canvas;
};

export const Route = createFileRoute('/canvas/$canvasId')({
  component: CanvasViewComponent,
  loader: loader, // Use loader to fetch data
  errorComponent: CanvasErrorComponent, // Component to show on loader error
})

// --- Components ---

function CanvasViewComponent() {
  const initialCanvas = Route.useLoaderData(); // Get initial data from loader
  const { canvasId } = Route.useParams(); // Get canvasId from route params
  const queryClient = useQueryClient();

  // State for editing mode and the input value
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(initialCanvas.title);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Effect to reset editTitle if initialCanvas data changes (e.g., cache update)
  useEffect(() => {
    setEditTitle(initialCanvas.title);
  }, [initialCanvas.title]);

  // Mutation for updating title
  const { mutate: performUpdateTitle, isPending: isUpdating } = useMutation({
      mutationFn: updateCanvasTitle,
      // Optimistic update (optional but improves perceived performance)
      // onMutate: async (newData) => {
      //     await queryClient.cancelQueries({ queryKey: ['canvas', canvasId] })
      //     const previousCanvas = queryClient.getQueryData<Canvas>(['canvas', canvasId])
      //     queryClient.setQueryData<Canvas>(['canvas', canvasId], old => old ? { ...old, title: newData.title } : undefined)
      //     return { previousCanvas }
      // },
      // onError: (err, _newData, context) => {
      //     queryClient.setQueryData(['canvas', canvasId], context?.previousCanvas)
      //     setUpdateError(err instanceof Error ? err.message : "Failed to update title.");
      // },
      onSuccess: (updatedData) => {
        setUpdateError(null);
        // Update the query cache with the new data from the server response
        queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) =>
          oldData ? { ...oldData, ...updatedData } : undefined
        );
        // Also invalidate the list query to update title there too
        queryClient.invalidateQueries({ queryKey: ['canvases'] });
        setIsEditing(false); // Exit editing mode on success
      },
       onError: (err) => {
          // Handle non-optimistic error
          setUpdateError(err instanceof Error ? err.message : "Failed to update title.");
      },
      // Always refetch after error or success to ensure consistency
      // settled: () => {
      //   queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] })
      // }
  });

  const handleEditToggle = () => {
    if (isEditing) {
        // If cancelling, reset input to original title
        setEditTitle(initialCanvas.title);
        setUpdateError(null); // Clear any previous errors
    }
    setIsEditing(!isEditing);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() === initialCanvas.title) {
        // No change, just exit editing mode
        setIsEditing(false);
        setUpdateError(null);
        return;
    }
    performUpdateTitle({ id: canvasId, title: editTitle.trim() });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(event.target.value);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        handleTitleSave();
    } else if (event.key === 'Escape') {
        handleEditToggle(); // Use toggle logic to reset/cancel
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/">&laquo; Back to Canvases</Link>

      <div className={styles.titleContainer}>
        {isEditing ? (
            <input
                type="text"
                value={editTitle}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                disabled={isUpdating}
                autoFocus
                className={styles.titleInput}
            />
        ) : (
            <h2 className={styles.title} onClick={() => setIsEditing(true)} title="Click to edit">{initialCanvas.title}</h2>
        )}
        {isEditing ? (
            <>
                <button onClick={handleTitleSave} disabled={isUpdating || !editTitle.trim()} className={styles.saveButton}>
                    {isUpdating ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleEditToggle} disabled={isUpdating} className={styles.cancelButton}>
                    Cancel
                </button>
            </>
        ) : (
            <button onClick={handleEditToggle} className={styles.editButton} title="Edit title">
                ✏️
            </button>
        )}
      </div>
      {updateError && <p className={styles.errorText}>Error: {updateError}</p>}

      <p className={styles.meta}>ID: {initialCanvas.id}</p>
      <p className={styles.meta}>Created: {new Date(initialCanvas.createdAt).toLocaleString()}</p>
      <p className={styles.meta}>Last Updated: {new Date(initialCanvas.updatedAt).toLocaleString()}</p>
      <p className={styles.meta}>Public: {initialCanvas.isPublic ? 'Yes' : 'No'}</p>

      <div className={styles.canvasArea}>
        {/* TODO: Implement actual canvas rendering using react-flow here */}
        <p style={{ textAlign: 'center', padding: '2rem', border: '1px dashed grey' }}>
            Canvas Area (Blocks will go here)
        </p>
      </div>
    </div>
  )
}

// Simple component to display loading errors from the loader
function CanvasErrorComponent({ error }: { error: Error }) {
    return (
        <div className={styles.container} style={{ color: 'red' }}>
            <Link to="/">&laquo; Back to Canvases</Link>
            <h2>Error Loading Canvas</h2>
            <p>{error?.message ?? 'An unknown error occurred.'}</p>
        </div>
    );
} 