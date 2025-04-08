import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
    Controls, Background, MiniMap,
    Node, Edge, BackgroundVariant,
    OnNodesChange, NodeChange,
    OnEdgesChange, EdgeChange,
    NodeProps,
    addEdge,
    type Connection,
    type FitViewOptions,
    type Viewport,
    ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMutation } from '@tanstack/react-query';
import { undoBlockCreation, Block } from '../lib/api';
import styles from './CanvasWorkspace.module.css';
import StyledBlockNode from './StyledBlockNode';

const UNDO_GRACE_PERIOD_MS = 30 * 1000;

// Define the node types object
const nodeTypes = {
    styledBlockNode: StyledBlockNode,
    // linkNode: LinkNode,
    // default: DefaultNode,
};

// --- Helper: Map API Block to ReactFlow Node ---
const mapBlockToNode = (block: Block): Node => {
    // Determine label based on type and content
    let label = block.type; // Default label is the type
    
    if (block.content && typeof block.content === 'object') {
        if ('text' in block.content) {
            label = block.content.text as string;
        } else if ('url' in block.content) {
            label = block.content.url as string;
        }
    }
    
    return {
        id: block.id,
        type: 'default', // TODO: Customize node types based on block.type
        position: block.position,
        data: { label: label }, // Use the determined label
        // Include original size if needed, or make nodes resizable later
        // width: block.size.width,
        // height: block.size.height,
    };
};

interface CanvasWorkspaceProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    canvasTitle: string;
    onSaveTitle: (newTitle: string) => void;
    onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
    onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
    onConnect: (connection: Connection | Edge) => void;
    onEdgesDelete: (deletedEdges: Edge[]) => void;
    showUndo?: (blockId: string) => void;
    onBackgroundDoubleClick?: (position: { x: number, y: number }) => void;
}

export function CanvasWorkspace({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    canvasTitle,
    onSaveTitle,
    onNodeDragStop,
    onNodeClick,
    onNodeDoubleClick,
    onConnect,
    onEdgesDelete,
    onBackgroundDoubleClick
}: CanvasWorkspaceProps) {
    // Refs for ReactFlow instance and wrapper
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [undoBlockId, setUndoBlockId] = useState<string | null>(null);
    const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

    const { mutate: performUndoBlockCreation } = useMutation({
        mutationFn: undoBlockCreation,
        onSuccess: (success, blockId) => {
            if (success) {
                console.log(`Block ${blockId} undone`);
                setUndoBlockId(null);
                if (undoTimeoutId) clearTimeout(undoTimeoutId);
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

    const handleUndoClick = () => {
        if (undoBlockId) {
            performUndoBlockCreation(undoBlockId);
        }
    };

    const handleConnect = useCallback(
        (connection: Connection | Edge) => {
            onConnect(connection);
        },
        [onConnect]
    );
    
    // Handler for background double-click
    const handlePaneDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            if (!onBackgroundDoubleClick || !reactFlowInstance || !reactFlowWrapper.current) return;
            
            // Get the ReactFlow instance to convert screen to flow coordinates
            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });
            
            onBackgroundDoubleClick(position);
        },
        [onBackgroundDoubleClick, reactFlowInstance]
    );

    // Define fit view options (without event handlers)
    const fitViewOptions: FitViewOptions = {
        padding: 0.2,
        includeHiddenNodes: false,
        minZoom: 0.5,
        maxZoom: 2
    };

    return (
        <div className={styles.canvasArea} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onConnect={handleConnect}
                onEdgesDelete={onEdgesDelete}
                onDoubleClick={handlePaneDoubleClick}
                onInit={setReactFlowInstance}
                zoomOnDoubleClick={false}
                fitView
                fitViewOptions={fitViewOptions}
                className={styles.reactFlowInstance}
                nodeTypes={nodeTypes}
            >
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>

            {/* Undo Notification - Managed by parent for now */} 
            {/* {undoBlockId && (
                <div className={styles.undoNotification}>
                    <span>Block created.</span>
                    <button onClick={handleUndoClick}>Undo</button>
                </div>
            )} */}
        </div>
    );
}
