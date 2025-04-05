import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Controls, Background, MiniMap,
    useNodesState, useEdgesState, Node, Edge, BackgroundVariant,
    OnNodesChange, NodeChange // Import relevant types
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMutation } from '@tanstack/react-query';
import { undoBlockCreation, Block } from '../lib/api';
import styles from './CanvasWorkspace.module.css';

const UNDO_GRACE_PERIOD_MS = 30 * 1000;

// --- Helper: Map API Block to ReactFlow Node ---
const mapBlockToNode = (block: Block): Node => ({
    id: block.id,
    type: 'default', // TODO: Customize node types based on block.type
    position: block.position,
    data: { label: block.content?.text || block.type }, // Basic label
    // Include original size if needed, or make nodes resizable later
    // width: block.size.width,
    // height: block.size.height,
});

interface CanvasWorkspaceProps {
    initialBlocks: Block[];
    // Callback for parent to handle node position changes (for saving)
    onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
    // Callback to trigger undo notification from parent
    showUndo?: (blockId: string) => void;
}

export function CanvasWorkspace({ initialBlocks, onNodeDragStop }: CanvasWorkspaceProps) {
    const initialNodes = initialBlocks.map(mapBlockToNode);
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [undoBlockId, setUndoBlockId] = useState<string | null>(null);
    const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

    // Sync internal nodes state if the initialBlocks prop changes externally
    useEffect(() => {
        // Basic sync - assumes parent manages the canonical list
        setNodes(initialBlocks.map(mapBlockToNode));
    }, [initialBlocks, setNodes]);

    // Wrap internal onNodesChange to potentially notify parent or add custom logic
    const handleNodesChange: OnNodesChange = useCallback(
        (changes: NodeChange[]) => {
            onNodesChangeInternal(changes);
            // TODO: Could filter for position changes and debounce updates to parent/backend
            // console.log("Node changes:", changes);
        },
        [onNodesChangeInternal]
    );

    const { mutate: performUndoBlockCreation } = useMutation({
        mutationFn: undoBlockCreation,
        onSuccess: (success, blockId) => {
            if (success) {
                console.log(`Block ${blockId} undone`);
                // No need to manually filter nodes if parent updates initialBlocks
                // setNodes((nds) => nds.filter((node) => node.id !== blockId));
                setUndoBlockId(null);
                if (undoTimeoutId) clearTimeout(undoTimeoutId);
                // Parent should refetch/update initialBlocks which will sync via useEffect
            } else {
                handleUndoFail(blockId);
            }
        },
        onError: (err, blockId) => {
            console.error(`Error undoing block creation for ${blockId}:`, err);
            alert("Failed to undo block.");
            handleUndoFail(blockId);
        }
    });

    const handleUndoFail = (blockId: string) => {
         console.warn(`Failed to undo block ${blockId} (likely expired)`);
         alert("Undo period expired or failed.");
         if (undoBlockId === blockId) setUndoBlockId(null);
         if (undoTimeoutId) clearTimeout(undoTimeoutId);
    }

    // Expose function to parent to trigger the undo notification
    // This might be better handled via a ref if preferred
    const showUndoNotification = useCallback((blockId: string) => {
        console.log("[Workspace] Showing undo for", blockId);
        setUndoBlockId(blockId);
        if (undoTimeoutId) clearTimeout(undoTimeoutId);
        const timeoutId = window.setTimeout(() => { // Use window.setTimeout for clarity
            setUndoBlockId(null);
        }, UNDO_GRACE_PERIOD_MS - 1000);
        setUndoTimeoutId(timeoutId);
    }, [undoTimeoutId]);

    // Make showUndoNotification available to parent (e.g., via ref or context)
    // For now, we rely on parent calling it after createBlock success.
    // We need to lift the mutation or pass down a callback.

    const handleUndoClick = () => {
        if (undoBlockId) {
            performUndoBlockCreation(undoBlockId);
        }
    };

    return (
        <div className={styles.canvasArea}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange} // Use wrapped handler
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop} // Pass up drag events
                fitView
                className={styles.reactFlowInstance}
                // TODO: Add onConnect handler for creating connections
            >
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>

            {/* Undo Notification */} 
            {undoBlockId && (
                <div className={styles.undoNotification}>
                    <span>Block created.</span>
                    <button onClick={handleUndoClick}>Undo</button>
                </div>
            )}
        </div>
    );
} 