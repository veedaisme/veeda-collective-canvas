import { GraphQLClient, gql } from 'graphql-request'

// --- GraphQL Client Setup ---
const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;

if (!endpoint) {
    throw new Error("VITE_GRAPHQL_ENDPOINT environment variable not set.");
}

const gqlClient = new GraphQLClient(endpoint);

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
  // TODO: Add authentication headers when implemented
  const data = await gqlClient.request<{ myCanvases: Canvas[] }>(
    GET_MY_CANVASES_QUERY
  );
  return data.myCanvases;
};

export const fetchCanvasById = async (id: string): Promise<Canvas | null> => {
    // TODO: Add authentication headers when implemented
    try {
        // Query now returns blocks as well
        const data = await gqlClient.request<{ canvas: Canvas | null }>(
            GET_CANVAS_BY_ID_QUERY,
            { id }
        );
        return data.canvas;
    } catch (error) {
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

// Add block API functions
export const createBlock = async (variables: {
    canvasId: string;
    type: string;
    position: { x: number; y: number };
    content?: any;
}): Promise<Block> => {
    // TODO: Add authentication headers when implemented
    const data = await gqlClient.request<{ createBlock: Block }>(
        CREATE_BLOCK_MUTATION,
        variables
    );
    return data.createBlock;
};

export const updateBlockPosition = async (variables: { blockId: string; position: { x: number; y: number } }): Promise<Pick<Block, 'id' | 'position' | 'updatedAt'> | null> => {
    // TODO: Add authentication headers when implemented
    try {
        const data = await gqlClient.request<{ updateBlockPosition: Pick<Block, 'id' | 'position' | 'updatedAt'> }>(
            UPDATE_BLOCK_POSITION_MUTATION,
            variables
        );
        return data.updateBlockPosition;
    } catch (error) {
        console.error(`Error updating block position ${variables.blockId}:`, error);
        // Handle errors appropriately, e.g., return null or re-throw specific error types
        return null;
    }
};

export const updateBlockContent = async (variables: { blockId: string; content: any }): Promise<Pick<Block, 'id' | 'content' | 'updatedAt'> | null> => {
    // TODO: Add authentication headers when implemented
    try {
        const data = await gqlClient.request<{ updateBlockContent: Pick<Block, 'id' | 'content' | 'updatedAt'> }>(
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
    // TODO: Add authentication headers when implemented
    const data = await gqlClient.request<{ undoBlockCreation: boolean }>(
        UNDO_BLOCK_CREATION_MUTATION,
        { blockId }
    );
    return data.undoBlockCreation;
};

// Add other API functions here (e.g., updateBlockSize...) 