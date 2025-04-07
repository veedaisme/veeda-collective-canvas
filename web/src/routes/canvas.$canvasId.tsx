import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edge, // Hooks to manage nodes/edges
  Node,
  useEdgesState, // Basic React Flow components
  useNodesState, // Add addEdge utility
  type Connection,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  NodeChange,
  EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css'; // Default styles for react-flow

import { CanvasHeader } from '../components/CanvasHeader';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { Connection as ApiConnection, Block, Canvas as CanvasBase, CanvasData, createBlock, createConnection, deleteConnection, fetchCanvasById, undoBlockCreation, updateBlockContent, updateBlockPosition, updateCanvasTitle } from '../lib/api';
import { supabase } from '../lib/supabaseClient'; // Import supabase
import styles from './canvas.$canvasId.module.css';

// Define an extended Canvas type that includes connections
// This is temporary until the actual type in api.ts is updated
type Canvas = CanvasBase & {
  connections?: ApiConnection[];
};

// --- Helper: Map API Block to ReactFlow Node ---
const mapBlockToNode = (block: Block): Node => ({
    id: block.id,
    type: 'default', // Or derive from block.type
    position: block.position,
    data: { 
        label: block.content?.text || block.type,
        rawBlock: block // Include original block data
    },
});

// --- Helper: Map API Connection to ReactFlow Edge ---
const mapConnectionToEdge = (conn: ApiConnection): Edge => ({
    id: conn.id,
    source: conn.sourceBlockId,
    target: conn.targetBlockId,
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle,
    // Add other properties like type, animated if needed
});

// --- Route Definition ---
// Loader function to fetch data before the component renders
// REMOVED from here, now handled in beforeLoad and TanStack Query's useQuery
/*
const loader = async ({ params }: { params: { canvasId: string } }) => {
  console.log(`[Loader] Fetching canvas ${params.canvasId}`);
  const canvas = await fetchCanvasById(params.canvasId);
  if (!canvas) {
    throw new Error('Canvas not found');
  }
  return canvas;
};
*/

export const Route = createFileRoute('/canvas/$canvasId')({
  beforeLoad: async ({ location, params }) => {
    // Check Supabase auth status directly
    const { data: { session } } = await supabase.auth.getSession();

    // If no session, redirect to login
    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }

    // --- Prefetching Removed ---
    // Data fetching will be handled by useQuery within the component.
    console.log(`[beforeLoad] User authenticated for canvas ${params.canvasId}. Proceeding to load component.`);

    // If logged in, allow loading
  },
  component: CanvasViewPage,
  // loader: loader, // Loader removed, data fetching handled by useQuery initialized with prefetch
  errorComponent: CanvasErrorComponent, // Still useful for errors *within* the component render
})

// --- Page Component ---

function CanvasViewPage() {
  const { canvasId } = Route.useParams();
  const queryClient = useQueryClient();

  // Fetch canvas data using useQuery
  const { data: canvasData, isLoading: isCanvasLoading, error: canvasError } = useQuery<CanvasData | null>({
      queryKey: ['canvas', canvasId],
      queryFn: () => fetchCanvasById(canvasId),
      staleTime: 5 * 60 * 1000,
  });

  // Map API Connections to ReactFlow Edges
  const initialEdges = useMemo(() => {
      if (!canvasData?.connections) return [];
      return canvasData.connections.map(mapConnectionToEdge);
  }, [canvasData?.connections]);

  // Initialize with empty arrays, then populate via useEffect
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);

  // Effect to update React Flow state when canvasData is fetched/changed
  useEffect(() => {
      if (canvasData) {
          console.log("[Effect] Updating nodes from canvasData:", canvasData.blocks);
          setNodes(canvasData.blocks?.map(mapBlockToNode) || []);
          console.log("[Effect] Updating edges from canvasData:", canvasData.connections);
          setEdges(canvasData.connections?.map(mapConnectionToEdge) || []);
      } else {
          console.log("[Effect] Clearing nodes and edges as canvasData is null/undefined");
          setNodes([]);
          setEdges([]);
      }
  }, [canvasData, setNodes, setEdges]);

  // Undo state
  const [undoBlockId, setUndoBlockId] = useState<string | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

  // Block Content Editing State
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  // Create Block Mutation
  const { mutate: performCreateBlock, isPending: isCreatingBlock } = useMutation({
    mutationFn: createBlock,
    onSuccess: (newBlock) => {
      console.log("Block created:", newBlock);
      // OPTION 1: Manual Cache Update (optimistic-like)
      // This is often still good for instant UI feedback
      queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          blocks: [...(oldData.blocks || []), newBlock],
        };
      });
      // OPTION 2: Invalidation (ensures consistency, triggers useQuery refetch)
      // If using only invalidate, remove setQueryData above.
      // Keeping both can be okay, invalidate will usually just confirm the manual update.
      // queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] });

      showUndoNotification(newBlock.id);
    },
    onError: (err) => {
      console.error("Error creating block:", err);
      alert("Failed to create block");
    },
  });

  // Undo Block Mutation
  const { mutate: performUndoBlockCreation } = useMutation({
      mutationFn: undoBlockCreation,
      onSuccess: (success, blockId) => {
          if (success) {
              console.log(`[Page] Block ${blockId} undone successfully.`);
              // Invalidate canvas query to refetch data for useQuery
              queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] });
              setUndoBlockId(null);
              if (undoTimeoutId) clearTimeout(undoTimeoutId);
          } else {
              handleUndoFail(blockId);
          }
      },
      onError: (err, blockId) => {
          console.error(`[Page] Error undoing block creation for ${blockId}:`, err);
          alert("Failed to undo block.");
          handleUndoFail(blockId);
      }
  });

  // NEW: Mutation for updating block position
  const { mutate: performUpdateBlockPosition } = useMutation({
      mutationFn: updateBlockPosition,
      onSuccess: (updatedBlockData, variables) => {
          if (!updatedBlockData) return; // Handle null case if API returns null on error
          console.log(`Block ${variables.blockId} position updated`);
          // Update the specific block within the canvas query cache
          queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) => {
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
          alert(`Failed to save block position for ${variables.blockId}.`); // Simple feedback
          // Consider reverting optimistic update if implemented
          // queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] }); // Refetch to revert
      },
  });

  // NEW: Mutation for updating block content
  const { mutate: performUpdateBlockContent, isPending: isUpdatingContent } = useMutation({
      mutationFn: updateBlockContent,
      onSuccess: (updatedBlockData, variables) => {
          if (!updatedBlockData) return;
          console.log(`Block ${variables.blockId} content updated`);
          // Update cache
          queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) => {
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
          setEditingBlockId(null); // Exit editing mode
      },
      onError: (err, variables) => {
          console.error(`Error updating content for block ${variables.blockId}:`, err);
          alert(`Failed to save block content for ${variables.blockId}.`);
          // Optionally reset editing state here or leave input open
          // setEditingBlockId(null);
      },
  });

  // Handler for failed/expired undo
  const handleUndoFail = (blockId: string) => {
         console.warn(`[Page] Failed to undo block ${blockId} (likely expired)`);
         alert("Undo period expired or failed.");
         if (undoBlockId === blockId) setUndoBlockId(null);
         if (undoTimeoutId) clearTimeout(undoTimeoutId);
    }

  // Mutation for updating the Canvas Title
  const { mutate: performUpdateCanvasTitle, isPending: isUpdatingTitle } = useMutation({
    mutationFn: updateCanvasTitle,
    onSuccess: (updatedCanvasData, variables) => {
        if (!updatedCanvasData) {
            // API returned null but didn't throw an error
            console.error("Canvas title update failed - no data returned");
            alert("Failed to update canvas title. The canvas may not exist or you don't have permission.");
            return;
        }
        console.log(`Canvas ${variables.id} title updated`);
        // Update the canvas title in the query cache
        queryClient.setQueryData<CanvasData>(['canvas', variables.id], (oldData) => {
            if (!oldData) return oldData;
            return { ...oldData, title: updatedCanvasData.title, updatedAt: updatedCanvasData.updatedAt };
        });
    },
    onError: (err) => {
        console.error("Error updating canvas title:", err);
        
        // Handle GraphQL errors specifically
        const errorObj = err as any;
        if (errorObj?.response?.errors?.length > 0) {
            const graphQLError = errorObj.response.errors[0];
            if (graphQLError.extensions?.code === "NOT_FOUND_OR_FORBIDDEN") {
                alert("Cannot update this canvas: either it doesn't exist or you don't have permission to edit it.");
                // Invalidate query to refresh data
                queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] });
                return;
            }
        }
        
        // Generic error message
        alert("Failed to save canvas title. Please try again or refresh the page.");
    },
});

  // Handler for saving the canvas title (passed to CanvasHeader -> CanvasWorkspace)
  const handleTitleSave = useCallback((newTitle: string) => {
      if (!canvasId) return; // Should always have canvasId here
      const trimmedTitle = newTitle.trim();
      if (trimmedTitle) {
          // Use the correct mutation function name
          performUpdateCanvasTitle({ id: canvasId, title: trimmedTitle }); 
      } else {
          // TODO: Show an error message - title cannot be empty
          console.error("Canvas title cannot be empty.");
      }
      // Ensure dependency array uses the correct mutation function
  }, [canvasId, performUpdateCanvasTitle]); 

  // Handler for creating a new block (passed to CanvasHeader)
  const handleCreateNewBlock = () => {
    performCreateBlock({
      canvasId,
      type: 'text',
      position: { x: Math.random() * 200, y: Math.random() * 100 }, // Randomize slightly
      content: { text: 'New Block' },
    });
  };

  // Handler for showing undo notification
  const showUndoNotification = useCallback((blockId: string) => {
      console.log("[Page] Showing undo for", blockId);
      setUndoBlockId(blockId);
      if (undoTimeoutId) clearTimeout(undoTimeoutId);
      const timeoutId = window.setTimeout(() => {
          setUndoBlockId(null);
      }, 30 * 1000 - 1000);
      setUndoTimeoutId(timeoutId);
  }, [undoTimeoutId]);

  // Handler for node changes from CanvasWorkspace (e.g., drag stop)
  const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node Drag Stop:', node.id, node.position);
    // Call the mutation to save the new position
    performUpdateBlockPosition({ blockId: node.id, position: node.position });
  }, [performUpdateBlockPosition]);

  // Handler for the Undo button click
  const handleUndoClick = () => {
      if (undoBlockId) {
          performUndoBlockCreation(undoBlockId);
      }
  };

  // NEW: Handler for Node Double Click (passed to CanvasWorkspace)
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
      console.log("Node Double Clicked:", node);
      // Find the original block data (assuming it's needed or use node.data)
      const blockData = canvasData?.blocks?.find(b => b.id === node.id);
      if (blockData && blockData.type === 'text') { // Only allow editing text blocks for now
        setEditingContent(blockData.content?.text || '');
        setEditingBlockId(blockData.id);
      } else {
          console.log("Editing not supported for type:", blockData?.type);
      }
  }, [canvasData?.blocks]); // Dependency on blocks data

  // NEW: Handler for saving edited content
  const handleContentSave = () => {
      if (editingBlockId) {
          const originalBlock = canvasData?.blocks?.find(b => b.id === editingBlockId);
          const newContent = { text: editingContent }; // Assuming text block structure

          // Avoid saving if content hasn't changed (optional)
          if (originalBlock && JSON.stringify(originalBlock.content) === JSON.stringify(newContent)) {
              setEditingBlockId(null);
              return;
          }

          performUpdateBlockContent({ blockId: editingBlockId, content: newContent });
      }
  };

  // NEW: Handler to cancel editing content
  const handleContentCancel = () => {
      setEditingBlockId(null);
      setEditingContent("");
  };

  // --- Mutations ---

  // Mutation for Creating Connections
  const createConnectionMutation = useMutation({
    mutationFn: createConnection,
    onSuccess: (newConnectionData) => {
      if (!newConnectionData) return; // Handle creation failure
      console.log('Connection created:', newConnectionData);
      // Update cache - Add edge optimistically or refetch
      queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) => {
        if (!oldData) return oldData;
        const newEdge: Edge = {
          id: newConnectionData.id,
          source: newConnectionData.sourceBlockId,
          target: newConnectionData.targetBlockId,
          sourceHandle: newConnectionData.sourceHandle,
          targetHandle: newConnectionData.targetHandle,
        };
        return {
          ...oldData,
          connections: [...(oldData.connections || []), newConnectionData],
        };
      });
    },
    onError: (error) => {
      console.error("Failed to create connection:", error);
      // TODO: Show user notification
    },
  });

  // Mutation for Deleting Connections
  const deleteConnectionMutation = useMutation({
    mutationFn: deleteConnection,
    // When deleting, we only get success boolean, need the ID passed in
    onSuccess: (success, variables) => {
      if (!success) return;
      console.log('Connection deleted:', variables.connectionId);
      queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          connections: (oldData.connections || []).filter((conn: ApiConnection) => conn.id !== variables.connectionId),
        };
      });
    },
    onError: (error, variables) => {
      console.error(`Failed to delete connection ${variables.connectionId}:`, error);
      // TODO: Show user notification
    },
  });

  // --- Handlers ---

  // Handler for Creating Connections (from ReactFlow)
  const handleConnect = useCallback((connection: Connection | Edge) => {
    console.log('Attempting to connect:', connection);
    // Check if essential fields are present (ReactFlow might provide partial data sometimes)
    if (!connection.source || !connection.target || !canvasId) {
      console.warn("Connection attempt missing required data", connection);
      return;
    }
    createConnectionMutation.mutate({
      canvasId: canvasId!,
      sourceBlockId: connection.source,
      targetBlockId: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    });
  }, [canvasId, createConnectionMutation]); // Add dependencies

  // Handler for Deleting Edges (from ReactFlow)
  const handleEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    console.log('Attempting to delete edges:', deletedEdges);
    deletedEdges.forEach(edge => {
      deleteConnectionMutation.mutate({ connectionId: edge.id });
    });
  }, [deleteConnectionMutation]); // Add dependency

  // Add handler for node deletion if needed
  const handleNodesDelete = useCallback((deletedNodes: Node[]) => {
      console.log('Nodes delete requested (implement if needed):', deletedNodes);
      // Add logic here to delete corresponding blocks via API mutation
      // e.g., deletedNodes.forEach(node => performDeleteBlock(node.id));
  }, []); // Add dependencies if needed

  // Handle loading and error states from useQuery
  if (isCanvasLoading && !canvasData) { // Check if loading initial data (canvasData is undefined)
      return <div>Loading Canvas...</div>; // Or a spinner component
  }

  if (canvasError) {
      return <CanvasErrorComponent error={canvasError} />;
  }

  if (!canvasData) {
      // This case might happen if loader failed but useQuery hasn't errored yet,
      // or if fetch returns null explicitly after initial load.
      return <div>Canvas not found or failed to load.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <CanvasHeader
        initialCanvas={canvasData} 
        onCreateBlock={handleCreateNewBlock}
        isCreatingBlock={isCreatingBlock}
      />
      <CanvasWorkspace
        key={canvasId}
        initialBlocks={canvasData.blocks || []} 
        initialEdges={edges}
        canvasTitle={canvasData.title}
        onSaveTitle={handleTitleSave}
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick}
        onConnect={handleConnect}
        onEdgesDelete={handleEdgesDelete}
      />
       {/* Undo Notification */} 
       {undoBlockId && (
          <div className={styles.undoNotification}>
              <span>Block created.</span>
              <button onClick={handleUndoClick}>Undo</button>
          </div>
       )}

       {/* NEW: Modal or Overlay for Editing Block Content */} 
       {editingBlockId && (
          <div className={styles.editOverlay}>
              <div className={styles.editModal}>
                  <h3>Edit Block Content (ID: {editingBlockId})</h3>
                  {/* Simple textarea for text blocks */} 
                  <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={5}
                      className={styles.editTextarea}
                      autoFocus
                  />
                  <div className={styles.editActions}>
                      <button onClick={handleContentCancel} disabled={isUpdatingContent} className={styles.cancelButton}>
                          Cancel
                      </button>
                      <button onClick={handleContentSave} disabled={isUpdatingContent} className={styles.saveButton}>
                          {isUpdatingContent ? 'Saving...' : 'Save Content'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

// Simple component to display loading errors from the loader
function CanvasErrorComponent({ error }: { error: Error }) {
    return (
        <div className={styles.container} style={{ color: 'red' }}>
            <Link to="/">&laquo; Back to Canvases</Link>
            <h2>Error Loading Canvas</h2>
            <p>{error?.message ?? 'An unknown error occurred.'}</p>
        </div>
    );
}

const UNDO_GRACE_PERIOD_MS = 30 * 1000; // Define constant used in component 