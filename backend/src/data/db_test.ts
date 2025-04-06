import { assert, assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { beforeAll, beforeEach, describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";

// Import functions to test
import {
    // Need to import the internal stores/state for clearing *or* export a reset function
    // For now, let's assume we can import and clear them directly (less ideal)
    _clearAllStores, // Assuming we add/export a helper for testing
    createCanvasRecord,
    getCanvasById,
    getCanvasesByUserId,
    updateCanvasRecord,
    // Add block functions
    createBlockRecord,
    getBlockById,
    getBlocksByCanvasId,
    updateBlockRecordPosition,
    updateBlockRecordContent,
    deleteBlockRecord,
    isWithinUndoGracePeriod,
    // Add connection functions
    createConnectionRecord,
    deleteConnectionRecord,
    listConnectionsByCanvas,
    // TODO: Import block and connection functions later
} from "./db.ts";

// --- Test Setup --- 

// Helper function to add to db.ts for test cleanup
/* 
export const _clearAllStores = () => {
    canvasesStore.clear();
    blocksStore.clear();
    connectionsStore.clear();
    nextCanvasId = 1; // Reset counters if needed
    nextBlockId = 1;
};
*/

const MOCK_USER_ID_1 = "test-user-1";
const MOCK_USER_ID_2 = "test-user-2";

// Use BDD style tests
describe("Data Access Layer (db.ts)", () => {

    // Clear stores before running any tests in this suite
    // This requires the _clearAllStores helper to be implemented and exported from db.ts
    beforeAll(() => {
        // Check if the clear function exists before calling it
        if (typeof _clearAllStores === 'function') {
            _clearAllStores();
        } else {
            console.warn("db.ts does not export _clearAllStores for test cleanup.");
        }
    });

    // Clear stores before each individual test for isolation
    beforeEach(() => {
        if (typeof _clearAllStores === 'function') {
            _clearAllStores();
        }
    });

    // --- Canvas Tests --- 
    describe("Canvases", () => {
        it("should create a new canvas record with default title", async () => {
            const canvas = await createCanvasRecord({ userId: MOCK_USER_ID_1 });
            assertExists(canvas.id);
            assertEquals(canvas.userId, MOCK_USER_ID_1);
            assert(canvas.title.startsWith("Untitled Canvas"));
            assertEquals(canvas.isPublic, false);
            assert(canvas.createdAt instanceof Date);
            assert(canvas.updatedAt instanceof Date);
        });

        it("should create a new canvas record with specified title", async () => {
            const title = "My Test Canvas";
            const canvas = await createCanvasRecord({ userId: MOCK_USER_ID_1, title });
            assertEquals(canvas.title, title);
        });

        it("should get a canvas by its ID", async () => {
            const createdCanvas = await createCanvasRecord({ userId: MOCK_USER_ID_1 });
            const fetchedCanvas = await getCanvasById(createdCanvas.id);
            if (fetchedCanvas) {
                assertEquals(fetchedCanvas.id, createdCanvas.id);
                assertEquals(fetchedCanvas.title, createdCanvas.title);
            } else {
                assert(false, "Fetched canvas should not be undefined");
            }
        });

        it("should return undefined when getting a non-existent canvas ID", async () => {
            const fetchedCanvas = await getCanvasById("non-existent-id");
            assertEquals(fetchedCanvas, undefined);
        });

        it("should get all canvases for a specific user", async () => {
            await createCanvasRecord({ userId: MOCK_USER_ID_1, title: "Canvas 1 User 1" });
            await createCanvasRecord({ userId: MOCK_USER_ID_2, title: "Canvas 1 User 2" });
            await createCanvasRecord({ userId: MOCK_USER_ID_1, title: "Canvas 2 User 1" });

            const user1Canvases = await getCanvasesByUserId(MOCK_USER_ID_1);
            assertEquals(user1Canvases.length, 2);
            assert(user1Canvases.some(c => c.title === "Canvas 1 User 1"));
            assert(user1Canvases.some(c => c.title === "Canvas 2 User 1"));

            const user2Canvases = await getCanvasesByUserId(MOCK_USER_ID_2);
            assertEquals(user2Canvases.length, 1);
            assertEquals(user2Canvases[0].title, "Canvas 1 User 2");
        });

        it("should return empty array if user has no canvases", async () => {
            const userCanvases = await getCanvasesByUserId("user-with-no-canvases");
            assertEquals(userCanvases.length, 0);
        });

        it("should update an existing canvas title", async () => {
            const initialTitle = "Initial Title";
            const updatedTitle = "Updated Title";
            const canvas = await createCanvasRecord({ userId: MOCK_USER_ID_1, title: initialTitle });
            const initialUpdateTimestamp = canvas.updatedAt;

            await new Promise(res => setTimeout(res, 5)); 

            const updatedCanvas = await updateCanvasRecord(canvas.id, { title: updatedTitle });
            if (updatedCanvas) {
                assertEquals(updatedCanvas.id, canvas.id);
                assertEquals(updatedCanvas.title, updatedTitle);
                assert(updatedCanvas.updatedAt > initialUpdateTimestamp, "Update timestamp should be later");
            } else {
                assert(false, "Updated canvas should not be null");
            }

            // Verify fetch reflects update
            const fetchedAgainCanvas = await getCanvasById(canvas.id);
            if (fetchedAgainCanvas) {
                assertEquals(fetchedAgainCanvas.title, updatedTitle);
            } else {
                 assert(false, "Refetched canvas should not be undefined");
            }
        });

        it("should return null when updating a non-existent canvas", async () => {
            const updatedCanvas = await updateCanvasRecord("non-existent-id", { title: "Won't Update" });
            assertEquals(updatedCanvas, null);
        });
    });

    // --- Block Tests --- 
    describe("Blocks", () => {
        let testCanvasId: string; // To store the ID created in beforeEach

        // Create a fresh canvas and get its ID before each block test
        beforeEach(async () => {
            if (typeof _clearAllStores === 'function') _clearAllStores();
            // Create the canvas needed for this specific test
            const canvas = await createCanvasRecord({ userId: MOCK_USER_ID_1 });
            testCanvasId = canvas.id; // Store the generated ID
        });

        it("should create a block record associated with a canvas", async () => {
            // testCanvasId is now set by beforeEach
            const blockData = { canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: "text", position: { x: 10, y: 20 }, content: { text: "Hello" } };
            const block = await createBlockRecord(blockData);

            assertExists(block.id);
            assertEquals(block.canvasId, testCanvasId);
            assertEquals(block.userId, MOCK_USER_ID_1);
            assertEquals(block.type, "text");
            assertEquals(block.position, { x: 10, y: 20 });
            assertEquals(block.content, { text: "Hello" });
            assertExists(block.size); // Should have default size
            assert(block.createdAt instanceof Date);
            assert(block.updatedAt instanceof Date);
        });

        it("should get a block by its ID", async () => {
            // testCanvasId is set by beforeEach
            const blockData = { canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: "text", position: { x: 1, y: 1 } };
            const createdBlock = await createBlockRecord(blockData);
            const fetchedBlock = await getBlockById(createdBlock.id);
            
            if (fetchedBlock) {
                assertEquals(fetchedBlock.id, createdBlock.id);
                assertEquals(fetchedBlock.type, createdBlock.type);
            } else {
                assert(false, "Fetched block should exist");
            }
        });

        it("should get all blocks for a specific canvas ID", async () => {
            // testCanvasId is set by beforeEach for the main canvas
            // Create blocks for the test canvas
            await createBlockRecord({ canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: "text", position: { x: 1, y: 1 } });
            await createBlockRecord({ canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: "image", position: { x: 100, y: 100 } });
            
            // Create a distinctly separate canvas *within this test*
            const otherCanvas = await createCanvasRecord({ userId: MOCK_USER_ID_2 });
            // Ensure this block uses the otherCanvas's ID
            await createBlockRecord({ canvasId: otherCanvas.id, userId: MOCK_USER_ID_2, type: "shape", position: { x: 0, y: 0 } });
            
            const canvasBlocks = await getBlocksByCanvasId(testCanvasId);
            assertEquals(canvasBlocks.length, 2); // Should now correctly be 2
            assert(canvasBlocks.some(b => b.type === 'text'));
            assert(canvasBlocks.some(b => b.type === 'image'));
        });

        it("should update block position", async () => {
            // testCanvasId is set by beforeEach
            const blockData = { canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: "text", position: { x: 50, y: 50 } };
            const block = await createBlockRecord(blockData);
            const newPosition = { x: 200, y: 250 };
            const initialUpdateTimestamp = block.updatedAt;
            
            await new Promise(res => setTimeout(res, 5));
            const updatedBlock = await updateBlockRecordPosition(block.id, newPosition);

            if (updatedBlock) {
                assertEquals(updatedBlock.position, newPosition);
                assert(updatedBlock.updatedAt > initialUpdateTimestamp);
            } else {
                 assert(false, "Updated block should not be null");
            }
        });

        it("should update block content", async () => {
            // testCanvasId is set by beforeEach
            const blockData = { canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: "text", position: { x: 1, y: 1 }, content: { text: "Initial Content" } };
            const block = await createBlockRecord(blockData);
            const newContent = { text: "Updated Content", extra: "field" };
            const initialUpdateTimestamp = block.updatedAt;

            await new Promise(res => setTimeout(res, 5));
            const updatedBlock = await updateBlockRecordContent(block.id, newContent);
            
            if (updatedBlock) {
                assertEquals(updatedBlock.content, newContent);
                 assert(updatedBlock.updatedAt > initialUpdateTimestamp);
            } else {
                 assert(false, "Updated block should not be null");
            }
        });

        it("should delete a block record", async () => {
            // testCanvasId is set by beforeEach
            const blockData = { canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: "text", position: { x: 1, y: 1 } };
            const block = await createBlockRecord(blockData);
            
            const success = await deleteBlockRecord(block.id);
            assertEquals(success, true);

            // Verify it's gone
            const fetchedBlock = await getBlockById(block.id);
            assertEquals(fetchedBlock, undefined);
        });

        it("should return false when deleting a non-existent block", async () => {
            const success = await deleteBlockRecord("non-existent-block");
            assertEquals(success, false);
        });

        it("should return true for isWithinUndoGracePeriod if recent", () => {
             const recentDate = new Date(); // Now
             assert(isWithinUndoGracePeriod(recentDate), "Date created now should be within grace period");
             
             const justBeforeGracePeriodEnd = new Date(Date.now() - 29 * 1000); // 29 seconds ago
             assert(isWithinUndoGracePeriod(justBeforeGracePeriodEnd), "Date created 29s ago should be within grace period");
        });

        it("should return false for isWithinUndoGracePeriod if old", () => {
            const justAfterGracePeriodEnd = new Date(Date.now() - 31 * 1000); // 31 seconds ago
            assert(!isWithinUndoGracePeriod(justAfterGracePeriodEnd), "Date created 31s ago should be outside grace period");

            const muchOlderDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
            assert(!isWithinUndoGracePeriod(muchOlderDate), "Date created 5min ago should be outside grace period");
        });

    });

    // --- Connection Tests --- 
    describe("Connections", () => {
        let testCanvasId: string;
        let block1Id: string;
        let block2Id: string;

        // Create canvas and blocks needed for connection tests
        beforeEach(async () => {
            if (typeof _clearAllStores === 'function') _clearAllStores();
            const canvas = await createCanvasRecord({ userId: MOCK_USER_ID_1 });
            testCanvasId = canvas.id;
            const block1 = await createBlockRecord({ canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: 'text', position: {x:0,y:0} });
            const block2 = await createBlockRecord({ canvasId: testCanvasId, userId: MOCK_USER_ID_1, type: 'text', position: {x:100,y:100} });
            block1Id = block1.id;
            block2Id = block2.id;
        });

        it("should create a connection record between two blocks", async () => {
            const conn = await createConnectionRecord(testCanvasId, block1Id, block2Id, 'sourceHandle', 'targetHandle');
            
            assertExists(conn.id);
            assertEquals(conn.canvasId, testCanvasId);
            assertEquals(conn.sourceBlockId, block1Id);
            assertEquals(conn.targetBlockId, block2Id);
            assertEquals(conn.sourceHandle, 'sourceHandle');
            assertEquals(conn.targetHandle, 'targetHandle');
            assert(conn.createdAt instanceof Date);
        });
        
        it("should create a connection record without handles", async () => {
            const conn = await createConnectionRecord(testCanvasId, block1Id, block2Id); // Handles are optional
            assertExists(conn.id);
            assertEquals(conn.canvasId, testCanvasId);
            assertEquals(conn.sourceBlockId, block1Id);
            assertEquals(conn.targetBlockId, block2Id);
            assertEquals(conn.sourceHandle, undefined); // Check default
            assertEquals(conn.targetHandle, undefined); // Check default
        });

        it("should list all connections for a specific canvas", async () => {
            // Create connections
            const conn1 = await createConnectionRecord(testCanvasId, block1Id, block2Id);
            const conn2 = await createConnectionRecord(testCanvasId, block2Id, block1Id, 'a', 'b');
            // Create connection on another canvas (should be ignored)
            const otherCanvas = await createCanvasRecord({ userId: MOCK_USER_ID_2 });
            const otherBlock1 = await createBlockRecord({ canvasId: otherCanvas.id, userId: MOCK_USER_ID_2, type: 'text', position: {x:0,y:0} });
            const otherBlock2 = await createBlockRecord({ canvasId: otherCanvas.id, userId: MOCK_USER_ID_2, type: 'text', position: {x:0,y:0} });
            await createConnectionRecord(otherCanvas.id, otherBlock1.id, otherBlock2.id);

            const canvasConnections = await listConnectionsByCanvas(testCanvasId);
            
            assertEquals(canvasConnections.length, 2);
            // Check if the created connections are present (order might not be guaranteed)
            assert(canvasConnections.some(c => c.id === conn1.id));
            assert(canvasConnections.some(c => c.id === conn2.id));
            assertEquals(canvasConnections.find(c => c.id === conn1.id)?.sourceBlockId, block1Id);
            assertEquals(canvasConnections.find(c => c.id === conn2.id)?.sourceBlockId, block2Id);
        });

        it("should return an empty array when listing connections for a canvas with no connections", async () => {
            const connections = await listConnectionsByCanvas(testCanvasId);
            assertEquals(connections.length, 0);
        });

        it("should delete a connection record", async () => {
            const conn = await createConnectionRecord(testCanvasId, block1Id, block2Id);
            const success = await deleteConnectionRecord(conn.id);
            assertEquals(success, true);

            // Verify it's gone
            const connections = await listConnectionsByCanvas(testCanvasId);
            assertEquals(connections.length, 0);
        });

        it("should return false when deleting a non-existent connection", async () => {
             const success = await deleteConnectionRecord("non-existent-connection");
             assertEquals(success, false);
        });

    });
}); 