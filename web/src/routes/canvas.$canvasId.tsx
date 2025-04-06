import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import ReactFlow, {
    Controls, Background, MiniMap, // Basic React Flow components
    useNodesState, useEdgesState, // Hooks to manage nodes/edges
    Node, Edge, BackgroundVariant // Import BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css'; // Default styles for react-flow

import { fetchCanvasById, updateCanvasTitle, createBlock, undoBlockCreation, updateBlockPosition, updateBlockContent, Canvas, Block } from '../lib/api'
import styles from './canvas.$canvasId.module.css';
import { CanvasHeader } from '../components/CanvasHeader';
import { CanvasWorkspace } from '../components/CanvasWorkspace';

// --- Helper: Map API Block to ReactFlow Node ---
const mapBlockToNode = (block: Block): Node => ({
    id: block.id,
    type: 'default', // Use default node type for now, can customize later
    position: block.position,
    data: { label: block.content?.text || block.type }, // Simple label for now
    // Store original block data if needed
    // data: { ...block.data, label: block.content?.text || block.type },
});

// --- Route Definition ---
// Loader function to fetch data before the component renders
const loader = async ({ params }: { params: { canvasId: string } }) => {
  console.log(`[Loader] Fetching canvas ${params.canvasId}`);
  const canvas = await fetchCanvasById(params.canvasId);
  if (!canvas) {
    throw new Error('Canvas not found');
  }
  return canvas;
};

export const Route = createFileRoute('/canvas/$canvasId')({
  component: CanvasViewPage,
  loader: loader, // Use loader to fetch data
  errorComponent: CanvasErrorComponent, // Component to show on loader error
})

// --- Page Component ---

function CanvasViewPage() {
  const initialDataFromLoader = Route.useLoaderData(); // Data from loader
  const { canvasId } = Route.useParams();
  const queryClient = useQueryClient();

  // *** Use useQuery to subscribe to canvas data ***
  const { data: canvasData, isLoading: isCanvasLoading, error: canvasError } = useQuery({
      queryKey: ['canvas', canvasId],
      queryFn: () => fetchCanvasById(canvasId), // Fetch function
      initialData: initialDataFromLoader, // Use loader data initially
      staleTime: 5 * 60 * 1000, // Keep data fresh for 5 mins
  });

  // Undo state remains lifted
  const [undoBlockId, setUndoBlockId] = useState<string | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

  // NEW: Block Content Editing State
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

  // Handler passed to CanvasHeader
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
        initialCanvas={canvasData} // Pass data from useQuery
        onCreateBlock={handleCreateNewBlock}
        isCreatingBlock={isCreatingBlock}
      />
      <CanvasWorkspace
        key={canvasId}
        initialBlocks={canvasData.blocks || []} // Pass blocks from useQuery data
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick} // Pass down the double click handler
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