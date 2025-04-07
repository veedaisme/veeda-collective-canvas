// src/data/db.ts - Supabase data access functions
import { supabase } from '../lib/supabaseClient.ts';
// TODO: Ideally, import the generated Database type directly if possible
// For now, define specific table types based on generated output
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface CanvasRow {
  id: string;
  user_id: string;
  title: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockRow {
    id: string;
    canvas_id: string;
    user_id: string;
    type: string;
    content: Json | null;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    created_at: string;
    updated_at: string;
}

export interface ConnectionRow {
    id: string;
    canvas_id: string;
    source_block_id: string;
    target_block_id: string;
    source_handle?: string | null;
    target_handle?: string | null;
    created_at: string;
}

// --- Interfaces (representing data records) ---

// Keep existing interfaces but note they might need adjustment based on Supabase return types
export interface CanvasRecord {
  id: string;
  userId: string; // Mapped from user_id
  title: string;
  isPublic: boolean; // Mapped from is_public
  createdAt: Date; // Mapped from created_at
  updatedAt: Date; // Mapped from updated_at
}

export interface BlockRecord {
    id: string;
    canvasId: string; // Mapped from canvas_id
    userId: string; // Mapped from user_id
    type: string;
    content: any; // JSONB
    position: { x: number; y: number }; // Mapped from position_x, position_y
    size: { width: number; height: number }; // Mapped from width, height
    createdAt: Date; // Mapped from created_at
    updatedAt: Date; // Mapped from updated_at
}

export interface ConnectionRecord {
    id: string;
    canvasId: string; // Mapped from canvas_id
    sourceBlockId: string; // Mapped from source_block_id
    targetBlockId: string; // Mapped from target_block_id
    sourceHandle?: string | null; // Mapped from source_handle
    targetHandle?: string | null; // Mapped from target_handle
    createdAt: Date; // Mapped from created_at
}

// --- In-Memory Store (REMOVE THESE) ---

// const MOCK_USER_ID = "user-123"; // Placeholder - Should come from context
// const canvasesStore: Map<string, CanvasRecord> = new Map();
// const blocksStore: Map<string, BlockRecord> = new Map();
// const connectionsStore = new Map<string, ConnectionRecord>();
// let nextCanvasId = 1;
// let nextBlockId = 1;
const UNDO_GRACE_PERIOD_MS = 30 * 1000; // 30 seconds

// --- Data Access Functions ---

// Helper function to map Supabase row to our record format
function mapCanvasRowToRecord(row: CanvasRow): CanvasRecord {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        isPublic: row.is_public,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

// Canvases
export const getCanvasesByUserId = async (userId: string): Promise<CanvasRecord[]> => {
    console.log(`[DB] Getting canvases for user ${userId}`);
    const { data, error } = await supabase
        .from('canvases')
        .select('*')
        .eq('user_id', userId); // RLS should handle authorization

    if (error) {
        console.error(`[DB] Error fetching canvases for user ${userId}:`, error);
        throw new Error(`Failed to fetch canvases: ${error.message}`);
    }
    // Map Supabase rows to our internal record format
    return (data || []).map(mapCanvasRowToRecord);
};

export const getCanvasById = async (id: string): Promise<CanvasRecord | undefined> => {
    console.log(`[DB] Getting canvas by id ${id}`);
    // Note: RLS policy should ensure user can only fetch their own or public canvases
    const { data, error } = await supabase
        .from('canvases')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Returns null if not found, or a single object

    if (error) {
        console.error(`[DB] Error fetching canvas ${id}:`, error);
        throw new Error(`Failed to fetch canvas: ${error.message}`);
    }

    return data ? mapCanvasRowToRecord(data) : undefined;
};

export const createCanvasRecord = async (data: { userId: string; title?: string }): Promise<CanvasRecord> => {
    console.log(`[DB] Creating canvas for user ${data.userId}`);
    const canvasToInsert = {
        user_id: data.userId,
        title: data.title?.trim() || 'Untitled Canvas', // Default handled by DB now, but good practice here too
        // is_public defaults to FALSE in DB
    };

    const { data: insertedData, error } = await supabase
        .from('canvases')
        .insert(canvasToInsert)
        .select() // Return the newly created row
        .single(); // Expecting a single row back

    if (error) {
        console.error(`[DB] Error creating canvas for user ${data.userId}:`, error);
        throw new Error(`Failed to create canvas: ${error.message}`);
    }
    if (!insertedData) {
         console.error(`[DB] No data returned after creating canvas for user ${data.userId}`);
         throw new Error('Failed to create canvas: No data returned.');
    }

    return mapCanvasRowToRecord(insertedData);
};

export const updateCanvasRecord = async (id: string, data: { title: string }): Promise<CanvasRecord | null> => {
    console.log(`[DB] Updating canvas ${id}`);
    // Note: RLS policy should ensure user can only update their own canvases
    const { data: updatedData, error } = await supabase
        .from('canvases')
        .update({
            title: data.title,
            // updated_at is handled by trigger
         })
        .eq('id', id)
        .select() // Return the updated row
        .single(); // Expecting a single row back

    if (error) {
        // Handle potential RLS errors or not found errors gracefully
        if (error.code === 'PGRST116') { // PostgREST code for "no rows returned"
             console.warn(`[DB] Canvas ${id} not found or user lacks permission to update.`);
             return null;
        }
        console.error(`[DB] Error updating canvas ${id}:`, error);
        throw new Error(`Failed to update canvas: ${error.message}`);
    }
    if (!updatedData) {
         console.warn(`[DB] Canvas ${id} not found or no data returned after update attempt.`);
         return null;
    }

    return mapCanvasRowToRecord(updatedData);
};

// Helper function to map Supabase BlockRow to our BlockRecord format
function mapBlockRowToRecord(row: BlockRow): BlockRecord {
    return {
        id: row.id,
        canvasId: row.canvas_id,
        userId: row.user_id,
        type: row.type,
        content: row.content,
        position: { x: row.position_x, y: row.position_y },
        size: { width: row.width, height: row.height }, // Assuming size is stored as width/height columns
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}

// Blocks
export const getBlocksByCanvasId = async (canvasId: string): Promise<BlockRecord[]> => {
    console.log(`[DB] Getting blocks for canvas ${canvasId}`);
    // Note: RLS policy should ensure user can only fetch blocks for canvases they have access to
    const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('canvas_id', canvasId);

    if (error) {
        console.error(`[DB] Error fetching blocks for canvas ${canvasId}:`, error);
        throw new Error(`Failed to fetch blocks: ${error.message}`);
    }
    return (data || []).map(mapBlockRowToRecord);
};

export const getBlockById = async (id: string): Promise<BlockRecord | undefined> => {
    console.log(`[DB] Getting block by id ${id}`);
    // Note: RLS policy applies here as well
    const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error(`[DB] Error fetching block ${id}:`, error);
        throw new Error(`Failed to fetch block: ${error.message}`);
    }
    return data ? mapBlockRowToRecord(data) : undefined;
};

export const createBlockRecord = async (data: {
    canvasId: string;
    userId: string;
    type: string;
    position: { x: number; y: number };
    content?: any;
    // Optional size, might default in DB or here
    size?: { width: number; height: number };
}): Promise<BlockRecord> => {
    console.log(`[DB] Creating block for canvas ${data.canvasId}`);
    // Note: RLS ensures user can only insert into canvases they own
    const blockToInsert = {
        canvas_id: data.canvasId,
        user_id: data.userId,
        type: data.type,
        content: data.content || {},
        position_x: data.position.x,
        position_y: data.position.y,
        width: data.size?.width ?? 200, // Use provided or default
        height: data.size?.height ?? 100, // Use provided or default
    };

    const { data: insertedData, error } = await supabase
        .from('blocks')
        .insert(blockToInsert)
        .select()
        .single();

    if (error) {
        console.error(`[DB] Error creating block for canvas ${data.canvasId}:`, error);
        throw new Error(`Failed to create block: ${error.message}`);
    }
     if (!insertedData) {
         console.error(`[DB] No data returned after creating block for canvas ${data.canvasId}`);
         throw new Error('Failed to create block: No data returned.');
    }

    return mapBlockRowToRecord(insertedData);
};

export const updateBlockRecordPosition = async (id: string, position: { x: number; y: number }): Promise<BlockRecord | null> => {
    console.log(`[DB] Updating block position ${id}`);
    // Note: RLS policy ensures user can only update blocks in their own canvases
    if (typeof position?.x !== 'number' || typeof position?.y !== 'number') {
        console.error(`[DB] Invalid position data for block ${id}:`, position);
        // Throw a specific error or return null, depending on desired handling
        throw new Error('Invalid position data provided.');
    }

    const { data: updatedData, error } = await supabase
        .from('blocks')
        .update({
            position_x: position.x,
            position_y: position.y,
            // updated_at handled by trigger
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // Not found / No permission
            console.warn(`[DB] Block ${id} not found or user lacks permission to update position.`);
            return null;
        }
        console.error(`[DB] Error updating block position ${id}:`, error);
        throw new Error(`Failed to update block position: ${error.message}`);
    }
    if (!updatedData) {
        console.warn(`[DB] Block ${id} not found or no data returned after position update attempt.`);
        return null;
    }

    return mapBlockRowToRecord(updatedData);
};

export const updateBlockRecordContent = async (id: string, content: any): Promise<BlockRecord | null> => {
    console.log(`[DB] Updating block content ${id}`);
    // Note: RLS policy applies
    // TODO: Add validation based on block.type if necessary
    const { data: updatedData, error } = await supabase
        .from('blocks')
        .update({ content: content })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // Not found / No permission
            console.warn(`[DB] Block ${id} not found or user lacks permission to update content.`);
            return null;
        }
        console.error(`[DB] Error updating block content ${id}:`, error);
        throw new Error(`Failed to update block content: ${error.message}`);
    }
     if (!updatedData) {
        console.warn(`[DB] Block ${id} not found or no data returned after content update attempt.`);
        return null;
    }

    return mapBlockRowToRecord(updatedData);
};

// Utility for Undo Grace Period Check (keeps time logic separate)
// This function might need adjustment if block creation time comes from DB
export const isWithinUndoGracePeriod = (createdAt: Date): boolean => {
    return (Date.now() - createdAt.getTime()) <= UNDO_GRACE_PERIOD_MS;
};

// Helper function to map Supabase ConnectionRow to our ConnectionRecord format
function mapConnectionRowToRecord(row: ConnectionRow): ConnectionRecord {
    return {
        id: row.id,
        canvasId: row.canvas_id,
        sourceBlockId: row.source_block_id,
        targetBlockId: row.target_block_id,
        sourceHandle: row.source_handle,
        targetHandle: row.target_handle,
        createdAt: new Date(row.created_at),
    };
}

// --- Connection Data Access ---

export const createConnectionRecord = async (
    canvasId: string,
    sourceBlockId: string,
    targetBlockId: string,
    sourceHandle?: string | null,
    targetHandle?: string | null
): Promise<ConnectionRecord> => {
    console.log(`[DB] Creating connection between ${sourceBlockId} and ${targetBlockId} on canvas ${canvasId}`);
    // Note: RLS policy applies
    const connectionToInsert = {
        canvas_id: canvasId,
        source_block_id: sourceBlockId,
        target_block_id: targetBlockId,
        source_handle: sourceHandle,
        target_handle: targetHandle,
    };

    // TODO: Add check to prevent connecting a block to itself?
    // TODO: Add check to prevent duplicate connections?

    const { data: insertedData, error } = await supabase
        .from('connections')
        .insert(connectionToInsert)
        .select()
        .single();

    if (error) {
        console.error(`[DB] Error creating connection for canvas ${canvasId}:`, error);
        // Consider specific error handling for FK violations (e.g., blocks don't exist)
        throw new Error(`Failed to create connection: ${error.message}`);
    }
    if (!insertedData) {
         console.error(`[DB] No data returned after creating connection for canvas ${canvasId}`);
         throw new Error('Failed to create connection: No data returned.');
    }

    return mapConnectionRowToRecord(insertedData);
};

export const deleteConnectionRecord = async (id: string): Promise<boolean> => {
    console.log(`[DB] Deleting connection ${id}`);
    // Note: RLS policy applies
    const { error, count } = await supabase
        .from('connections')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`[DB] Error deleting connection ${id}:`, error);
        // Don't throw, just return false if deletion fails
        return false;
    }

    // Check if any row was actually deleted
    return count !== null && count > 0;
};

export const listConnectionsByCanvas = async (canvasId: string): Promise<ConnectionRecord[]> => {
    console.log(`[DB] Listing connections for canvas ${canvasId}`);
    // Note: RLS policy applies
    const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('canvas_id', canvasId);

    if (error) {
        console.error(`[DB] Error listing connections for canvas ${canvasId}:`, error);
        throw new Error(`Failed to list connections: ${error.message}`);
    }

    return (data || []).map(mapConnectionRowToRecord);
};

// --- Test Helpers (REMOVED) ---

// export const _clearAllStores = () => {
//     console.warn("[TEST UTIL] Clearing all in-memory stores.");
//     canvasesStore.clear();
//     blocksStore.clear();
//     connectionsStore.clear();
//     nextCanvasId = 1; // Reset counters if needed
//     nextBlockId = 1;
// }; 