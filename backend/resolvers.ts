
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

const MOCK_USER_ID = "user-123"; // Placeholder - Replace with actual user from context
const canvasesStore: Map<string, CanvasRecord> = new Map();
let nextCanvasId = 1;

// --- Resolvers --- 

export const resolvers = {
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
    }
  },
  // Note: deleteCanvas mutation is intentionally omitted based on requirements
}; 