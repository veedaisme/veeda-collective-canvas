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

// --- API Functions ---

export const fetchMyCanvases = async (): Promise<Canvas[]> => {
  // TODO: Add authentication headers when implemented
  const data = await gqlClient.request<{ myCanvases: Canvas[] }>(
    GET_MY_CANVASES_QUERY
  );
  return data.myCanvases;
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

// Add other API functions here (e.g., updateCanvasTitle, fetchCanvasById, etc.) 