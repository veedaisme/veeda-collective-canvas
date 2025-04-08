import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createBlock,
    createConnection,
    deleteConnection,
    undoBlockCreation,
    updateBlockContent,
    updateBlockNotes,
    updateBlockPosition,
    updateCanvasTitle,
    Canvas as CanvasBase, // Rename to avoid conflict
    CanvasData,
    Connection as ApiConnection,
    Block,
} from '../lib/api';
import { queryKeys } from '../lib/constants';
import { Edge, addEdge } from 'reactflow'; // Import addEdge for optimistic updates
import { mapConnectionToEdge } from '../lib/canvasUtils'; // Import mapper

// Define an extended Canvas type that includes connections if not already globally available
// This might be redundant if api.ts is updated, but safe for now.
type CanvasWithConnections = CanvasBase & {
  connections?: ApiConnection[];
};

/**
 * Custom hook to manage all mutations related to the canvas.
 *
 * @param canvasId The ID of the current canvas.
 * @param setEdges React Flow's setEdges function for optimistic updates.
 * @param showUndoNotification Callback to display the undo notification.
 * @param handleUndoFail Callback to handle undo failure/expiration.
 * @returns An object containing mutation functions and their pending states.
 */
export function useCanvasMutations(
    canvasId: string | undefined,
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    showUndoNotification: (blockId: string) => void,
    handleUndoFail: (blockId: string) => void,
) {
    const queryClient = useQueryClient();

    // --- Mutations ---

    const { mutate: performCreateBlock, isPending: isCreatingBlock } = useMutation({
        mutationFn: createBlock,
        onSuccess: (newBlock) => {
            console.log("Block created:", newBlock);
            queryClient.setQueryData<CanvasData>(queryKeys.canvas(canvasId!), (oldData) => {
                if (!oldData) return undefined;
                return {
                    ...oldData,
                    blocks: [...(oldData.blocks || []), newBlock],
                };
            });
            showUndoNotification(newBlock.id);
        },
        onError: (err) => {
            console.error("Error creating block:", err);
            alert("Failed to create block");
        },
    });

    const { mutate: performUndoBlockCreation } = useMutation({
        mutationFn: undoBlockCreation,
        onSuccess: (success, blockId) => {
            if (success) {
                console.log(`[Mutation] Block ${blockId} undone successfully.`);
                queryClient.invalidateQueries({ queryKey: queryKeys.canvas(canvasId!) });
                // Let the calling component handle UI state like clearing undoBlockId
            } else {
                handleUndoFail(blockId); // Call the passed-in handler
            }
        },
        onError: (err, blockId) => {
            console.error(`[Mutation] Error undoing block creation for ${blockId}:`, err);
            alert("Failed to undo block.");
            handleUndoFail(blockId); // Call the passed-in handler
        }
    });

    const { mutate: performUpdateBlockPosition } = useMutation({
        mutationFn: updateBlockPosition,
        onSuccess: (updatedBlockData, variables) => {
            if (!updatedBlockData) return;
            console.log(`Block ${variables.blockId} position updated`);
            queryClient.setQueryData<CanvasData>(queryKeys.canvas(canvasId!), (oldData) => {
                if (!oldData || !oldData.blocks) return oldData;
                return {
                    ...oldData,
                    blocks: oldData.blocks.map(block =>
                        block.id === variables.blockId
                            ? { ...block, position: updatedBlockData.position, updatedAt: updatedBlockData.updatedAt }
                            : block
                    ),
                };
            });
        },
        onError: (err, variables) => {
            console.error(`Error updating position for block ${variables.blockId}:`, err);
            alert(`Failed to save block position for ${variables.blockId}.`);
            // Consider reverting optimistic update if implemented elsewhere
            // queryClient.invalidateQueries({ queryKey: queryKeys.canvas(canvasId!) });
        },
    });

    const { mutate: performUpdateBlockContent } = useMutation({
        mutationFn: updateBlockContent,
        onSuccess: (updatedBlockData, variables) => {
            if (!updatedBlockData) return;
            console.log(`Block ${variables.blockId} content updated`);
            queryClient.setQueryData<CanvasData>(queryKeys.canvas(canvasId!), (oldData) => {
                if (!oldData || !oldData.blocks) return oldData;
                return {
                    ...oldData,
                    blocks: oldData.blocks.map(block =>
                        block.id === variables.blockId
                            ? { ...block, content: updatedBlockData.content, updatedAt: updatedBlockData.updatedAt }
                            : block
                    ),
                };
            });
        },
        onError: (err, variables) => {
            console.error(`Error updating content for block ${variables.blockId}:`, err);
            alert(`Failed to save block content for ${variables.blockId}.`);
        },
    });

    const { mutate: performUpdateBlockNotes, isPending: isUpdatingNotes } = useMutation({
        mutationFn: updateBlockNotes,
        onSuccess: (updatedBlockData, variables) => {
            if (!updatedBlockData) return;
            console.log(`Block ${variables.blockId} notes updated`);
            queryClient.setQueryData<CanvasData>(queryKeys.canvas(canvasId!), (oldData) => {
                if (!oldData || !oldData.blocks) return oldData;
                return {
                    ...oldData,
                    blocks: oldData.blocks.map(block =>
                        block.id === variables.blockId
                            ? { ...block, notes: updatedBlockData.notes, updatedAt: updatedBlockData.updatedAt }
                            : block
                    ),
                };
            });
            // Let the calling component handle UI state like closing the modal
        },
        onError: (err, variables) => {
            console.error(`Error updating notes for block ${variables.blockId}:`, err);
            alert(`Failed to save block notes for ${variables.blockId}.`);
        },
    });

    const { mutate: performUpdateCanvasTitle } = useMutation({
        mutationFn: updateCanvasTitle,
        onSuccess: (updatedCanvasData, variables) => {
            if (!updatedCanvasData) {
                console.error("Canvas title update failed - no data returned");
                alert("Failed to update canvas title. The canvas may not exist or you don't have permission.");
                return;
            }
            console.log(`Canvas ${variables.id} title updated`);
            queryClient.setQueryData<CanvasData>(queryKeys.canvas(variables.id), (oldData) => {
                if (!oldData) return oldData;
                return { ...oldData, title: updatedCanvasData.title, updatedAt: updatedCanvasData.updatedAt };
            });
        },
        onError: (err) => {
            console.error("Error updating canvas title:", err);
            // Basic error handling, could be enhanced
            alert("Failed to save canvas title. Please try again or refresh the page.");
        },
    });

    const { mutate: performCreateConnection } = useMutation({
        mutationFn: createConnection,
        onSuccess: (newConnectionData) => {
            if (!newConnectionData) return;
            console.log('Connection created:', newConnectionData);

            // Optimistic UI update using setEdges passed into the hook
            const newEdge = mapConnectionToEdge(newConnectionData);
            setEdges((eds) => addEdge(newEdge, eds));

            // Update cache in the background for consistency
            queryClient.setQueryData<CanvasWithConnections>(queryKeys.canvas(canvasId!), (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    connections: [...(oldData.connections || []), newConnectionData],
                };
            });
        },
        onError: (error) => {
            console.error("Failed to create connection:", error);
            // Revert optimistic update by invalidating
            queryClient.invalidateQueries({ queryKey: queryKeys.canvas(canvasId!) });
            alert("Failed to create connection.");
        },
    });

    const { mutate: performDeleteConnection } = useMutation({
        mutationFn: deleteConnection,
        // Optimistic update: Remove edge immediately from React Flow state
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.canvas(canvasId!) });
            const previousEdges = queryClient.getQueryData<Edge[]>(queryKeys.canvas(canvasId!)) || []; // Or get directly from useReactFlowState if passed in
            setEdges((eds) => eds.filter((edge) => edge.id !== variables.connectionId));
            return { previousEdges }; // Return context for onError rollback
        },
        onSuccess: (success, variables) => {
            if (!success) return; // Should ideally not happen if API follows convention
            console.log('Connection deleted:', variables.connectionId);
            // Update cache in the background
            queryClient.setQueryData<CanvasWithConnections>(queryKeys.canvas(canvasId!), (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    connections: (oldData.connections || []).filter((conn: ApiConnection) => conn.id !== variables.connectionId),
                };
            });
        },
        onError: (error, variables, context) => {
            console.error(`Failed to delete connection ${variables.connectionId}:`, error);
            // Rollback optimistic update
            if (context?.previousEdges) {
                setEdges(context.previousEdges);
            }
            alert(`Failed to delete connection ${variables.connectionId}.`);
        },
        // Always refetch after error or success to ensure consistency
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.canvas(canvasId!) });
        },
    });


    return {
        performCreateBlock,
        isCreatingBlock,
        performUndoBlockCreation,
        performUpdateBlockPosition,
        performUpdateBlockContent,
        performUpdateBlockNotes,
        isUpdatingNotes,
        performUpdateCanvasTitle,
        performCreateConnection,
        performDeleteConnection,
    };
}
