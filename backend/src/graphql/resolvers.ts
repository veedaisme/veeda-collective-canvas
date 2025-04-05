import type { StringValueNode } from "graphql";
import {
    getCanvasesByUserId, getCanvasById, createCanvasRecord, updateCanvasRecord,
    getBlocksByCanvasId, getBlockById, createBlockRecord, deleteBlockRecord,
    isWithinUndoGracePeriod,
    type CanvasRecord, type BlockRecord // Import types if needed
} from '../data/db.ts'; // Adjusted import path

// Define Context type (placeholder, enhance with actual user type)
interface ResolverContext {
    // TODO: Add user info here after implementing auth
    // user?: { id: string; email: string; };
    request: Request;
}

// --- Resolvers --- 

export const resolvers = {
  Json: {
      // Basic JSON scalar - assumes data is already valid JSON
      // For robust implementation, consider validation or a library like graphql-scalars
      __serialize: (value: unknown) => value, // Pass through
      __parseValue: (value: unknown) => value, // Pass through
      __parseLiteral: (ast: any) => {
            // This is a very basic parser for literals, might need improvement
            function parseLiteralValue(literalAst: any): any {
                switch (literalAst.kind) {
                    case 'StringValue':
                        return literalAst.value;
                    case 'IntValue':
                        return parseInt(literalAst.value, 10);
                    case 'FloatValue':
                        return parseFloat(literalAst.value);
                    case 'BooleanValue':
                        return literalAst.value;
                    case 'ListValue':
                        return literalAst.values.map(parseLiteralValue);
                    case 'ObjectValue':
                        return literalAst.fields.reduce((acc: any, field: any) => {
                            acc[field.name.value] = parseLiteralValue(field.value);
                            return acc;
                        }, {});
                    default:
                        return null; // Or throw error for unsupported types
                }
            }
            return parseLiteralValue(ast);
        },
  },
  DateTime: {
    // Basic scalar implementation for ISO string format
    // Note: Consider using a library like graphql-scalars for more robust scalars
    __serialize: (value: unknown): string => {
      if (!(value instanceof Date)) {
        throw new Error('Resolver Error: Expected a Date object');
      }
      return value.toISOString();
    },
    __parseValue: (value: unknown): Date => {
      if (typeof value !== 'string') {
        throw new Error('DateTime must be a string');
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
          throw new Error('Invalid Date string');
      }
      return date;
    },
    __parseLiteral: (ast: { kind: string; value: any }): Date => {
      if (ast.kind !== "StringValue") {
        throw new Error('DateTime must be a string literal');
      }
      const date = new Date(ast.value);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid Date string literal');
        }
      return date;
    },
  },
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
  },
  // Note: deleteCanvas mutation is intentionally omitted based on requirements
  // NEW: Resolver for Canvas.blocks field
  Canvas: {
      blocks: async (parent: CanvasRecord, _args: unknown, context: ResolverContext): Promise<BlockRecord[]> => {
          // Parent here is the resolved Canvas object from the parent query
          console.log(`Resolving: Canvas.blocks for canvas ID ${parent.id}`);
          // TODO: Add authorization check if needed (e.g., if blocks had separate permissions)
          return await getBlocksByCanvasId(parent.id);
      }
  }
}; 