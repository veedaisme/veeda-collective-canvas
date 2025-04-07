import { GraphQLClient, gql } from 'graphql-request'
import { supabase } from './supabaseClient'; // Import the frontend supabase client

// --- GraphQL Client Setup ---
const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;

if (!endpoint) {
    throw new Error("VITE_GRAPHQL_ENDPOINT environment variable not set.");
}

// Initialize GraphQLClient without default headers
const gqlClient = new GraphQLClient(endpoint);

// Function to make authenticated requests
const makeAuthenticatedRequest = async <T, V = Record<string, any>>(
    query: string,
    variables?: V
): Promise<T> => {
    let token: string | null = null;
    // Get the current session/token from Supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || null;

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request with dynamic headers
    return gqlClient.request<T, V>(query, variables, headers);
};

// --- Types (Manual for now, consider codegen later) ---
// Add Block Type
export interface Block {
    id: string;
    canvasId: string;
    type: string;
    content: any; // JSON
    position: { x: number; y: number }; // JSON
    size: { width: number; height: number }; // JSON
    createdAt: string; // DateTime
    updatedAt: string; // DateTime
}

export interface Canvas {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string; // DateTime scalar serialized as ISO string
  updatedAt: string;
  blocks?: Block[]; // Add blocks relation (optional as it might not always be fetched)
}

// Add Connection type
export interface Connection {
    id: string;
    // canvasId: string; // Usually not needed directly on frontend edge
    sourceBlockId: string;
    targetBlockId: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    // Add other fields like label, style if defined in GraphQL
}

export interface CanvasData extends Canvas {
    blocks: Block[];
    connections: Connection[]; // Add connections
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
      # Note: blocks are not fetched in the list view for performance
    }
  }
`;

// Updated query to fetch blocks as well
const GET_CANVAS_BY_ID_QUERY = gql`
  query GetCanvasById($id: ID!) {
    canvas(id: $id) {
      id
      title
      isPublic
      createdAt
      updatedAt
      blocks {
          id
          canvasId
          type
          content
          position
          size
          createdAt
          updatedAt
      }
      connections {
          id
          sourceBlockId
          targetBlockId
          sourceHandle
          targetHandle
      }
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
            id
            title
            updatedAt
        }
    }
`;

// Add block mutations
const CREATE_BLOCK_MUTATION = gql`
    mutation CreateBlock($canvasId: ID!, $type: String!, $position: Json!, $content: Json) {
        createBlock(canvasId: $canvasId, type: $type, position: $position, content: $content) {
            id
            canvasId
            type
            content
            position
            size
            createdAt
            updatedAt
        }
    }
`;

const UNDO_BLOCK_CREATION_MUTATION = gql`
    mutation UndoBlockCreation($blockId: ID!) {
        undoBlockCreation(blockId: $blockId)
    }
`;

const UPDATE_BLOCK_POSITION_MUTATION = gql`
    mutation UpdateBlockPosition($blockId: ID!, $position: Json!) {
        updateBlockPosition(blockId: $blockId, position: $position) {
            id # Return minimal data needed for potential cache update
            position
            updatedAt
        }
    }
`;

const UPDATE_BLOCK_CONTENT_MUTATION = gql`
    mutation UpdateBlockContent($blockId: ID!, $content: Json!) {
        updateBlockContent(blockId: $blockId, content: $content) {
            id # Return fields needed for cache update
            content
            updatedAt
        }
    }
`;

// --- API Functions ---

export const fetchMyCanvases = async (): Promise<Canvas[]> => {
    // Use the authenticated request function
    const data = await makeAuthenticatedRequest<{ myCanvases: Canvas[] }>(GET_MY_CANVASES_QUERY);
    return data.myCanvases;
};

export const fetchCanvasById = async (id: string): Promise<CanvasData | null> => {
    try {
        // Use the authenticated request function
        const data = await makeAuthenticatedRequest<{ canvas: CanvasData | null }>(
            GET_CANVAS_BY_ID_QUERY,
            { id }
        );
        return data.canvas;
    } catch (error) {
        console.error(`Error fetching canvas ${id}:`, error);
        // Consider checking error type for auth errors vs not found
        return null;
    }
};

export const createCanvas = async (title?: string): Promise<Canvas> => {
    const variables = title ? { title } : {};
    // Use the authenticated request function
    const data = await makeAuthenticatedRequest<{ createCanvas: Canvas }>(
        CREATE_CANVAS_MUTATION,
        variables
    );
    return data.createCanvas;
};

export const updateCanvasTitle = async (variables: { id: string; title: string }): Promise<Pick<Canvas, 'id' | 'title' | 'updatedAt'>> => {
    if (!variables.title?.trim()) {
        throw new Error("Title cannot be empty"); // Basic client-side validation
    }
    // Use the authenticated request function
    const data = await makeAuthenticatedRequest<{ updateCanvasTitle: Pick<Canvas, 'id' | 'title' | 'updatedAt'> }>(
        UPDATE_CANVAS_TITLE_MUTATION,
        variables
    );
    return data.updateCanvasTitle;
};

// Add block API functions
export const createBlock = async (variables: {
    canvasId: string;
    type: string;
    position: { x: number; y: number };
    content?: any;
}): Promise<Block> => {
    // Use the authenticated request function
     try {
         const data = await makeAuthenticatedRequest<{ createBlock: Block }>(
            CREATE_BLOCK_MUTATION,
            variables
        );
        return data.createBlock;
    } catch (error) {
        console.error(`Error creating block:`, error);
        // Re-throw or handle specific GraphQL errors
        throw error;
    }
};

export const updateBlockPosition = async (variables: { blockId: string; position: { x: number; y: number } }): Promise<Pick<Block, 'id' | 'position' | 'updatedAt'> | null> => {
    try {
        // Use the authenticated request function
        const data = await makeAuthenticatedRequest<{ updateBlockPosition: Pick<Block, 'id' | 'position' | 'updatedAt'> }>(
            UPDATE_BLOCK_POSITION_MUTATION,
            variables
        );
        return data.updateBlockPosition;
    } catch (error) {
        console.error(`Error updating block position ${variables.blockId}:`, error);
        return null;
    }
};

export const updateBlockContent = async (variables: { blockId: string; content: any }): Promise<Pick<Block, 'id' | 'content' | 'updatedAt'> | null> => {
    try {
        // Use the authenticated request function
        const data = await makeAuthenticatedRequest<{ updateBlockContent: Pick<Block, 'id' | 'content' | 'updatedAt'> }>(
            UPDATE_BLOCK_CONTENT_MUTATION,
            variables
        );
        return data.updateBlockContent;
    } catch (error) {
        console.error(`Error updating block content ${variables.blockId}:`, error);
        return null;
    }
};

export const undoBlockCreation = async (blockId: string): Promise<boolean> => {
    // Use the authenticated request function
    try {
        const data = await makeAuthenticatedRequest<{ undoBlockCreation: boolean }>(
            UNDO_BLOCK_CREATION_MUTATION,
            { blockId }
        );
        return data.undoBlockCreation;
    } catch (error) {
        console.error(`Error undoing block creation ${blockId}:`, error);
        return false;
    }
};

// --- Connection Mutations ---

const CREATE_CONNECTION_MUTATION = `
  mutation CreateConnection(
    $canvasId: ID!, 
    $sourceBlockId: ID!, 
    $targetBlockId: ID!, 
    $sourceHandle: String, 
    $targetHandle: String
  ) {
    createConnection(
      canvasId: $canvasId, 
      sourceBlockId: $sourceBlockId, 
      targetBlockId: $targetBlockId, 
      sourceHandle: $sourceHandle, 
      targetHandle: $targetHandle
    ) {
      id
      sourceBlockId
      targetBlockId
      sourceHandle
      targetHandle
    }
  }
`;

const DELETE_CONNECTION_MUTATION = `
  mutation DeleteConnection($connectionId: ID!) {
    deleteConnection(connectionId: $connectionId)
  }
`;

export const createConnection = async (variables: {
    canvasId: string;
    sourceBlockId: string;
    targetBlockId: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}): Promise<Connection | null> => {
    console.log("[API] Creating connection:", variables);
    try {
        // Use the authenticated request function
        const response = await makeAuthenticatedRequest<{ createConnection: Connection }>(
            CREATE_CONNECTION_MUTATION,
            variables
        );
        console.log("[API] Connection created:", response.createConnection);
        return response.createConnection;
    } catch (error) {
        console.error("[API] Error creating connection:", error);
        return null;
    }
};

export const deleteConnection = async (variables: {
    connectionId: string;
}): Promise<boolean> => {
    console.log("[API] Deleting connection:", variables.connectionId);
    try {
         // Use the authenticated request function
        const response = await makeAuthenticatedRequest<{ deleteConnection: boolean }>(
            DELETE_CONNECTION_MUTATION,
            variables
        );
        console.log("[API] Connection deleted result:", response.deleteConnection);
        return response.deleteConnection ?? false;
    } catch (error) {
        console.error("[API] Error deleting connection:", error);
        return false;
    }
};

// Add other API functions here (e.g., updateBlockSize...) 