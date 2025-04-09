import { useEffect } from 'react';
import {
    Edge,
    Node,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import { CanvasData } from '../lib/api';
import { mapBlockToNode, mapConnectionToEdge } from '../lib/canvasUtils';

/**
 * Custom hook to manage React Flow nodes and edges state,
 * synchronizing with fetched canvas data.
 *
 * @param canvasData The fetched canvas data from the API.
 * @returns An object containing nodes, edges, onNodesChange, onEdgesChange, and setEdges.
 */
export function useReactFlowState(canvasData: CanvasData | null | undefined) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

    // Effect to update React Flow state when canvasData is fetched/changed
    useEffect(() => {
        if (canvasData) {
            console.log("[useReactFlowState Effect] Updating nodes from canvasData:", canvasData.blocks);
            setNodes(canvasData.blocks?.map(mapBlockToNode) || []);
            console.log("[useReactFlowState Effect] Updating edges from canvasData:", canvasData.connections);
            setEdges(canvasData.connections?.map(mapConnectionToEdge) || []);
        } else {
            console.log("[useReactFlowState Effect] Clearing nodes and edges as canvasData is null/undefined");
            // Optionally clear state if canvasData becomes null after being loaded
            // setNodes([]);
            // setEdges([]);
        }
        // Only re-run if canvasData itself changes reference
    }, [canvasData, setNodes, setEdges]);

    // Expose setEdges directly if needed for optimistic updates on connection creation/deletion
    return { nodes, edges, onNodesChange, onEdgesChange, setEdges, setNodes };
}
