// src/data/db.ts - In-memory data store and access functions
// TODO: Replace this entire module with database interactions (e.g., using Drizzle ORM or deno-postgres)

// --- Interfaces (representing data records) ---

export interface CanvasRecord {
  id: string;
  userId: string; // Placeholder for user association
  title: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlockRecord {
    id: string;
    canvasId: string;
    userId: string; // Placeholder for creator
    type: string;
    content: any; // Using any for placeholder JSONB
    position: { x: number; y: number };
    size: { width: number; height: number };
    createdAt: Date;
    updatedAt: Date;
}

// --- In-Memory Store --- 

const MOCK_USER_ID = "user-123"; // Placeholder - Should come from context

const canvasesStore: Map<string, CanvasRecord> = new Map();
const blocksStore: Map<string, BlockRecord> = new Map();
let nextCanvasId = 1;
let nextBlockId = 1;
const UNDO_GRACE_PERIOD_MS = 30 * 1000; // 30 seconds

// --- Data Access Functions --- 

// Canvases
export const getCanvasesByUserId = async (userId: string): Promise<CanvasRecord[]> => {
    console.log(`[DB] Getting canvases for user ${userId}`);
    // Simulate async db call
    await new Promise(resolve => setTimeout(resolve, 10));
    return Array.from(canvasesStore.values()).filter(c => c.userId === userId);
};

export const getCanvasById = async (id: string): Promise<CanvasRecord | undefined> => {
    console.log(`[DB] Getting canvas by id ${id}`);
    await new Promise(resolve => setTimeout(resolve, 5));
    return canvasesStore.get(id);
};

export const createCanvasRecord = async (data: { userId: string; title?: string }): Promise<CanvasRecord> => {
    console.log(`[DB] Creating canvas for user ${data.userId}`);
    await new Promise(resolve => setTimeout(resolve, 20));
    const newCanvas: CanvasRecord = {
        id: String(nextCanvasId++),
        userId: data.userId,
        title: data.title?.trim() || `Untitled Canvas ${nextCanvasId - 1}`,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    canvasesStore.set(newCanvas.id, newCanvas);
    return newCanvas;
};

export const updateCanvasRecord = async (id: string, data: { title: string }): Promise<CanvasRecord | null> => {
    console.log(`[DB] Updating canvas ${id}`);
    await new Promise(resolve => setTimeout(resolve, 15));
    const canvas = canvasesStore.get(id);
    if (!canvas) return null;
    canvas.title = data.title;
    canvas.updatedAt = new Date();
    return canvas;
};

// Blocks
export const getBlocksByCanvasId = async (canvasId: string): Promise<BlockRecord[]> => {
    console.log(`[DB] Getting blocks for canvas ${canvasId}`);
    await new Promise(resolve => setTimeout(resolve, 10));
    return Array.from(blocksStore.values()).filter(b => b.canvasId === canvasId);
};

export const getBlockById = async (id: string): Promise<BlockRecord | undefined> => {
    console.log(`[DB] Getting block by id ${id}`);
    await new Promise(resolve => setTimeout(resolve, 5));
    return blocksStore.get(id);
};

export const createBlockRecord = async (data: {
    canvasId: string;
    userId: string;
    type: string;
    position: { x: number; y: number };
    content?: any;
}): Promise<BlockRecord> => {
    console.log(`[DB] Creating block for canvas ${data.canvasId}`);
    await new Promise(resolve => setTimeout(resolve, 20));
    const newBlock: BlockRecord = {
        id: String(nextBlockId++),
        canvasId: data.canvasId,
        userId: data.userId,
        type: data.type,
        content: data.content || {},
        position: data.position,
        size: { width: 200, height: 100 }, // Default size
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    blocksStore.set(newBlock.id, newBlock);
    return newBlock;
};

export const updateBlockRecordPosition = async (id: string, position: { x: number; y: number }): Promise<BlockRecord | null> => {
    console.log(`[DB] Updating block position ${id}`);
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate db latency
    const block = blocksStore.get(id);
    if (!block) return null;
    // Add basic validation for position structure
    if (typeof position?.x !== 'number' || typeof position?.y !== 'number') {
        console.error(`[DB] Invalid position data for block ${id}:`, position);
        return null; // Or throw an error
    }
    block.position = position;
    block.updatedAt = new Date();
    return block;
};

export const updateBlockRecordContent = async (id: string, content: any): Promise<BlockRecord | null> => {
    console.log(`[DB] Updating block content ${id}`);
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate db latency
    const block = blocksStore.get(id);
    if (!block) return null;
    // TODO: Add validation based on block.type if necessary
    block.content = content;
    block.updatedAt = new Date();
    return block;
};

export const deleteBlockRecord = async (id: string): Promise<boolean> => {
    console.log(`[DB] Deleting block ${id}`);
    await new Promise(resolve => setTimeout(resolve, 15));
    return blocksStore.delete(id);
};

// Utility for Undo Grace Period Check (keeps time logic separate)
export const isWithinUndoGracePeriod = (createdAt: Date): boolean => {
    return (Date.now() - createdAt.getTime()) <= UNDO_GRACE_PERIOD_MS;
}; 