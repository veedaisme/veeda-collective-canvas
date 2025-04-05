import { GraphQLClient, gql } from 'graphql-request'

// --- GraphQL Client Setup ---
const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;

if (!endpoint) {
    throw new Error("VITE_GRAPHQL_ENDPOINT environment variable not set.");
}

const gqlClient = new GraphQLClient(endpoint);

// --- Types (Manual for now, consider codegen later) ---
export interface Canvas {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string; // DateTime scalar serialized as ISO string
  updatedAt: string;
}

// --- GraphQL Operations ---

// QUERIES
const GET_MY_CANVASES_QUERY = gql`
  query GetMyCanvases {
    myCanvases {
      id
      title
      isPublic
      createdAt
      updatedAt
    }
  }
`;

const GET_CANVAS_BY_ID_QUERY = gql`
  query GetCanvasById($id: ID!) {
    canvas(id: $id) {
      id
      title
      isPublic
      createdAt
      updatedAt
      # TODO: Add blocks and connections here later
    }
  }
`;

// MUTATIONS
const CREATE_CANVAS_MUTATION = gql`
  mutation CreateCanvas($title: String) {
    createCanvas(title: $title) {
      id
      title
      isPublic
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_CANVAS_TITLE_MUTATION = gql`
    mutation UpdateCanvasTitle($id: ID!, $title: String!) {
        updateCanvasTitle(id: $id, title: $title) {
            id # Return minimal fields needed for cache update
            title
            updatedAt
        }
    }
`;

// --- API Functions ---

export const fetchMyCanvases = async (): Promise<Canvas[]> => {
  // TODO: Add authentication headers when implemented
  const data = await gqlClient.request<{ myCanvases: Canvas[] }>(
    GET_MY_CANVASES_QUERY
  );
  return data.myCanvases;
};

export const fetchCanvasById = async (id: string): Promise<Canvas | null> => {
    // TODO: Add authentication headers when implemented
    try {
        const data = await gqlClient.request<{ canvas: Canvas | null }>(
            GET_CANVAS_BY_ID_QUERY,
            { id }
        );
        return data.canvas;
    } catch (error) {
        // Handle cases where the backend throws an error (e.g., not found, unauthorized)
        // For now, return null, but could be more specific based on error type
        console.error(`Error fetching canvas ${id}:`, error);
        return null;
    }
};

export const createCanvas = async (title?: string): Promise<Canvas> => {
    // TODO: Add authentication headers when implemented
    const variables = title ? { title } : {};
    const data = await gqlClient.request<{ createCanvas: Canvas }>(
        CREATE_CANVAS_MUTATION,
        variables
    );
    return data.createCanvas;
};

export const updateCanvasTitle = async (variables: { id: string; title: string }): Promise<Pick<Canvas, 'id' | 'title' | 'updatedAt'>> => {
    // TODO: Add authentication headers when implemented
    if (!variables.title?.trim()) {
        throw new Error("Title cannot be empty"); // Basic client-side validation
    }
    const data = await gqlClient.request<{ updateCanvasTitle: Pick<Canvas, 'id' | 'title' | 'updatedAt'> }>(
        UPDATE_CANVAS_TITLE_MUTATION,
        variables
    );
    return data.updateCanvasTitle;
};

// Add other API functions here (e.g., fetchCanvasById, etc.) 