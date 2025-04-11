import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
    Controls, Background, MiniMap,
    Node, Edge, BackgroundVariant,
    OnNodesChange,
    OnEdgesChange,
    type Connection,
    type FitViewOptions,
    ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './CanvasWorkspace.module.css';
import StyledBlockNode from './StyledBlockNode';

import TextBlockNode from './TextBlockNode';
import LinkBlockNode from './LinkBlockNode';

const nodeTypes = {
    styledBlockNode: StyledBlockNode,
    textBlockNode: TextBlockNode,
    linkBlockNode: LinkBlockNode,
};

interface CanvasWorkspaceProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onNodeDragStart?: (event: React.MouseEvent, node: Node) => void;
    onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
    onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
    onConnect: (connection: Connection | Edge) => void;
    onEdgesDelete: (deletedEdges: Edge[]) => void;
    showUndo?: (blockId: string) => void;
    onBackgroundDoubleClick?: (position: { x: number, y: number }) => void;
    readOnly?: boolean;
}

export function CanvasWorkspace({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStart,
    onNodeDragStop,
    onNodeClick,
    onNodeDoubleClick,
    onConnect,
    onEdgesDelete,
    onBackgroundDoubleClick,
    readOnly = false
}: CanvasWorkspaceProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const handleConnect = useCallback(
        (connection: Connection | Edge) => {
            onConnect(connection);
        },
        [onConnect]
    );
    
    const handlePaneDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            if (readOnly) return;
            if (!onBackgroundDoubleClick || !reactFlowInstance || !reactFlowWrapper.current) return;
            
            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });
            
            onBackgroundDoubleClick(position);
        },
        [onBackgroundDoubleClick, reactFlowInstance, readOnly]
    );

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
                onDoubleClick={handlePaneDoubleClick}
                onInit={setReactFlowInstance}
                zoomOnDoubleClick={false}
                fitView
                fitViewOptions={fitViewOptions}
                className={styles.reactFlowInstance}
                nodeTypes={nodeTypes}
                // Disable editing features if readOnly
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                elementsSelectable={!readOnly}
                panOnDrag={!readOnly}
                onNodeDragStart={readOnly ? undefined : onNodeDragStart}
                onNodeDragStop={readOnly ? undefined : onNodeDragStop}
                onNodeClick={readOnly ? undefined : onNodeClick}
                onNodeDoubleClick={readOnly ? undefined : onNodeDoubleClick}
                onConnect={readOnly ? undefined : handleConnect}
                onEdgesDelete={readOnly ? undefined : onEdgesDelete}
            >
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}
