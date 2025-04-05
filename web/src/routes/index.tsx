import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMyCanvases, createCanvas } from '../lib/api' // Import API functions
import styles from './index.module.css'; // Import CSS Module

// Define GraphQL queries/mutations (align with backend schema)
// MOVED to lib/api.ts
/*
const GET_MY_CANVASES = gql`
  query GetMyCanvases {
    myCanvases {
      id
      title
      createdAt
    }
  }
`

const CREATE_CANVAS = gql`
  mutation CreateCanvas($title: String) {
    createCanvas(title: $title) {
      id
      title
      createdAt
    }
  }
`
*/

// Setup GraphQL Client
// MOVED to lib/api.ts
/*
// TODO: Move URL to environment variable
const gqlClient = new GraphQLClient('http://localhost:8000/graphql')
*/

// --- TanStack Query Functions ---
// MOVED to lib/api.ts
/*
const fetchMyCanvases = async () => {
  const data = await gqlClient.request<{ myCanvases: Canvas[] }>(GET_MY_CANVASES)
  return data.myCanvases
}
*/

// Interface matching the GraphQL Canvas type
// MOVED to lib/api.ts
/*
interface Canvas {
  id: string;
  title: string;
  createdAt: string; // Assuming DateTime scalar serializes to string
}
*/

// --- Route Definition ---
export const Route = createFileRoute('/')({
  component: IndexComponent,
})

// --- Component ---
function IndexComponent() {
  const queryClient = useQueryClient()
  let createError: string | null = null; // State for mutation error message

  // Fetch canvases
  const { data: canvases, isLoading: isLoadingCanvases, error: fetchError } = useQuery({
    queryKey: ['canvases'],
    queryFn: fetchMyCanvases, // Use imported function
  })

  // Mutation for creating canvases
  const { mutate: performCreateCanvas, isPending: isCreating } = useMutation({
      mutationFn: createCanvas, // Use imported function
      onSuccess: () => {
          createError = null; // Clear error on success
          // Invalidate and refetch the canvases query after creation
          queryClient.invalidateQueries({ queryKey: ['canvases'] })
      },
      onError: (err) => {
          console.error("Error creating canvas:", err)
          createError = err instanceof Error ? err.message : "Failed to create canvas.";
          // No alert, display error inline
      }
  });

  const handleCreateCanvas = () => {
    // Optional: prompt for title or use default from mutation
    // Pass explicit undefined for the optional title argument
    performCreateCanvas(undefined); // Calls the mutation function
  }

  return (
    <div className={styles.container}>
      <h2>My Canvases</h2>
      <button onClick={handleCreateCanvas} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create New Canvas'}
      </button>
      {/* Display creation error */}
      {createError && <p className={styles.errorText}>Error: {createError}</p>}

      {/* Display fetch status/results */}
      {isLoadingCanvases && <p>Loading canvases...</p>}
      {fetchError && <p className={styles.errorText}>Error loading canvases: {fetchError.message}</p>}

      {canvases && canvases.length > 0 ? (
        <ul className={styles.canvasList}>
          {canvases.map((canvas) => (
            <li key={canvas.id} className={styles.canvasItem}>
              {/* Link to canvas view page */}
              <Link
                to="/canvas/$canvasId"
                params={{ canvasId: canvas.id }}
                className={styles.canvasLink}
              >
                <span className={styles.canvasTitle}>{canvas.title}</span>
                <span className={styles.canvasMeta}>
                  (ID: {canvas.id}, Created: {new Date(canvas.createdAt).toLocaleString()})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        !isLoadingCanvases && !fetchError && <p>No canvases found. Create one!</p>
      )}
    </div>
  )
} 