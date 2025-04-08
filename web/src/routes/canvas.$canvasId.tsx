import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Edge,
    Node,
    useEdgesState,
    useNodesState,
    type Connection,
    addEdge,
    OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { CanvasHeader } from '../components/CanvasHeader';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { NotesEditModal } from '../components/NotesEditModal';
import { BlockCreationModal } from '../components/BlockCreationModal';
import { Connection as ApiConnection, Block, BlockContent, Canvas as CanvasBase, CanvasData, createBlock, createConnection, deleteConnection, fetchCanvasById, LinkBlockContent, TextBlockContent, undoBlockCreation, updateBlockContent, updateBlockNotes, updateBlockPosition, updateCanvasTitle } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { isUrl } from '../lib/utils';
import styles from './canvas.$canvasId.module.css';

// Define an extended Canvas type that includes connections
// This is temporary until the actual type in api.ts is updated
type Canvas = CanvasBase & {
  connections?: ApiConnection[];
};

// Type guard functions for content
function isTextBlockContent(content: BlockContent | null | undefined): content is TextBlockContent {
    return !!content && typeof (content as TextBlockContent).text === 'string';
}

function isLinkBlockContent(content: BlockContent | null | undefined): content is LinkBlockContent {
    return !!content && typeof (content as LinkBlockContent).url === 'string';
}

// --- Helper: Map API Block to ReactFlow Node ---
const mapBlockToNode = (block: Block): Node => {
    // Determine label based on type and content
    let label = block.type; // Default label is the type
    if (isTextBlockContent(block.content)) {
        label = block.content.text;
    } else if (isLinkBlockContent(block.content)) {
        label = block.content.url;
    }

    // Always use the StyledBlockNode type now
    const nodeType = 'styledBlockNode';

    return {
        id: block.id,
        type: nodeType, // Use the new styled node type for all blocks
        position: block.position,
        // Pass data expected by StyledBlockNode
        data: {
            label: label, // Pass determined label
            notes: block.notes,
            rawBlock: block // Pass the full block data
        },
        // Optionally define width/height based on content or type?
        // style: { width: 250 }, 
    }
};

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

  // Restore needed states
  const [editingNotesBlockId, setEditingNotesBlockId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [isCreatingBlockInput, setIsCreatingBlockInput] = useState<boolean>(false);
  const [newBlockPosition, setNewBlockPosition] = useState<{ x: number; y: number }>({ x: 100, y: 100 });

  // NEW: State for selected node for the Sheet
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // State to control Sheet visibility explicitly (derived from selectedNode)
  const isSidebarOpen = !!selectedNode;

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
  const { mutate: performUpdateBlockContent } = useMutation({
      mutationFn: updateBlockContent,
      onSuccess: (updatedBlockData, variables) => {
          if (!updatedBlockData) return;
          console.log(`Block ${variables.blockId} content updated`);
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
      },
      onError: (err, variables) => {
          console.error(`Error updating content for block ${variables.blockId}:`, err);
          alert(`Failed to save block content for ${variables.blockId}.`);
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
  const { mutate: performUpdateCanvasTitle } = useMutation({
    mutationFn: updateCanvasTitle,
    onSuccess: (updatedCanvasData, variables) => {
        if (!updatedCanvasData) {
            console.error("Canvas title update failed - no data returned");
            alert("Failed to update canvas title. The canvas may not exist or you don't have permission.");
            return;
        }
        console.log(`Canvas ${variables.id} title updated`);
        queryClient.setQueryData<CanvasData>(['canvas', variables.id], (oldData) => {
            if (!oldData) return oldData;
            return { ...oldData, title: updatedCanvasData.title, updatedAt: updatedCanvasData.updatedAt };
        });
    },
    onError: (err) => {
        console.error("Error updating canvas title:", err);
        const errorObj = err as { response?: { errors?: { extensions?: { code?: string } }[] } };
        const errors = errorObj?.response?.errors;
        if (errors && errors.length > 0) {
            const graphQLError = errors[0];
            if (graphQLError?.extensions?.code === "NOT_FOUND_OR_FORBIDDEN") {
                alert("Cannot update this canvas: either it doesn't exist or you don't have permission to edit it.");
                queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] });
                return;
            }
        }
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
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
    setNewBlockPosition(position);
    setIsCreatingBlockInput(true);
  };

  // Handler for background double-click - creates a block at the clicked position
  const handleBackgroundDoubleClick = useCallback((position: { x: number, y: number }) => {
    console.log('Background Double Clicked at position:', position);
    setNewBlockPosition(position);
    setIsCreatingBlockInput(true);
  }, []);

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

  // Handler for single click on a node - sets the node to show in the Sheet
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
      console.log('Node Clicked:', node);
      setSelectedNode(node);
      // Sheet open state is derived from selectedNode
  }, []);

  // UPDATED: Handler for Node Double Click - also closes Sheet
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
      setSelectedNode(null);
      console.log("Node Double Clicked:", node);
      const blockData = node.data.rawBlock as Block | undefined;
      if (!blockData) { return; }

      if (blockData.type === 'text' && isTextBlockContent(blockData.content)) {
          console.log("TODO: Open text edit modal for:", blockData.id);
      } else if (blockData.type === 'link' && isLinkBlockContent(blockData.content)) {
          const url = blockData.content.url;
          let clickableUrl = url;
          if (!/^https?:\/\//i.test(clickableUrl)) { clickableUrl = `http://${clickableUrl}`; }
          window.open(clickableUrl, '_blank', 'noopener,noreferrer');
      } else {
          console.log("Opening notes editor for block type:", blockData.type);
          setEditingNotes(blockData.notes || '');
          setEditingNotesBlockId(blockData.id);
      }
  }, []);

  // Handler for Sheet's onOpenChange (handles closing via X, overlay click, etc.)
  const handleSheetOpenChange = (open: boolean) => {
      if (!open) {
          setSelectedNode(null);
      }
      // We don't typically set it to open=true here, that's done by handleNodeClick
  };

  // Restore notes update mutation and get isPending flag
  const { mutate: performUpdateBlockNotes, isPending: isUpdatingNotes } = useMutation({
      mutationFn: updateBlockNotes,
      onSuccess: (updatedBlockData, variables) => {
          if (!updatedBlockData) return;
          console.log(`Block ${variables.blockId} notes updated`);
          queryClient.setQueryData<CanvasData>(['canvas', canvasId], (oldData) => {
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
          setEditingNotesBlockId(null);
      },
      onError: (err, variables) => {
          console.error(`Error updating notes for block ${variables.blockId}:`, err);
          alert(`Failed to save block notes for ${variables.blockId}.`);
      },
  });

  // Restore connection mutations and handlers
  const createConnectionMutation = useMutation({
      mutationFn: createConnection,
      onSuccess: (newConnectionData) => {
          if (!newConnectionData) return;
          console.log('Connection created:', newConnectionData);
          
          // Option 1: Cache Update (Keep for data consistency, but don't rely on for UI)
          queryClient.setQueryData<Canvas>(['canvas', canvasId], (oldData) => {
              if (!oldData) return oldData;
              return {
                  ...oldData,
                  connections: [...(oldData.connections || []), newConnectionData],
              };
          });

          // Option 2: Direct State Update (Use this for immediate UI feedback)
          const newEdge = mapConnectionToEdge(newConnectionData);
          setEdges((eds) => addEdge(newEdge, eds));
      },
      onError: (error) => {
          console.error("Failed to create connection:", error);
          // If using optimistic updates with Option 2, revert here:
          // queryClient.invalidateQueries({ queryKey: ['canvas', canvasId] }); // Or remove edge from state
      },
  });

  const deleteConnectionMutation = useMutation({
      mutationFn: deleteConnection,
      onSuccess: (success, variables) => {
          if (!success) return;
          console.log('Connection deleted:', variables.connectionId);
          // Update cache (should trigger useEffect for edges state)
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
      },
  });

  // Fix handleConnect signature and logic
  const handleConnect = useCallback((connection: Connection | Edge) => {
      console.log('Attempting to connect:', connection);
      if (!connection.source || !connection.target || !canvasId) {
          console.warn("Connection attempt missing required data", connection);
          return;
      }
      // Handles can be undefined on Edge type, default to null for API
      const sourceHandle = 'sourceHandle' in connection ? connection.sourceHandle : null;
      const targetHandle = 'targetHandle' in connection ? connection.targetHandle : null;

      createConnectionMutation.mutate({
          canvasId: canvasId!,
          sourceBlockId: connection.source,
          targetBlockId: connection.target,
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
      });
  }, [canvasId, createConnectionMutation]);

  // Restore block creation modal handlers
  const handleBlockCreationSave = (inputValue: string) => {
      const trimmedInput = inputValue.trim();
      if (!trimmedInput) { setIsCreatingBlockInput(false); return; }
      let blockType: 'text' | 'link' = 'text';
      let blockContent: unknown = { text: trimmedInput };
      if (isUrl(trimmedInput)) {
          blockType = 'link';
          blockContent = { url: trimmedInput };
      }
      performCreateBlock({ canvasId, type: blockType, position: newBlockPosition, content: blockContent });
      setIsCreatingBlockInput(false);
  };
  const handleBlockCreationCancel = () => { setIsCreatingBlockInput(false); };

  // Restore notes update mutation and handlers
  const handleNotesSave = (newNotes: string) => {
      if (editingNotesBlockId === null) return;
      performUpdateBlockNotes({ blockId: editingNotesBlockId, notes: newNotes });
  };
  const handleNotesCancel = () => { setEditingNotesBlockId(null); setEditingNotes(""); };

  const handleEditNotesFromSidebar = useCallback((blockId: string) => {
      const node = nodes.find(n => n.id === blockId); // Find the node first
      // Access data.rawBlock on the *found node*
      const currentNotes = node?.data?.rawBlock?.notes || ''; 
      setSelectedNode(null);
      setEditingNotes(currentNotes);
      setEditingNotesBlockId(blockId);
  }, [nodes]); // Add nodes dependency

  // REINSTATE handleEdgesDelete
  const handleEdgesDelete = useCallback((deletedEdges: Edge[]) => {
      console.log('Attempting to delete edges:', deletedEdges);
      // Iterate and call mutate for each edge
      deletedEdges.forEach(edge => {
          deleteConnectionMutation.mutate({ connectionId: edge.id });
      });
  }, [deleteConnectionMutation]);

  // Helper function to render sheet content safely
  const renderSheetContent = () => {
      if (!selectedNode) return null;
      const blockData = selectedNode.data.rawBlock as Block | undefined;
      if (!blockData) return <p>Error loading block data.</p>;

      const relatedEdges = edges.filter(edge => 
          edge.source === selectedNode.id || edge.target === selectedNode.id
      );

      const incomingConnections = relatedEdges
          .filter(edge => edge.target === selectedNode.id)
          .map(edge => {
              // Find the source node and safely access its label
              const sourceNode = nodes.find(n => n.id === edge.source);
              const sourceLabel = sourceNode && sourceNode.data ? sourceNode.data.label : edge.source;
              
              return {
                  id: edge.id,
                  connectedNodeId: edge.source,
                  connectedNodeLabel: sourceLabel
              };
          });

      const outgoingConnections = relatedEdges
          .filter(edge => edge.source === selectedNode.id)
          .map(edge => {
              // Find the target node and safely access its label
              const targetNode = nodes.find(n => n.id === edge.target);
              const targetLabel = targetNode && targetNode.data ? targetNode.data.label : edge.target;
              
              return {
                  id: edge.id,
                  connectedNodeId: edge.target,
                  connectedNodeLabel: targetLabel
              };
          });

      const displayContent = () => {
        if (!blockData.content) return '(empty)';
        if (isTextBlockContent(blockData.content)) {
            return <p className={styles.sheetTextContent}>{blockData.content.text}</p>;
        }
        if (isLinkBlockContent(blockData.content)) {
            return <p className={styles.sheetLinkContent}>{blockData.content.url}</p>;
        }
        try {
            return <pre className={styles.sheetJsonContent}>{JSON.stringify(blockData.content, null, 2)}</pre>;
        } catch (_e) {
            return '(Cannot display content)';
        }
      };

      return (
          <>
              <SheetHeader>
                  <SheetTitle>Block Info</SheetTitle>
                  {/* Optional: Add description or more header info */}
                  {/* <SheetDescription>Details for the selected block.</SheetDescription> */}
              </SheetHeader>
              <div className="py-4 space-y-4 overflow-y-auto"> {/* Allow vertical scroll */} 
                  <div className={styles.infoItem}>
                      <strong>ID:</strong> <span>{blockData.id}</span>
                  </div>
                  <div className={styles.infoItem}>
                      <strong>Type:</strong> <span>{blockData.type}</span>
                  </div>
                  <div className={styles.infoItem}>
                      <strong>Created At:</strong>
                      <span>{new Date(blockData.createdAt).toLocaleString()}</span>
                  </div>
                  <div className={styles.infoItem}>
                      <strong>Updated At:</strong>
                      <span>{new Date(blockData.updatedAt).toLocaleString()}</span>
                  </div>
                  
                  <div className={styles.contentPreview}>
                      <h4>Content:</h4>
                      {displayContent()} 
                  </div>

                  {/* Connections Section */}
                  <div className={styles.connectionsSection}>
                      <h4>Connections</h4>
                      {relatedEdges.length === 0 ? (
                          <p className={styles.noConnections}>No connections.</p>
                      ) : (
                          <div className={styles.connectionList}>
                              {incomingConnections.length > 0 && (
                                  <div>
                                      <h5>Incoming:</h5>
                                      <ul>
                                          {incomingConnections.map(conn => (
                                              <li key={conn.id}>From: {conn.connectedNodeLabel}</li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                              {outgoingConnections.length > 0 && (
                                  <div>
                                      <h5>Outgoing:</h5>
                                      <ul>
                                          {outgoingConnections.map(conn => (
                                              <li key={conn.id}>To: {conn.connectedNodeLabel}</li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>

                  <div className={styles.notesSection}>
                      <h4>Notes / Reflections:</h4>
                      <p className={styles.notesContent}>{blockData.notes || '(No notes yet)'}</p>
                      <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditNotesFromSidebar(blockData.id)}
                      >
                          Edit Notes
                      </Button>
                  </div>
                  {/* Add Connections Later */} 
              </div>
              {/* Optional Footer */}
              {/* <SheetFooter>
                  <SheetClose asChild>
                      <Button variant="outline">Close</Button>
                  </SheetClose>
              </SheetFooter> */}
          </>
      );
  }

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
      <div className="flex flex-grow overflow-hidden"> {/* Simple flex wrapper */} 
        <CanvasWorkspace
            key={canvasId}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            canvasTitle={canvasData.title}
            onSaveTitle={handleTitleSave}
            onNodeDragStop={handleNodeDragStop}
            onNodeClick={handleNodeClick} // Pass single click handler
            onNodeDoubleClick={handleNodeDoubleClick} // Pass double click handler
            onConnect={handleConnect}
            onEdgesDelete={handleEdgesDelete} // Pass the handler function
            onBackgroundDoubleClick={handleBackgroundDoubleClick} // Pass background double-click handler
            // Add className for Tailwind layout if needed
            // className="flex-grow h-full" 
        />
      </div>

      {/* Render Sheet */} 
      <Sheet open={isSidebarOpen} onOpenChange={handleSheetOpenChange}>
          <SheetContent className={styles.sheetContent}> {/* Add custom class if needed */} 
              {renderSheetContent()}
          </SheetContent>
      </Sheet>

       {/* Render needed modals */}
       {editingNotesBlockId && (
           <NotesEditModal
               initialNotes={editingNotes}
               onSave={handleNotesSave}
               onCancel={handleNotesCancel}
               isSaving={isUpdatingNotes}
           />
       )}
       {isCreatingBlockInput && (
           <BlockCreationModal
               onSave={handleBlockCreationSave}
               onCancel={handleBlockCreationCancel}
               isSaving={isCreatingBlock}
           />
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

// Restore constant if needed by showUndoNotification
// const UNDO_GRACE_PERIOD_MS = 30 * 1000;
