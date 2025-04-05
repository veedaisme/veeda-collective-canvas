import type { StringValueNode } from "graphql";

// --- In-Memory Data Store (Placeholder) ---
// TODO: Replace with actual database interactions

export interface CanvasRecord {
  id: string;
  userId: string; // Placeholder for user association
  title: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Add Block Record Interface and Store
export interface BlockRecord {
    id: string;
    canvasId: string;
    userId: string; // Placeholder for creator
    type: string;
    content: any; // Using any for placeholder JSONB
    position: { x: number; y: number };
    size: { width: number; height: number }; // Define default size
    createdAt: Date;
    updatedAt: Date;
}

const MOCK_USER_ID = "user-123"; // Placeholder - Replace with actual user from context
const canvasesStore: Map<string, CanvasRecord> = new Map();
const blocksStore: Map<string, BlockRecord> = new Map(); // Store for blocks
let nextCanvasId = 1;
let nextBlockId = 1;
const UNDO_GRACE_PERIOD_MS = 30 * 1000; // 30 seconds

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
    myCanvases: (_parent: unknown, _args: unknown, context: unknown) => {
        // const userId = context.user?.id; // Example of getting user from context
        // if (!userId) throw new Error("Unauthorized");
      console.log("Resolving: myCanvases (in-memory)");
      // Currently mocks filtering for a single user
      return Array.from(canvasesStore.values()).filter(c => c.userId === MOCK_USER_ID);
    },

    // TODO: Apply proper authorization checks based on context.user
    canvas: (_parent: unknown, { id }: { id: string }, context: unknown) => {
        // const userId = context.user?.id; // Example of getting user from context
        // if (!userId) throw new Error("Unauthorized");
        console.log(`Resolving: canvas (in-memory) with ID: ${id}`);
        const canvas = canvasesStore.get(id);
        // Ensure the found canvas belongs to the user
        if (canvas?.userId !== MOCK_USER_ID) {
            // Even if found, pretend it doesn't exist for other users
            return null; // Or throw an explicit "Not Found" or "Unauthorized" error
        }
        return canvas;
    },
  },
  Mutation: {
    // TODO: Apply proper authorization checks based on context.user
    createCanvas: (_parent: unknown, { title }: { title?: string }, context: unknown) => {
        // const userId = context.user?.id;
        // if (!userId) throw new Error("Unauthorized");
      const newCanvas: CanvasRecord = {
        id: String(nextCanvasId++),
        userId: MOCK_USER_ID, // Use real userId from context
        title: title?.trim() || `Untitled Canvas ${nextCanvasId - 1}`,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      canvasesStore.set(newCanvas.id, newCanvas);
      console.log("Resolved: createCanvas", newCanvas);
      return newCanvas;
    },

    // TODO: Apply proper authorization checks based on context.user
    updateCanvasTitle: (_parent: unknown, { id, title }: { id: string; title: string }, context: unknown) => {
        // const userId = context.user?.id;
        // if (!userId) throw new Error("Unauthorized");

        const canvas = canvasesStore.get(id);

        // Check ownership
        if (!canvas || canvas.userId !== MOCK_USER_ID) {
            throw new Error(`Canvas with ID ${id} not found or not owned by user.`);
        }

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            throw new Error("Canvas title cannot be empty.");
        }

        canvas.title = trimmedTitle;
        canvas.updatedAt = new Date();
        console.log("Resolved: updateCanvasTitle", canvas);
        return canvas;
    },

    // NEW: createBlock resolver
    createBlock: (_parent: unknown, args: { canvasId: string; type: string; position: {x: number, y: number}; content?: any }, context: unknown) => {
        // TODO: Check user owns canvas args.canvasId
        const canvas = canvasesStore.get(args.canvasId);
        if (!canvas || canvas.userId !== MOCK_USER_ID) {
             throw new Error(`Canvas with ID ${args.canvasId} not found or not owned by user.`);
        }

        // Basic validation
        if (!args.type || !args.position || typeof args.position.x !== 'number' || typeof args.position.y !== 'number') {
             throw new Error("Invalid input: type and position (with x, y) are required.");
        }

        const newBlock: BlockRecord = {
            id: String(nextBlockId++),
            canvasId: args.canvasId,
            userId: MOCK_USER_ID,
            type: args.type,
            content: args.content || {}, // Default to empty object if no content provided
            position: args.position,
            size: { width: 200, height: 100 }, // Default size - TODO: make configurable or based on content?
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        blocksStore.set(newBlock.id, newBlock);
        console.log("Resolved: createBlock", newBlock);
        return newBlock;
    },

    // NEW: undoBlockCreation resolver
    undoBlockCreation: (_parent: unknown, { blockId }: { blockId: string }, context: unknown): boolean => {
        // TODO: Check user owns block/canvas
        const block = blocksStore.get(blockId);
        if (!block || block.userId !== MOCK_USER_ID) {
             // Don't reveal if block exists but belongs to someone else
             console.log(`Undo: Block ${blockId} not found or not owned.`);
             return false;
        }

        const timeSinceCreation = Date.now() - block.createdAt.getTime();

        if (timeSinceCreation <= UNDO_GRACE_PERIOD_MS) {
            const deleted = blocksStore.delete(blockId);
            console.log(`Resolved: undoBlockCreation - Deleted block ${blockId}: ${deleted}`);
            return deleted;
        } else {
            console.log(`Resolved: undoBlockCreation - Block ${blockId} outside grace period.`);
            // Optionally throw error or just return false
            // throw new Error("Undo period expired");
            return false;
        }
    },
  },
  // Note: deleteCanvas mutation is intentionally omitted based on requirements
  // NEW: Resolver for Canvas.blocks field
  Canvas: {
      blocks: (parent: CanvasRecord, _args: unknown, context: unknown): BlockRecord[] => {
          // Filter blocks that belong to the parent canvas
          console.log(`Resolving: Canvas.blocks for canvas ID ${parent.id}`);
          return Array.from(blocksStore.values()).filter(b => b.canvasId === parent.id);
      }
  }
}; 