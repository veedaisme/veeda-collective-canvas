import type { StringValueNode } from "https://esm.sh/graphql@16.8.1";
import {
    getCanvasesByUserId, getCanvasById, createCanvasRecord, updateCanvasRecord,
    getBlocksByCanvasId, getBlockById, createBlockRecord, deleteBlockRecord,
    updateBlockRecordPosition, updateBlockRecordContent,
    isWithinUndoGracePeriod,
    type CanvasRecord, type BlockRecord, type ConnectionRecord,
    createConnectionRecord, deleteConnectionRecord,
    listConnectionsByCanvas
} from '../data/db.ts'; // Adjusted import path
import { GraphQLError } from 'https://esm.sh/graphql@16.8.1'; // Correct CDN import
import { DateTimeResolver, JSONResolver } from 'https://esm.sh/graphql-scalars@1.23.0'; // Use correct case: JSONResolver

// Define Context type (placeholder, enhance with actual user type)
interface ResolverContext {
    // TODO: Add user info here after implementing auth
    // user?: { id: string; email: string; };
    request: Request;
}

// --- Resolvers --- 

export const resolvers = {
  Json: JSONResolver,
  DateTime: DateTimeResolver,
  Query: {
    hello: () => "Hello from Veeda Backend!",

    // TODO: Apply proper authorization checks based on context.user
    myCanvases: async (_parent: unknown, _args: unknown, context: ResolverContext) => {
        // TODO: Get userId from actual context after auth
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");
        console.log("Resolving: myCanvases");
        return await getCanvasesByUserId(userId);
    },

    // TODO: Apply proper authorization checks based on context.user
    canvas: async (_parent: unknown, { id }: { id: string }, context: ResolverContext) => {
        // TODO: Get userId from actual context
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");
        console.log(`Resolving: canvas with ID: ${id}`);
        const canvas = await getCanvasById(id);
        // Check ownership
        if (!canvas || canvas.userId !== userId) {
             console.log(`Canvas ${id} not found or not owned by user ${userId}`);
            // Return null or throw a specific GraphQL error (e.g., AuthenticationError, NotFoundError)
             return null;
        }
        return canvas;
    },
  },
  Mutation: {
    // TODO: Apply proper authorization checks based on context.user
    createCanvas: async (_parent: unknown, { title }: { title?: string }, context: ResolverContext) => {
        // TODO: Get userId from actual context
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");
        console.log("Resolving: createCanvas");
        return await createCanvasRecord({ userId, title });
    },

    // TODO: Apply proper authorization checks based on context.user
    updateCanvasTitle: async (_parent: unknown, { id, title }: { id: string; title: string }, context: ResolverContext) => {
        // TODO: Get userId from actual context
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");

        // Validate title input
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            // Use GraphQLError for user-facing errors
            throw new Error("Canvas title cannot be empty."); // Consider GraphQLError
        }

        // Check ownership before updating
        const existingCanvas = await getCanvasById(id);
        if (!existingCanvas || existingCanvas.userId !== userId) {
            console.log(`Update failed: Canvas ${id} not found or not owned by user ${userId}`);
            throw new Error(`Canvas not found.`); // Consider GraphQLError
        }

        console.log(`Resolving: updateCanvasTitle for ID: ${id}`);
        const updatedCanvas = await updateCanvasRecord(id, { title: trimmedTitle });
        if (!updatedCanvas) {
             // Should not happen if existence check passed, but handle defensively
             throw new Error("Failed to update canvas.");
        }
        return updatedCanvas;
    },

    // NEW: createBlock resolver
    createBlock: async (_parent: unknown, args: { canvasId: string; type: string; position: {x: number, y: number}; content?: any }, context: ResolverContext) => {
        // TODO: Get userId from actual context
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");

        // Basic validation
        if (!args.type || !args.position || typeof args.position.x !== 'number' || typeof args.position.y !== 'number') {
             throw new Error("Invalid input: type and position (with x, y) are required."); // Consider GraphQLError
        }

        // Check canvas ownership
        const canvas = await getCanvasById(args.canvasId);
        if (!canvas || canvas.userId !== userId) {
             console.log(`Create block failed: Canvas ${args.canvasId} not found or not owned by user ${userId}`);
             throw new Error(`Canvas not found.`); // Consider GraphQLError
        }

        console.log(`Resolving: createBlock for canvas ID: ${args.canvasId}`);
        return await createBlockRecord({ ...args, userId });
    },

    // NEW: undoBlockCreation resolver
    undoBlockCreation: async (_parent: unknown, { blockId }: { blockId: string }, context: ResolverContext): Promise<boolean> => {
        // TODO: Get userId from actual context
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");

        const block = await getBlockById(blockId);
        // Check ownership
        if (!block || block.userId !== userId) {
             console.log(`Undo: Block ${blockId} not found or not owned by user ${userId}`);
             return false;
        }

        // Check grace period using utility from db module
        if (isWithinUndoGracePeriod(block.createdAt)) {
            const deleted = await deleteBlockRecord(blockId);
            console.log(`Resolved: undoBlockCreation - Deleted block ${blockId}: ${deleted}`);
            return deleted;
        } else {
            console.log(`Resolved: undoBlockCreation - Block ${blockId} outside grace period.`);
            return false;
        }
    },

    // NEW: updateBlockPosition resolver
    updateBlockPosition: async (_parent: unknown, { blockId, position }: { blockId: string; position: {x: number, y: number} }, context: ResolverContext) => {
        // TODO: Get userId from actual context
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");

        // Validate position structure (basic)
        if (typeof position?.x !== 'number' || typeof position?.y !== 'number') {
             throw new Error("Invalid position data."); // Consider GraphQLError
        }

        // Check block ownership
        const block = await getBlockById(blockId);
        if (!block || block.userId !== userId) {
            console.log(`Update position failed: Block ${blockId} not found or not owned by user ${userId}`);
            throw new Error(`Block not found.`); // Consider GraphQLError
        }

        console.log(`Resolving: updateBlockPosition for Block ID: ${blockId}`);
        const updatedBlock = await updateBlockRecordPosition(blockId, position);
        if (!updatedBlock) {
             // Should not happen if existence check passed, but handle defensively
             throw new Error("Failed to update block position.");
        }
        return updatedBlock;
    },

    // NEW: updateBlockContent resolver
    updateBlockContent: async (_parent: unknown, { blockId, content }: { blockId: string; content: any }, context: ResolverContext) => {
        // TODO: Get userId from actual context
        const userId = "user-123"; // MOCK
        // if (!userId) throw new Error("Unauthorized");

        // Validate content based on block type? (e.g., text block needs { text: string })
        // For MVP, we might skip deep validation if content is just JSON
        if (content === undefined || content === null) {
            throw new Error("Content cannot be null or undefined."); // Consider GraphQLError
        }

        // Check block ownership
        const block = await getBlockById(blockId);
        if (!block || block.userId !== userId) {
            console.log(`Update content failed: Block ${blockId} not found or not owned by user ${userId}`);
            throw new Error(`Block not found.`); // Consider GraphQLError
        }

        // TODO: Add validation specific to block.type here if necessary
        // Example: if (block.type === 'text' && typeof content.text !== 'string') throw new Error(...)

        console.log(`Resolving: updateBlockContent for Block ID: ${blockId}`);
        const updatedBlock = await updateBlockRecordContent(blockId, content);
        if (!updatedBlock) {
             throw new Error("Failed to update block content.");
        }
        return updatedBlock;
    },

    // --- Connection Mutations ---
    createConnection: async (_: any, { canvasId, sourceBlockId, targetBlockId, sourceHandle, targetHandle }: { canvasId: string, sourceBlockId: string, targetBlockId: string, sourceHandle?: string | null, targetHandle?: string | null }): Promise<ConnectionRecord> => {
        console.log(`[Resolver] Creating connection: ${sourceBlockId} -> ${targetBlockId}`);
        // TODO: Add Auth checks (e.g., ensure user owns canvas and blocks)
        const userId = "user-123"; // MOCK
        const canvas = await getCanvasById(canvasId);
        if (!canvas || canvas.userId !== userId) {
            throw new GraphQLError(`Canvas not found or user does not have permission.`);
        }
        // Optional: Check if source/target blocks exist and belong to the canvas/user
        // const sourceBlock = await getBlockById(sourceBlockId);
        // const targetBlock = await getBlockById(targetBlockId);
        // if (!sourceBlock || sourceBlock.canvasId !== canvasId || sourceBlock.userId !== userId) { ... }
        // if (!targetBlock || targetBlock.canvasId !== canvasId || targetBlock.userId !== userId) { ... }

        try {
            const newConnection = await createConnectionRecord(canvasId, sourceBlockId, targetBlockId, sourceHandle, targetHandle);
            return newConnection;
        } catch (error: any) { // Type error as any
            console.error("Error creating connection:", error);
            throw new GraphQLError(`Failed to create connection: ${error.message}`);
        }
    },
    deleteConnection: async (_: any, { connectionId }: { connectionId: string }): Promise<boolean> => {
        console.log(`[Resolver] Deleting connection: ${connectionId}`);
        // TODO: Add Auth checks (e.g., ensure user owns the connection via canvas/blocks)
        // This might involve fetching the connection first to check its canvasId/blockIds
        // const connection = await getConnectionById(connectionId) -> Need this function in db.ts
        // if (!connection) { throw new GraphQLError("Connection not found.") }
        // const canvas = await getCanvasById(connection.canvasId);
        // if (!canvas || canvas.userId !== userId) { ... }

        try {
            const success = await deleteConnectionRecord(connectionId);
            if (!success) {
                // If delete failed, it might be because the connection didn't exist
                throw new GraphQLError("Connection not found or could not be deleted.");
            }
            return true;
        } catch (error: any) { // Type error as any
            console.error("Error deleting connection:", error);
            // Rethrow specific error or a generic one
            if (error instanceof GraphQLError) {
                throw error;
            }
            throw new GraphQLError(`Failed to delete connection: ${error.message}`);
        }
    },
  },
  // Note: deleteCanvas mutation is intentionally omitted based on requirements
  // NEW: Resolver for Canvas.blocks field
  Canvas: {
      blocks: async (parent: CanvasRecord, _args: unknown, context: ResolverContext): Promise<BlockRecord[]> => {
          // Parent here is the resolved Canvas object from the parent query
          console.log(`Resolving: Canvas.blocks for canvas ID ${parent.id}`);
          // TODO: Add authorization check if needed (e.g., if blocks had separate permissions)
          return await getBlocksByCanvasId(parent.id);
      },
      connections: async (parent: CanvasRecord): Promise<ConnectionRecord[]> => {
          console.log(`[Resolver] Fetching connections for canvas ${parent.id}`);
          // TODO: Add Auth checks (already checked parent canvas access, is more needed?)
          const connections = await listConnectionsByCanvas(parent.id);
          return connections;
      }
  }
}; 