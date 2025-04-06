import { assert, assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { beforeAll, beforeEach, describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";

// Import the resolvers to test
import { resolvers } from "./resolvers.ts";

// Import DB functions for test setup and the clear helper
import {
    _clearAllStores,
    createCanvasRecord,
    getCanvasById,
    createBlockRecord,
    getBlockById,
    createConnectionRecord,
    deleteConnectionRecord,
    listConnectionsByCanvas,
    // Import other DB records if needed for specific resolver tests
    type CanvasRecord, type BlockRecord, type ConnectionRecord // Types for assertions
} from "../data/db.ts";

// --- Test Setup --- 

const MOCK_USER_ID = "user-123"; // Matches the hardcoded ID in resolvers for now
const OTHER_USER_ID = "other-user-456";

// Mock context (basic for now, expand when auth is added)
const mockContext = {
    request: new Request("http://localhost/"), // Dummy request object
    // user: { id: MOCK_USER_ID } // Add user later
};

// Helper to call query resolvers
const resolveQuery = (fieldName: keyof typeof resolvers.Query, args: any = {}) => {
    const resolverFn = resolvers.Query[fieldName];
    if (!resolverFn) throw new Error(`Resolver Query.${fieldName} not found`);
    // deno-lint-ignore no-explicit-any
    return resolverFn(null as any, args, mockContext as any);
};

// Helper to call mutation resolvers
const resolveMutation = (fieldName: keyof typeof resolvers.Mutation, args: any = {}) => {
    const resolverFn = resolvers.Mutation[fieldName];
    if (!resolverFn) throw new Error(`Resolver Mutation.${fieldName} not found`);
     // deno-lint-ignore no-explicit-any
    return resolverFn(null as any, args, mockContext as any);
};

describe("GraphQL Resolvers (resolvers.ts)", () => {

    // Clear stores before tests
    beforeAll(() => {
        if (typeof _clearAllStores === 'function') _clearAllStores();
    });
    beforeEach(() => {
        if (typeof _clearAllStores === 'function') _clearAllStores();
    });

    // --- Query Resolvers --- 
    describe("Query", () => {
        describe("myCanvases", () => {
            it("should return canvases belonging to the mock user", async () => {
                // Arrange: Create canvases for different users
                await createCanvasRecord({ userId: MOCK_USER_ID, title: "My Canvas 1" });
                await createCanvasRecord({ userId: OTHER_USER_ID, title: "Other User Canvas" });
                await createCanvasRecord({ userId: MOCK_USER_ID, title: "My Canvas 2" });
                
                // Act
                const result = await resolveQuery("myCanvases") as CanvasRecord[];

                // Assert
                assertEquals(result.length, 2);
                assert(result.some(c => c.title === "My Canvas 1"));
                assert(result.some(c => c.title === "My Canvas 2"));
                assert(!result.some(c => c.title === "Other User Canvas"));
            });

            it("should return empty array if mock user has no canvases", async () => {
                 // Arrange: Create canvas for another user only
                 await createCanvasRecord({ userId: OTHER_USER_ID, title: "Other User Canvas" });
                 // Act
                 const result = await resolveQuery("myCanvases") as CanvasRecord[];
                 // Assert
                 assertEquals(result.length, 0);
            });
        });

        describe("canvas", () => {
            let myCanvas: CanvasRecord;

            beforeEach(async () => {
                 // Create a canvas owned by the mock user before each test in this sub-suite
                 myCanvas = await createCanvasRecord({ userId: MOCK_USER_ID, title: "Specific Canvas" });
            });

            it("should return a specific canvas by ID if owned by mock user", async () => {
                // Act
                const result = await resolveQuery("canvas", { id: myCanvas.id }) as CanvasRecord;
                // Assert
                assertExists(result);
                assertEquals(result.id, myCanvas.id);
                assertEquals(result.title, myCanvas.title);
            });

            it("should return null if canvas ID does not exist", async () => {
                // Act
                const result = await resolveQuery("canvas", { id: "non-existent-id" });
                // Assert
                assertEquals(result, null);
            });

            it("should return null if canvas is owned by another user", async () => {
                 // Arrange: Create canvas owned by someone else
                 const otherCanvas = await createCanvasRecord({ userId: OTHER_USER_ID });
                 // Act
                 const result = await resolveQuery("canvas", { id: otherCanvas.id });
                 // Assert
                 assertEquals(result, null);
            });
        });
    });

    // --- Nested Resolvers (Canvas.blocks, Canvas.connections) --- 
    describe("Nested Resolvers", () => {
        let canvas: CanvasRecord;
        let block1: BlockRecord;
        let block2: BlockRecord;
        let conn1: ConnectionRecord;

        beforeEach(async () => {
            // Setup a canvas with blocks and connections
            canvas = await createCanvasRecord({ userId: MOCK_USER_ID });
            block1 = await createBlockRecord({ canvasId: canvas.id, userId: MOCK_USER_ID, type: 'text', position: {x:0,y:0} });
            block2 = await createBlockRecord({ canvasId: canvas.id, userId: MOCK_USER_ID, type: 'text', position: {x:1,y:1} });
            conn1 = await createConnectionRecord(canvas.id, block1.id, block2.id);
        });

        it("Canvas.blocks should resolve blocks for the parent canvas", async () => {
            // Act: Call the nested resolver directly with 3 args
            const blocksResolver = resolvers.Canvas.blocks;
            // deno-lint-ignore no-explicit-any
            const resolvedBlocks = await blocksResolver(canvas, {}, mockContext as any);

            // Assert
            assertEquals(resolvedBlocks.length, 2);
            assert(resolvedBlocks.some(b => b.id === block1.id));
            assert(resolvedBlocks.some(b => b.id === block2.id));
        });

        it("Canvas.connections should resolve connections for the parent canvas", async () => {
            // Act: Call the nested resolver directly with only parent arg
            const connectionsResolver = resolvers.Canvas.connections;
            const resolvedConnections = await connectionsResolver(canvas);
            
            // Assert
            assertEquals(resolvedConnections.length, 1);
            assertEquals(resolvedConnections[0].id, conn1.id);
            assertEquals(resolvedConnections[0].sourceBlockId, block1.id);
        });
    });

    // --- Mutation Resolvers --- 
    describe("Mutation", () => {
        describe("createCanvas", () => {
            it("should create a canvas with a default title", async () => {
                // Act
                const result = await resolveMutation("createCanvas", {}) as CanvasRecord;

                // Assert
                assertExists(result.id);
                assertEquals(result.userId, MOCK_USER_ID);
                assert(result.title.startsWith("Untitled Canvas"));
                
                // Verify in DB layer
                const fetched = await getCanvasById(result.id);
                assertExists(fetched);
                assertEquals(fetched.title, result.title);
            });

            it("should create a canvas with a specified title", async () => {
                const title = "My New Canvas";
                // Act
                const result = await resolveMutation("createCanvas", { title }) as CanvasRecord;

                // Assert
                assertEquals(result.title, title);
                 // Verify in DB layer
                 const fetched = await getCanvasById(result.id);
                 assertEquals(fetched?.title, title);
            });
        });

        describe("updateCanvasTitle", () => {
            let testCanvas: CanvasRecord;

            beforeEach(async () => {
                // Create a canvas owned by the mock user before each test
                testCanvas = await createCanvasRecord({ userId: MOCK_USER_ID });
            });

            it("should update the title of an owned canvas", async () => {
                const newTitle = "Updated Title via Mutation";
                // Act
                const result = await resolveMutation("updateCanvasTitle", { id: testCanvas.id, title: newTitle }) as CanvasRecord;

                // Assert
                assertEquals(result.id, testCanvas.id);
                assertEquals(result.title, newTitle);
                // Use >= to be slightly more robust with test timing
                assert(result.updatedAt >= testCanvas.updatedAt, "Update timestamp should be same or later"); 

                // Verify in DB layer
                const fetched = await getCanvasById(testCanvas.id);
                assertEquals(fetched?.title, newTitle);
            });

            it("should reject if title is empty or whitespace", async () => {
                 await assertRejects(
                    async () => { await resolveMutation("updateCanvasTitle", { id: testCanvas.id, title: "   " }); },
                    Error, // Or GraphQLError if used
                    "Canvas title cannot be empty"
                 );
            });

            it("should reject if canvas ID does not exist", async () => {
                 await assertRejects(
                    async () => { await resolveMutation("updateCanvasTitle", { id: "bad-id", title: "New Title" }); },
                    Error, // Or GraphQLError
                    "Canvas not found"
                 );
            });

             it("should reject if canvas is owned by another user", async () => {
                 // Arrange: Create canvas owned by someone else
                 const otherCanvas = await createCanvasRecord({ userId: OTHER_USER_ID });
                 // Act & Assert
                 await assertRejects(
                    async () => { await resolveMutation("updateCanvasTitle", { id: otherCanvas.id, title: "New Title" }); },
                    Error, // Or GraphQLError
                    "Canvas not found" // Resolver currently throws generic error for not found/not owned
                 );
            });
        });

        // --- Block Mutations ---
        describe("createBlock", () => {
            let testCanvas: CanvasRecord;
            beforeEach(async () => {
                testCanvas = await createCanvasRecord({ userId: MOCK_USER_ID });
            });

            it("should create a block for an owned canvas", async () => {
                const args = { canvasId: testCanvas.id, type: "shape", position: { x: 10, y: 10 }, content: { type: "rect" } };
                const result = await resolveMutation("createBlock", args) as BlockRecord;

                assertExists(result.id);
                assertEquals(result.canvasId, testCanvas.id);
                assertEquals(result.userId, MOCK_USER_ID);
                assertEquals(result.type, args.type);
                assertEquals(result.position, args.position);
                assertEquals(result.content, args.content);

                // Verify in DB
                const fetched = await getBlockById(result.id);
                assertExists(fetched);
            });

            it("should reject if canvas ID does not exist", async () => {
                const args = { canvasId: "bad-canvas-id", type: "text", position: { x: 0, y: 0 } };
                await assertRejects(async () => { await resolveMutation("createBlock", args); }, Error, "Canvas not found");
            });

            it("should reject if canvas is owned by another user", async () => {
                const otherCanvas = await createCanvasRecord({ userId: OTHER_USER_ID });
                const args = { canvasId: otherCanvas.id, type: "text", position: { x: 0, y: 0 } };
                await assertRejects(async () => { await resolveMutation("createBlock", args); }, Error, "Canvas not found");
            });

            it("should reject if required fields (type, position) are missing", async () => {
                 await assertRejects(async () => { await resolveMutation("createBlock", { canvasId: testCanvas.id, position: {x:0,y:0} }); }, Error, "type and position");
                 await assertRejects(async () => { await resolveMutation("createBlock", { canvasId: testCanvas.id, type: "text" }); }, Error, "type and position");
                 await assertRejects(async () => { await resolveMutation("createBlock", { canvasId: testCanvas.id, type: "text", position: { x: 0 } }); }, Error, "type and position"); // Missing y
            });
        });

        describe("undoBlockCreation", () => {
             let testBlock: BlockRecord;

             beforeEach(async () => {
                 const canvas = await createCanvasRecord({ userId: MOCK_USER_ID });
                 testBlock = await createBlockRecord({ canvasId: canvas.id, userId: MOCK_USER_ID, type: 'text', position: {x:0,y:0} });
             });

            it("should delete a recently created block owned by the user", async () => {
                // Act - assumes test runs within grace period
                const result = await resolveMutation("undoBlockCreation", { blockId: testBlock.id }) as boolean;
                assertEquals(result, true);
                // Verify in DB
                const fetched = await getBlockById(testBlock.id);
                assertEquals(fetched, undefined);
            });

            it("should return false if block is outside grace period", async () => {
                 // Arrange: Make the block seem old (modify createdAt)
                 const oldDate = new Date(Date.now() - 60 * 1000); // 1 min ago
                 testBlock.createdAt = oldDate; // Note: This modifies the in-memory record directly for test purposes
                 
                 // Act
                 const result = await resolveMutation("undoBlockCreation", { blockId: testBlock.id }) as boolean;
                 assertEquals(result, false);
                 // Verify block still exists in DB
                 const fetched = await getBlockById(testBlock.id);
                 assertExists(fetched);
            });

            it("should return false if block ID does not exist", async () => {
                 const result = await resolveMutation("undoBlockCreation", { blockId: "bad-id" }) as boolean;
                 assertEquals(result, false);
            });

            it("should return false if block is owned by another user", async () => {
                 // Arrange: Create block owned by someone else
                 const otherCanvas = await createCanvasRecord({ userId: OTHER_USER_ID });
                 const otherBlock = await createBlockRecord({ canvasId: otherCanvas.id, userId: OTHER_USER_ID, type: 'text', position: {x:0,y:0} });
                 // Act
                 const result = await resolveMutation("undoBlockCreation", { blockId: otherBlock.id }) as boolean;
                 assertEquals(result, false);
            });
        });

        describe("updateBlockPosition", () => {
            let testBlock: BlockRecord;
            beforeEach(async () => {
                 const canvas = await createCanvasRecord({ userId: MOCK_USER_ID });
                 testBlock = await createBlockRecord({ canvasId: canvas.id, userId: MOCK_USER_ID, type: 'text', position: {x:10,y:10} });
             });

            it("should update position for an owned block", async () => {
                const newPosition = { x: 100, y: 200 };
                const result = await resolveMutation("updateBlockPosition", { blockId: testBlock.id, position: newPosition }) as BlockRecord;
                assertEquals(result.id, testBlock.id);
                assertEquals(result.position, newPosition);
                assert(result.updatedAt >= testBlock.updatedAt, "Update timestamp should be same or later");

                const fetched = await getBlockById(testBlock.id);
                assertEquals(fetched?.position, newPosition);
            });

            it("should reject if position data is invalid", async () => {
                await assertRejects(async () => { await resolveMutation("updateBlockPosition", { blockId: testBlock.id, position: { x: 1 } }); }, Error, "Invalid position");
                await assertRejects(async () => { await resolveMutation("updateBlockPosition", { blockId: testBlock.id, position: null }); }, Error, "Invalid position");
            });

            it("should reject if block ID does not exist", async () => {
                await assertRejects(async () => { await resolveMutation("updateBlockPosition", { blockId: "bad-id", position: {x:1,y:1} }); }, Error, "Block not found");
            });

            it("should reject if block is owned by another user", async () => {
                 const otherCanvas = await createCanvasRecord({ userId: OTHER_USER_ID });
                 const otherBlock = await createBlockRecord({ canvasId: otherCanvas.id, userId: OTHER_USER_ID, type: 'text', position: {x:0,y:0} });
                 await assertRejects(async () => { await resolveMutation("updateBlockPosition", { blockId: otherBlock.id, position: {x:1,y:1} }); }, Error, "Block not found");
            });
        });
        
        describe("updateBlockContent", () => {
             let testBlock: BlockRecord;
            beforeEach(async () => {
                 const canvas = await createCanvasRecord({ userId: MOCK_USER_ID });
                 testBlock = await createBlockRecord({ canvasId: canvas.id, userId: MOCK_USER_ID, type: 'text', position: {x:0,y:0}, content: {"text": "old"} });
             });

            it("should update content for an owned block", async () => {
                const newContent = { text: "new content", value: 123 };
                const result = await resolveMutation("updateBlockContent", { blockId: testBlock.id, content: newContent }) as BlockRecord;
                assertEquals(result.id, testBlock.id);
                assertEquals(result.content, newContent);
                assert(result.updatedAt >= testBlock.updatedAt, "Update timestamp should be same or later");

                const fetched = await getBlockById(testBlock.id);
                assertEquals(fetched?.content, newContent);
            });

            it("should reject if content is null or undefined", async () => {
                await assertRejects(async () => { await resolveMutation("updateBlockContent", { blockId: testBlock.id, content: null }); }, Error, "Content cannot be null");
                await assertRejects(async () => { await resolveMutation("updateBlockContent", { blockId: testBlock.id, content: undefined }); }, Error, "Content cannot be null");
            });

            it("should reject if block ID does not exist", async () => {
                await assertRejects(async () => { await resolveMutation("updateBlockContent", { blockId: "bad-id", content: {"a":1} }); }, Error, "Block not found");
            });

            it("should reject if block is owned by another user", async () => {
                 const otherCanvas = await createCanvasRecord({ userId: OTHER_USER_ID });
                 const otherBlock = await createBlockRecord({ canvasId: otherCanvas.id, userId: OTHER_USER_ID, type: 'text', position: {x:0,y:0} });
                 await assertRejects(async () => { await resolveMutation("updateBlockContent", { blockId: otherBlock.id, content: {"a":1} }); }, Error, "Block not found");
            });
        });

        // --- Connection Mutations ---
        describe("createConnection", () => {
            let testCanvas: CanvasRecord;
            let block1: BlockRecord;
            let block2: BlockRecord;

            beforeEach(async () => {
                testCanvas = await createCanvasRecord({ userId: MOCK_USER_ID });
                block1 = await createBlockRecord({ canvasId: testCanvas.id, userId: MOCK_USER_ID, type: 'text', position: {x:0,y:0} });
                block2 = await createBlockRecord({ canvasId: testCanvas.id, userId: MOCK_USER_ID, type: 'text', position: {x:1,y:1} });
            });

            it("should create a connection between blocks on an owned canvas", async () => {
                const args = {
                    canvasId: testCanvas.id,
                    sourceBlockId: block1.id,
                    targetBlockId: block2.id,
                    sourceHandle: "a",
                    targetHandle: "b"
                };
                const result = await resolveMutation("createConnection", args) as ConnectionRecord;

                assertExists(result.id);
                assertEquals(result.canvasId, testCanvas.id);
                assertEquals(result.sourceBlockId, block1.id);
                assertEquals(result.targetBlockId, block2.id);
                assertEquals(result.sourceHandle, args.sourceHandle);
                assertEquals(result.targetHandle, args.targetHandle);

                // Verify in DB
                const conns = await listConnectionsByCanvas(testCanvas.id);
                assertEquals(conns.length, 1);
                assertEquals(conns[0].id, result.id);
            });

            it("should reject if canvas ID does not exist", async () => {
                const args = { canvasId: "bad-id", sourceBlockId: block1.id, targetBlockId: block2.id };
                await assertRejects(async () => { await resolveMutation("createConnection", args); }, Error, "Canvas not found");
            });

            it("should reject if canvas is owned by another user", async () => {
                const otherCanvas = await createCanvasRecord({ userId: OTHER_USER_ID });
                // Use blocks from the correct canvas for the args, but try to create on wrong canvas
                const args = { canvasId: otherCanvas.id, sourceBlockId: block1.id, targetBlockId: block2.id }; 
                await assertRejects(async () => { await resolveMutation("createConnection", args); }, Error, "Canvas not found");
            });

            // TODO: Add tests for validating source/target blocks if implemented in resolver
        });

        describe("deleteConnection", () => {
             let testConn: ConnectionRecord;

             beforeEach(async () => {
                 const canvas = await createCanvasRecord({ userId: MOCK_USER_ID });
                 const b1 = await createBlockRecord({ canvasId: canvas.id, userId: MOCK_USER_ID, type: 't', position:{x:0,y:0}}); 
                 const b2 = await createBlockRecord({ canvasId: canvas.id, userId: MOCK_USER_ID, type: 't', position:{x:1,y:1}}); 
                 testConn = await createConnectionRecord(canvas.id, b1.id, b2.id);
             });

            it("should delete an existing connection", async () => {
                 // Act
                 const result = await resolveMutation("deleteConnection", { connectionId: testConn.id }) as boolean;
                 assertEquals(result, true);
                 // Verify in DB
                 const success = await deleteConnectionRecord(testConn.id);
                 assertEquals(success, false); // Should fail to delete again
            });

            it("should reject if connection ID does not exist", async () => {
                await assertRejects(
                    async () => { await resolveMutation("deleteConnection", { connectionId: "bad-id" }); }, 
                    Error, 
                    "Connection not found"
                );
            });
            
            // TODO: Add test for ownership check if implemented in resolver
            // (e.g., ensure user owns the canvas the connection belongs to)
        });
    });
}); 