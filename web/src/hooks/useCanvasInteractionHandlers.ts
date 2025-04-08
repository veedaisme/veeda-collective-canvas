import React, { useCallback, useRef } from 'react';
import { Node, Edge, Connection } from 'reactflow';
import { Block, LinkBlockContent, TextBlockContent } from '../lib/api';
import { isLinkBlockContent, isTextBlockContent } from '../lib/canvasUtils';
import { NODE_DRAG_THRESHOLD } from '../lib/constants';

// Define the types for the mutation functions this hook needs
interface CanvasMutations {
    performUpdateBlockPosition: (args: { blockId: string; position: { x: number; y: number } }) => void;
    performCreateConnection: (args: {
        canvasId: string;
        sourceBlockId: string;
        targetBlockId: string;
        sourceHandle: string | null;
        targetHandle: string | null;
    }) => void;
    performDeleteConnection: (args: { connectionId: string }) => void;
}

// Define the types for the UI state handlers this hook needs
interface CanvasUIHandlers {
    setSelectedNode: (node: Node | null) => void;
    handleOpenNotesEditor: (blockId: string, currentNotes: string) => void;
    handleOpenBlockCreator: (position: { x: number, y: number }) => void;
}

/**
 * Custom hook to manage React Flow interaction handlers.
 *
 * @param canvasId The ID of the current canvas.
 * @param mutations An object containing the mutation functions.
 * @param uiHandlers An object containing UI state handlers.
 * @returns An object containing the interaction handlers for React Flow.
 */
export function useCanvasInteractionHandlers(
    canvasId: string | undefined,
    mutations: CanvasMutations,
    uiHandlers: CanvasUIHandlers
) {
    const { performUpdateBlockPosition, performCreateConnection, performDeleteConnection } = mutations;
    const { setSelectedNode, handleOpenNotesEditor, handleOpenBlockCreator } = uiHandlers;

    // Ref to store starting position during drag
    const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    // Ref for single click timeout
    const clickTimeoutRef = useRef<number | null>(null);

    const handleNodeDragStart = useCallback((_event: React.MouseEvent, node: Node) => {
        dragStartPositionsRef.current.set(node.id, { ...node.position });
    }, []);

    const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
        const startPos = dragStartPositionsRef.current.get(node.id);
        dragStartPositionsRef.current.delete(node.id); // Clean up ref

        if (!startPos) {
            // If no start position was recorded (shouldn't happen often), update anyway
            performUpdateBlockPosition({ blockId: node.id, position: node.position });
            return;
        }

        const dx = Math.abs(node.position.x - startPos.x);
        const dy = Math.abs(node.position.y - startPos.y);

        // Only update if movement exceeds the threshold
        if (dx >= NODE_DRAG_THRESHOLD || dy >= NODE_DRAG_THRESHOLD) {
            console.log(`Updating position for ${node.id} after drag`);
            performUpdateBlockPosition({ blockId: node.id, position: node.position });
        } else {
            console.log(`Skipping position update for ${node.id}, movement too small (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
        }
    }, [performUpdateBlockPosition]);

    const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        // Clear any previous timeout
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        // Set a timeout to handle the single click after a delay
        clickTimeoutRef.current = window.setTimeout(() => {
            console.log('Node Single Click Action:', node.id);
            setSelectedNode(node); // Open sidebar
            clickTimeoutRef.current = null;
        }, 250); // Adjust delay as needed (e.g., 200-300ms)
    }, [setSelectedNode]);

    const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
        // Clear the single click timeout if it exists
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        setSelectedNode(null); // Ensure sidebar is closed
        console.log("Node Double Click Action:", node.id);
        const blockData = node.data.rawBlock as Block | undefined;
        if (!blockData) {
            console.error("No raw block data found on double-clicked node:", node.id);
            return;
        }

        if (blockData.type === 'text' && isTextBlockContent(blockData.content)) {
            // TODO: Implement text editing modal opening if needed
            console.log("Opening notes editor for text block (double-click):", blockData.id);
            handleOpenNotesEditor(blockData.id, blockData.notes || '');
        } else if (blockData.type === 'link' && isLinkBlockContent(blockData.content)) {
            const url = blockData.content.url;
            let clickableUrl = url;
            if (!/^https?:\/\//i.test(clickableUrl)) {
                clickableUrl = `http://${clickableUrl}`;
            }
            try {
                window.open(clickableUrl, '_blank', 'noopener,noreferrer');
            } catch (e) {
                console.error("Failed to open URL:", clickableUrl, e);
                alert(`Could not open URL: ${clickableUrl}`);
            }
        } else {
            // Default to opening notes editor for other types or if content check fails
            console.log("Opening notes editor for block type (double-click):", blockData.type);
            handleOpenNotesEditor(blockData.id, blockData.notes || '');
        }
    }, [setSelectedNode, handleOpenNotesEditor]);

    const handleConnect = useCallback((connection: Connection | Edge) => {
        console.log('Attempting to connect:', connection);
        if (!connection.source || !connection.target || !canvasId) {
            console.warn("Connection attempt missing required data", { connection, canvasId });
            return;
        }
        // Handles can be undefined on Edge type, default to null for API
        const sourceHandle = ('sourceHandle' in connection ? connection.sourceHandle : null) ?? null;
        const targetHandle = ('targetHandle' in connection ? connection.targetHandle : null) ?? null;

        performCreateConnection({
            canvasId: canvasId,
            sourceBlockId: connection.source,
            targetBlockId: connection.target,
            sourceHandle: sourceHandle,
            targetHandle: targetHandle,
        });
    }, [canvasId, performCreateConnection]);

    const handleEdgesDelete = useCallback((deletedEdges: Edge[]) => {
        console.log('Attempting to delete edges:', deletedEdges);
        deletedEdges.forEach(edge => {
            performDeleteConnection({ connectionId: edge.id });
        });
    }, [performDeleteConnection]);

    // Modified to accept position directly
    const handleBackgroundDoubleClick = useCallback((position: { x: number, y: number }) => {
        console.log('Background Double Clicked at flow position:', position);
        handleOpenBlockCreator(position);
    }, [handleOpenBlockCreator]);


    return {
        handleNodeDragStart,
        handleNodeDragStop,
        handleNodeClick,
        handleNodeDoubleClick,
        handleConnect,
        handleEdgesDelete,
        handleBackgroundDoubleClick,
    };
}
