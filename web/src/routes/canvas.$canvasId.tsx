import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ReactFlow, {
    Controls, Background, MiniMap, // Basic React Flow components
    useNodesState, useEdgesState, // Hooks to manage nodes/edges
    Node, Edge, BackgroundVariant // Import BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css'; // Default styles for react-flow

import { fetchCanvasById, updateCanvasTitle, createBlock, undoBlockCreation, Canvas, Block } from '../lib/api'
import styles from './canvas.$canvasId.module.css';

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
  // Use queryClient from the router context for prefetching (optional but good practice)
  // const queryClient = Route.router.options.context.queryClient; // Get query client
  // await queryClient.prefetchQuery({ queryKey: ['canvas', params.canvasId], queryFn: () => fetchCanvasById(params.canvasId) })

  const canvas = await fetchCanvasById(params.canvasId);
  if (!canvas) {
    // TODO: Could redirect to a 404 page or throw a specific error
    throw new Error('Canvas not found');
  }
  return canvas;
};

export const Route = createFileRoute('/canvas/$canvasId')({
  component: CanvasViewComponent,
  loader: loader, // Use loader to fetch data
  errorComponent: CanvasErrorComponent, // Component to show on loader error
})

// --- Components ---

function CanvasViewComponent() {
  const initialCanvas = Route.useLoaderData(); // Get initial data from loader
  const { canvasId } = Route.useParams(); // Get canvasId from route params
  const queryClient = useQueryClient();

  // Title Editing State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(initialCanvas.title);
  const [updateTitleError, setUpdateTitleError] = useState<string | null>(null);

  // React Flow State
  const initialNodes = initialCanvas.blocks?.map(mapBlockToNode) || [];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]); // No edges yet

  // State for Undo notification
  const [undoBlockId, setUndoBlockId] = useState<string | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

  // Reset nodes if initial canvas data changes (e.g., refetch after undo outside component)
  useEffect(() => {
    setNodes(initialCanvas.blocks?.map(mapBlockToNode) || []);
  }, [initialCanvas.blocks, setNodes]);

  // Effect to reset editTitle if initialCanvas data changes
  useEffect(() => {
    setEditTitle(initialCanvas.title);
  }, [initialCanvas.title]);

  // --- Mutations ---
  const { mutate: performUpdateTitle, isPending: isUpdatingTitle } = useMutation({
    mutationFn: updateCanvasTitle,
    onSuccess: (updatedData) => {
      setUpdateTitleError(null);
      queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) =>
        oldData ? { ...oldData, ...updatedData } : undefined
      );
      queryClient.invalidateQueries({ queryKey: ['canvases'] });
      setIsEditingTitle(false);
    },
    onError: (err) => {
      setUpdateTitleError(err instanceof Error ? err.message : "Failed to update title.");
    },
  });

  const { mutate: performCreateBlock, isPending: isCreatingBlock } = useMutation({
      mutationFn: createBlock,
      onSuccess: (newBlock) => {
        console.log("Block created:", newBlock);
        const newNode = mapBlockToNode(newBlock);
        setNodes((nds) => nds.concat(newNode));

        // Show undo notification
        setUndoBlockId(newBlock.id);
        // Clear previous timeout if any
        if (undoTimeoutId) clearTimeout(undoTimeoutId);
        // Set new timeout to hide notification
        const timeoutId = setTimeout(() => {
            setUndoBlockId(null);
        }, UNDO_GRACE_PERIOD_MS - 1000); // Hide slightly before grace period ends
        setUndoTimeoutId(timeoutId);

        // Update the main canvas query cache (optional, depends on approach)
        // queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] });
      },
      onError: (err) => {
          // TODO: Show block creation error
          console.error("Error creating block:", err);
          alert("Failed to create block");
      }
  });

  const { mutate: performUndoBlockCreation } = useMutation({
      mutationFn: undoBlockCreation,
      onSuccess: (success, blockId) => {
          if (success) {
              console.log(`Block ${blockId} undone`);
              setNodes((nds) => nds.filter((node) => node.id !== blockId));
              // Clear undo notification immediately
              setUndoBlockId(null);
              if (undoTimeoutId) clearTimeout(undoTimeoutId);
              // Optional: Invalidate canvas query if needed
              // queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] });
          } else {
              console.warn(`Failed to undo block ${blockId} (likely expired)`);
              alert("Undo period expired or failed.");
              // Hide notification if it was still showing for this block
              if(undoBlockId === blockId) setUndoBlockId(null);
          }
      },
      onError: (err) => {
          console.error("Error undoing block creation:", err);
          alert("Failed to undo block.");
      }
  });

  // --- Handlers ---
  const handleEditToggle = () => {
    if (isEditingTitle) {
        setEditTitle(initialCanvas.title);
        setUpdateTitleError(null);
    }
    setIsEditingTitle(!isEditingTitle);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() === initialCanvas.title) {
        setIsEditingTitle(false);
        setUpdateTitleError(null);
        return;
    }
    performUpdateTitle({ id: canvasId, title: editTitle.trim() });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(event.target.value);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleTitleSave();
    else if (event.key === 'Escape') handleEditToggle();
  };

  const handleCreateNewBlock = () => {
      // Create block at a default position for now
      performCreateBlock({ canvasId, type: 'text', position: { x: 50, y: 50 }, content: { text: 'New Block' }});
  };

  const handleUndoClick = () => {
      if(undoBlockId) {
          performUndoBlockCreation(undoBlockId);
      }
  };

  // --- Render ---
  return (
    <div className={styles.container}>
      {/* Top Bar: Back Link, Title Edit, Create Button */} 
      <div className={styles.topBar}>
            <Link to="/" className={styles.backLink}>&laquo; Back to Canvases</Link>
            <div className={styles.titleContainer}>
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        disabled={isUpdatingTitle}
                        autoFocus
                        className={styles.titleInput}
                    />
                ) : (
                    <h2 className={styles.title} onClick={() => setIsEditingTitle(true)} title="Click to edit">{initialCanvas.title}</h2>
                )}
                {isEditingTitle ? (
                    <>
                        <button onClick={handleTitleSave} disabled={isUpdatingTitle || !editTitle.trim()} className={styles.saveButton}>
                            {isUpdatingTitle ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={handleEditToggle} disabled={isUpdatingTitle} className={styles.cancelButton}>
                            Cancel
                        </button>
                    </>
                ) : (
                    <button onClick={handleEditToggle} className={styles.editButton} title="Edit title">
                        ✏️
                    </button>
                )}
            </div>
            {updateTitleError && <p className={styles.errorText}>Error: {updateTitleError}</p>}
            <button onClick={handleCreateNewBlock} disabled={isCreatingBlock} className={styles.createButton}>
                {isCreatingBlock ? 'Creating Block...' : '+ Add Block'}
            </button>
      </div>

      {/* Undo Notification */} 
      {undoBlockId && (
          <div className={styles.undoNotification}>
              <span>Block created.</span>
              <button onClick={handleUndoClick}>Undo</button>
          </div>
      )}

      {/* React Flow Canvas Area */} 
      <div className={styles.canvasArea}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          // onConnect={onConnect} // TODO: Add connection logic later
          fitView // Zoom/pan to fit nodes initially
          className={styles.reactFlowInstance}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* <p className={styles.meta}>ID: {initialCanvas.id}</p>
      <p className={styles.meta}>Created: {new Date(initialCanvas.createdAt).toLocaleString()}</p>
      <p className={styles.meta}>Last Updated: {new Date(initialCanvas.updatedAt).toLocaleString()}</p>
      <p className={styles.meta}>Public: {initialCanvas.isPublic ? 'Yes' : 'No'}</p> */} 
    </div>
  )
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