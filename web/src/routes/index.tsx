import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraphQLClient, gql } from 'graphql-request'

// Define GraphQL queries/mutations (align with backend schema)
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

// Setup GraphQL Client
// TODO: Move URL to environment variable
const gqlClient = new GraphQLClient('http://localhost:8000/graphql')

// --- TanStack Query Functions ---
const fetchMyCanvases = async () => {
  const data = await gqlClient.request<{ myCanvases: Canvas[] }>(GET_MY_CANVASES)
  return data.myCanvases
}

const createNewCanvas = async (title?: string) => {
    const variables = title ? { title } : {};
    const data = await gqlClient.request<{ createCanvas: Canvas }>(CREATE_CANVAS, variables);
    return data.createCanvas;
}

// Interface matching the GraphQL Canvas type
interface Canvas {
  id: string;
  title: string;
  createdAt: string; // Assuming DateTime scalar serializes to string
}

// --- Route Definition ---
export const Route = createFileRoute('/')({
  component: IndexComponent,
})

// --- Component ---
function IndexComponent() {
  const queryClient = useQueryClient()

  // Fetch canvases
  const { data: canvases, isLoading, error } = useQuery({
    queryKey: ['canvases'],
    queryFn: fetchMyCanvases,
  })

  // Mutation for creating canvases
  const { mutate: createCanvas, isPending: isCreating } = useMutation({
      mutationFn: createNewCanvas,
      onSuccess: () => {
          // Invalidate and refetch the canvases query after creation
          queryClient.invalidateQueries({ queryKey: ['canvases'] })
      },
      onError: (err) => {
          // TODO: Add proper error handling/display
          console.error("Error creating canvas:", err)
          alert("Failed to create canvas");
      }
  });

  const handleCreateCanvas = () => {
    // Optional: prompt for title or use default from mutation
    createCanvas(); // Calls the mutation function
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>My Canvases</h2>
      <button onClick={handleCreateCanvas} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create New Canvas'}
      </button>

      {isLoading && <p>Loading canvases...</p>}
      {error && <p style={{ color: 'red' }}>Error loading canvases: {error.message}</p>}

      {canvases && canvases.length > 0 ? (
        <ul>
          {canvases.map((canvas) => (
            <li key={canvas.id}>
              {/* TODO: Link to canvas view page later */}
              {canvas.title} (ID: {canvas.id}, Created: {new Date(canvas.createdAt).toLocaleString()})
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && <p>No canvases found. Create one!</p>
      )}
    </div>
  )
} 