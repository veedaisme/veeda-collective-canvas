import type { StringValueNode } from "https://esm.sh/graphql@16.8.1";
import {
    getCanvasesByUserId, getCanvasById, createCanvasRecord, updateCanvasRecord,
    getBlocksByCanvasId, getBlockById, createBlockRecord,
    updateBlockRecordPosition, updateBlockRecordContent,
    isWithinUndoGracePeriod,
    type CanvasRecord, type BlockRecord, type ConnectionRecord,
    createConnectionRecord, deleteConnectionRecord,
    listConnectionsByCanvas
} from '../data/db.ts'; // Adjusted import path
import { GraphQLError } from 'https://esm.sh/graphql@16.8.1'; // Correct CDN import
import { DateTimeResolver, JSONResolver } from 'https://esm.sh/graphql-scalars@1.23.0'; // Use correct case: JSONResolver
import type { supabase, supabaseAdmin } from "../lib/supabaseClient.ts";
import type { User as SupabaseUser } from '@supabase/supabase-js'; // Rename imported User
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

// --- Interfaces & Context (Assuming Supabase Auth integration later) ---
interface User {
    id: string;
    // other user properties from auth token
}

// Define Context type
export interface ResolverContext {
    user?: SupabaseUser; // Use the renamed type
    request: Request;
    supabase: SupabaseClient; // Use SupabaseClient type
    supabaseAdmin: SupabaseClient; // Use SupabaseClient type
}

// Helper to get user ID, throws error if not authenticated
const getUserIdFromContext = (context: ResolverContext): string => {
    // In a real app, this would come from validating a JWT or session
    const userId = context.user?.id;
    if (!userId) {
        console.error("[AUTH] User ID not found in context.");
        throw new GraphQLError('User is not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    return userId;
};

// --- Resolvers ---

export const resolvers = {
  Json: JSONResolver,
  DateTime: DateTimeResolver,
  Query: {
    hello: () => "Hello from Veeda Backend!",

    // TODO: Apply proper authorization checks based on context.user
    myCanvases: async (_parent: unknown, _args: unknown, context: ResolverContext) => {
        const userId = getUserIdFromContext(context);
        console.log(`Resolving: myCanvases for user ${userId}`);
        // Pass context to use the request-specific client
        const canvases = await getCanvasesByUserId(userId, context);
        return canvases;
    },

    // TODO: Apply proper authorization checks based on context.user
    canvas: async (_parent: unknown, { id }: { id: string }, context: ResolverContext) => {
        const userId = getUserIdFromContext(context); // Still good for auth check
        console.log(`Resolving: canvas with ID: ${id}`);
        // Pass context to use the request-specific client
        const canvas = await getCanvasById(id, context);
        if (!canvas) {
            console.log(`Canvas ${id} not found or user ${userId} lacks access.`);
            throw new GraphQLError('Canvas not found', {
                 extensions: { code: 'NOT_FOUND', canvasId: id },
            });
        }
        return canvas;
    },
  },
  Mutation: {
    // TODO: Apply proper authorization checks based on context.user
    createCanvas: async (_parent: unknown, { title }: { title?: string }, context: ResolverContext) => {
        const userId = getUserIdFromContext(context);
        console.log(`Resolving: createCanvas for user ${userId}`);
        // Now passing the context to createCanvasRecord to use the admin client
        const newCanvas = await createCanvasRecord({ userId, title }, context);
        // Map internal record to GraphQL type if needed
        return newCanvas;
    },

    // TODO: Apply proper authorization checks based on context.user
    updateCanvasTitle: async (_parent: unknown, { id, title }: { id: string; title: string }, context: ResolverContext) => {
        const userId = getUserIdFromContext(context);
        // Validate title input
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            throw new GraphQLError("Canvas title cannot be empty.", {
                extensions: { code: 'BAD_USER_INPUT', argumentName: 'title' }
            });
        }

        console.log(`Resolving: updateCanvasTitle for ID: ${id} by user ${userId}`);
        // RLS handles authorization/existence check at DB level
        const updatedCanvas = await updateCanvasRecord(id, { title: trimmedTitle });

        if (!updatedCanvas) {
            // This indicates either not found OR RLS blocked the update
            console.log(`Update failed: Canvas ${id} not found or user ${userId} lacks permission.`);
            throw new GraphQLError('Canvas not found or update forbidden', {
                extensions: { code: 'NOT_FOUND_OR_FORBIDDEN', canvasId: id },
            });
        }
        // Map internal record to GraphQL type if needed
        return updatedCanvas;
    },

    // createBlock resolver
    createBlock: async (_parent: unknown, args: { canvasId: string; type: string; position: {x: number, y: number}; content?: any }, context: ResolverContext) => {
        const userId = getUserIdFromContext(context);

        // Basic validation
        if (!args.type || !args.position || typeof args.position.x !== 'number' || typeof args.position.y !== 'number') {
            throw new GraphQLError("Invalid input: type and position (with x, y) are required.", {
                extensions: { code: 'BAD_USER_INPUT' }
            });
        }

        console.log(`Resolving: createBlock for canvas ID: ${args.canvasId} by user ${userId}`);
        // RLS handles canvas ownership check at DB level during insert
        try {
            const newBlock = await createBlockRecord({ ...args, userId });
            // Map internal record to GraphQL type if needed
            return newBlock;
        } catch (error: any) {
            console.error(`[Resolver] Error creating block: ${error.message}`);
            // Check for specific DB errors if needed (e.g., canvas FK violation)
            throw new GraphQLError(`Failed to create block: ${error.message}`, {
                 extensions: { code: 'INTERNAL_SERVER_ERROR' } // Or more specific
            });
        }
    },

    // undoBlockCreation resolver - adapted for non-deletion
    undoBlockCreation: async (_parent: unknown, { blockId }: { blockId: string }, context: ResolverContext): Promise<boolean> => {
        const userId = getUserIdFromContext(context);

        // Block deletion is disallowed by design.
        // This mutation should either be removed or repurposed if "undo"
        // means something else (like reverting content/position shortly after creation).
        // For now, adhering strictly to "no delete", this always returns false.

        console.log(`Resolving: undoBlockCreation attempt for Block ID: ${blockId} by user ${userId} - Operation disallowed.`);

        // Fetch block to check ownership and potentially timestamp, though deletion is blocked
        const block = await getBlockById(blockId);
        if (!block || block.userId !== userId) {
            console.warn(`Undo attempt: Block ${blockId} not found or not owned by user ${userId}.`);
            // Still return false, as deletion wouldn't have been possible anyway.
        }

        // Even if found and within grace period, deletion is not allowed.
        // if (block && isWithinUndoGracePeriod(block.createdAt)) {
        //     console.log(`Undo attempt: Block ${blockId} is within grace period but deletion is disabled.`);
        // }

        return false; // Block deletion is not permitted.
    },

    // updateBlockPosition resolver
    updateBlockPosition: async (_parent: unknown, { blockId, position }: { blockId: string; position: {x: number, y: number} }, context: ResolverContext) => {
        const userId = getUserIdFromContext(context);

        // Validate position structure (basic)
        if (typeof position?.x !== 'number' || typeof position?.y !== 'number') {
             throw new GraphQLError("Invalid position data.", {
                 extensions: { code: 'BAD_USER_INPUT', argumentName: 'position' }
             });
        }

        console.log(`Resolving: updateBlockPosition for Block ID: ${blockId} by user ${userId}`);
        // RLS handles block ownership check at DB level during update
        const updatedBlock = await updateBlockRecordPosition(blockId, position);

        if (!updatedBlock) {
            console.log(`Update position failed: Block ${blockId} not found or user ${userId} lacks permission.`);
            throw new GraphQLError('Block not found or update forbidden', {
                extensions: { code: 'NOT_FOUND_OR_FORBIDDEN', blockId: blockId },
            });
        }
        // Map internal record to GraphQL type if needed
        return updatedBlock;
    },

    // updateBlockContent resolver
    updateBlockContent: async (_parent: unknown, { blockId, content }: { blockId: string; content: any }, context: ResolverContext) => {
        const userId = getUserIdFromContext(context);

        // Basic content validation
        if (content === undefined || content === null) {
            throw new GraphQLError("Content cannot be null or undefined.", {
                 extensions: { code: 'BAD_USER_INPUT', argumentName: 'content' }
            });
        }

        // TODO: Add deeper content validation based on block type *before* hitting DB if possible
        // const block = await getBlockById(blockId); // Need to fetch to know type for validation
        // if (!block || block.userId !== userId) { ... throw error ... }
        // if (block.type === 'text' && typeof content.text !== 'string') { throw ... }

        console.log(`Resolving: updateBlockContent for Block ID: ${blockId} by user ${userId}`);
        // RLS handles block ownership check at DB level during update
        const updatedBlock = await updateBlockRecordContent(blockId, content);

        if (!updatedBlock) {
            console.log(`Update content failed: Block ${blockId} not found or user ${userId} lacks permission.`);
            throw new GraphQLError('Block not found or update forbidden', {
                 extensions: { code: 'NOT_FOUND_OR_FORBIDDEN', blockId: blockId },
            });
        }
        // Map internal record to GraphQL type if needed
        return updatedBlock;
    },

    // --- Connection Mutations ---
    createConnection: async (_parent: unknown, args: { canvasId: string, sourceBlockId: string, targetBlockId: string, sourceHandle?: string | null, targetHandle?: string | null }, context: ResolverContext): Promise<ConnectionRecord> => {
        const userId = getUserIdFromContext(context);
        console.log(`[Resolver] Creating connection: ${args.sourceBlockId} -> ${args.targetBlockId} by user ${userId}`);

        // RLS at the DB level should prevent creating connections in canvases not owned by the user.
        // Optional: Add explicit checks here for source/target block existence and ownership
        // if needed for clearer error messages before hitting the DB.
        // const canvas = await getCanvasById(args.canvasId);
        // if (!canvas || canvas.userId !== userId) { throw new GraphQLError(...); }

        try {
            const newConnection = await createConnectionRecord(args.canvasId, args.sourceBlockId, args.targetBlockId, args.sourceHandle, args.targetHandle);
            // Map internal record to GraphQL type if needed
            return newConnection;
        } catch (error: any) { // Type error as any
            console.error("[Resolver] Error creating connection:", error);
            // Check for specific DB errors (e.g., FK violation) and provide better messages
            if (error.message.includes('violates foreign key constraint')) {
                 throw new GraphQLError('Failed to create connection: Source or target block not found.', {
                      extensions: { code: 'BAD_USER_INPUT' } // Or NOT_FOUND
                 });
            }
            throw new GraphQLError(`Failed to create connection: ${error.message}`, {
                 extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
        }
    },
    deleteConnection: async (_parent: unknown, { connectionId }: { connectionId: string }, context: ResolverContext): Promise<boolean> => {
        const userId = getUserIdFromContext(context);
        console.log(`[Resolver] Deleting connection: ${connectionId} by user ${userId}`);

        // RLS at the DB level should prevent deleting connections in canvases not owned by the user.
        // We rely on the DB function returning true/false based on successful deletion.

        try {
            // deleteConnectionRecord now checks RLS implicitly via the DELETE operation
            const success = await deleteConnectionRecord(connectionId);
            if (!success) {
                // If delete failed, it might be because the connection didn't exist OR RLS prevented it
                console.warn(`[Resolver] Delete connection ${connectionId} failed (not found or forbidden).`);
                throw new GraphQLError("Connection not found or delete forbidden.", {
                     extensions: { code: 'NOT_FOUND_OR_FORBIDDEN', connectionId: connectionId }
                });
            }
            return true;
        } catch (error: any) { // Type error as any
            console.error("[Resolver] Error deleting connection:", error);
             if (error instanceof GraphQLError) { // Propagate specific errors
                throw error;
            }
            throw new GraphQLError(`Failed to delete connection: ${error.message}`, {
                 extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
        }
    },
  },
  // Resolver for Canvas.blocks field
  Canvas: {
      blocks: async (parent: CanvasRecord, _args: unknown, context: ResolverContext): Promise<BlockRecord[]> => {
          const userId = getUserIdFromContext(context); // Check auth
          // Parent here is the resolved Canvas object
          console.log(`Resolving: Canvas.blocks for canvas ID ${parent.id}`);
          // RLS ensures we only get blocks for canvases the user can access
          const blocks = await getBlocksByCanvasId(parent.id);
          // Map internal records to GraphQL type if needed
          return blocks;
      },
       // Resolver for Canvas.connections field
       connections: async (parent: CanvasRecord, _args: unknown, context: ResolverContext): Promise<ConnectionRecord[]> => {
            const userId = getUserIdFromContext(context); // Check auth
            console.log(`Resolving: Canvas.connections for canvas ID ${parent.id}`);
            // RLS ensures we only get connections for canvases the user can access
            const connections = await listConnectionsByCanvas(parent.id);
            // Map internal records to GraphQL type if needed
            return connections;
       }
  },
    // TODO: Add resolvers for Block fields if needed (e.g., Block.notes)
    // Block: {
    //    ...
    // },
    // TODO: Add resolvers for Connection fields if needed
    // Connection: {
    //    ...
    // }
}; 