import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import React, { useCallback } from 'react';
import { Node, useReactFlow } from 'reactflow'; // Import useReactFlow
import 'reactflow/dist/style.css';

// UI Components
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CanvasHeader } from '../components/CanvasHeader';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { NotesEditModal } from '../components/NotesEditModal';
import { BlockCreationModal } from '../components/BlockCreationModal';

// API, Utils, Constants, Hooks
import { Block, CanvasData } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { isUrl } from '../lib/utils';
import { isLinkBlockContent, isTextBlockContent } from '../lib/canvasUtils';
import styles from './canvas.$canvasId.module.css';
import { useCanvasData } from '../hooks/useCanvasData';
import { useReactFlowState } from '../hooks/useReactFlowState';
import { useCanvasUIState } from '../hooks/useCanvasUIState';
import { useCanvasMutations } from '../hooks/useCanvasMutations';
import { useCanvasInteractionHandlers } from '../hooks/useCanvasInteractionHandlers';

// --- Route Definition ---
export const Route = createFileRoute('/canvas/$canvasId')({
  beforeLoad: async ({ location, params }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
    console.log(`[beforeLoad] User authenticated for canvas ${params.canvasId}. Proceeding to load component.`);
  },
  component: CanvasViewPage,
  errorComponent: CanvasErrorComponent,
});

// --- Page Component ---
function CanvasViewPage() {
  const { canvasId } = Route.useParams();
  const reactFlowInstance = useReactFlow(); // Get React Flow instance

  // --- Hooks ---
  const { canvasData, isCanvasLoading, canvasError } = useCanvasData(canvasId);
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges } = useReactFlowState(canvasData);
  const {
    selectedNode,
    setSelectedNode,
    isSidebarOpen,
    handleCloseSidebar,
    editingNotesBlockId,
    editingNotes,
    handleOpenNotesEditor,
    handleCloseNotesEditor,
    isCreatingBlockInput,
    newBlockPosition,
    handleOpenBlockCreator,
    handleCloseBlockCreator,
    undoBlockId, // Keep track of undo state if needed for UI elements
    handleShowUndoNotification,
    handleUndoFail,
  } = useCanvasUIState();

  const mutations = useCanvasMutations(
    canvasId,
    setEdges, // Pass setEdges for optimistic updates
    handleShowUndoNotification,
    handleUndoFail
  );

  const interactionHandlers = useCanvasInteractionHandlers(
    canvasId,
    { // Pass only the needed mutation functions
      performUpdateBlockPosition: mutations.performUpdateBlockPosition,
      performCreateConnection: mutations.performCreateConnection,
      performDeleteConnection: mutations.performDeleteConnection,
    },
    { // Pass only the needed UI handlers
      setSelectedNode,
      handleOpenNotesEditor,
      handleOpenBlockCreator,
    }
  );

  // --- Specific Handlers using Hook Results ---

  const handleTitleSave = useCallback((newTitle: string) => {
    if (!canvasId) return;
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle) {
      mutations.performUpdateCanvasTitle({ id: canvasId, title: trimmedTitle });
    } else {
      console.error("Canvas title cannot be empty.");
      alert("Canvas title cannot be empty."); // User feedback
    }
  }, [canvasId, mutations.performUpdateCanvasTitle]);

  const handleCreateNewBlock = useCallback(() => {
    // Generate a somewhat random position within a reasonable area
    const viewport = reactFlowInstance.getViewport();
    const position = {
        x: Math.random() * (viewport?.width * 0.6 || 400), // Use optional chaining and fallback
        y: Math.random() * (viewport?.height * 0.6 || 400) // Use optional chaining and fallback
    };
    handleOpenBlockCreator(position);
  }, [handleOpenBlockCreator, reactFlowInstance]);

  const handleBlockCreationSave = useCallback((inputValue: string) => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || !canvasId) {
      handleCloseBlockCreator();
      return;
    }
    let blockType: 'text' | 'link' = 'text';
    let blockContent: unknown = { text: trimmedInput };
    if (isUrl(trimmedInput)) {
      blockType = 'link';
      blockContent = { url: trimmedInput };
    }
    mutations.performCreateBlock({ canvasId, type: blockType, position: newBlockPosition, content: blockContent });
    handleCloseBlockCreator();
  }, [canvasId, newBlockPosition, mutations.performCreateBlock, handleCloseBlockCreator]);

  const handleNotesSave = useCallback((newNotes: string) => {
    if (editingNotesBlockId === null) return;
    mutations.performUpdateBlockNotes({ blockId: editingNotesBlockId, notes: newNotes });
    handleCloseNotesEditor(); // Close modal on save
  }, [editingNotesBlockId, mutations.performUpdateBlockNotes, handleCloseNotesEditor]);

  // --- Sidebar Content Renderer ---
  // Note: handleBackgroundDoubleClickWrapper is removed as CanvasWorkspace now handles position calculation
  const renderSheetContent = () => {
    if (!selectedNode) return null;
    const blockData = selectedNode.data.rawBlock as Block | undefined;
    if (!blockData) return <p>Error loading block data.</p>;

    // Find related edges (connections)
    const relatedEdges = edges.filter(edge =>
        edge.source === selectedNode.id || edge.target === selectedNode.id
    );
    const incomingConnections = relatedEdges
        .filter(edge => edge.target === selectedNode.id)
        .map(edge => nodes.find(n => n.id === edge.source)?.data?.label || edge.source); // Minor whitespace change
    const outgoingConnections = relatedEdges
        .filter(edge => edge.source === selectedNode.id)
        .map(edge => nodes.find(n => n.id === edge.target)?.data?.label || edge.target); // Minor whitespace change

    const displayContent = () => {
      if (!blockData.content) return '(empty)';
    }; // End of displayContent inner function

    return (
        <>
            <SheetHeader>
                <SheetTitle>Block Info</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4 overflow-y-auto">
                <div className={styles.infoItem}><strong>ID:</strong> <span>{blockData.id}</span></div>
                <div className={styles.infoItem}><strong>Type:</strong> <span>{blockData.type}</span></div>
                <div className={styles.infoItem}><strong>Created:</strong> <span>{new Date(blockData.createdAt).toLocaleString()}</span></div>
                <div className={styles.infoItem}><strong>Updated:</strong> <span>{new Date(blockData.updatedAt).toLocaleString()}</span></div>
                <div className={styles.contentPreview}><h4>Content:</h4>{displayContent()}</div>
                <div className={styles.connectionsSection}>
                    <h4>Connections</h4>
                    {relatedEdges.length === 0 ? <p className={styles.noConnections}>No connections.</p> : (
                        <div className={styles.connectionList}>
                            {incomingConnections.length > 0 && <div><h5>Incoming:</h5><ul>{incomingConnections.map((label, i) => <li key={`in-${i}`}>{label}</li>)}</ul></div>}
                            {outgoingConnections.length > 0 && <div><h5>Outgoing:</h5><ul>{outgoingConnections.map((label, i) => <li key={`out-${i}`}>{label}</li>)}</ul></div>}
                        </div>
                    )}
                </div>
                <div className={styles.notesSection}>
                    <h4>Notes / Reflections:</h4>
                    <p className={styles.notesContent}>{blockData.notes || '(No notes yet)'}</p>
                    <Button variant="outline" size="sm" onClick={() => handleOpenNotesEditor(blockData.id, blockData.notes || '')}>
                        Edit Notes
                    </Button>
                </div>
            </div>
        </>
    );
  } // End of renderSheetContent function

  // --- Render Logic ---
  if (isCanvasLoading && !canvasData) {
    return <div>Loading Canvas...</div>;
  }

  if (canvasError) {
    return <CanvasErrorComponent error={canvasError} />;
  }

  if (!canvasData) {
    return <div>Canvas not found or failed to load.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <CanvasHeader
        initialCanvas={canvasData}
        onCreateBlock={handleCreateNewBlock}
        isCreatingBlock={mutations.isCreatingBlock}
      />
      <div className="flex flex-grow overflow-hidden">
        <CanvasWorkspace
          key={canvasId} // Ensure workspace rerenders if canvasId changes
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          canvasTitle={canvasData.title}
          onSaveTitle={handleTitleSave}
          onNodeDragStart={interactionHandlers.handleNodeDragStart}
          onNodeDragStop={interactionHandlers.handleNodeDragStop}
          onNodeClick={interactionHandlers.handleNodeClick}
          onNodeDoubleClick={interactionHandlers.handleNodeDoubleClick}
          onConnect={interactionHandlers.handleConnect}
          onEdgesDelete={interactionHandlers.handleEdgesDelete}
          onBackgroundDoubleClick={interactionHandlers.handleBackgroundDoubleClick} // Pass handler directly
        />
      </div>

      <Sheet open={isSidebarOpen} onOpenChange={(open) => !open && handleCloseSidebar()}>
        <SheetContent className={styles.sheetContent}>
          {renderSheetContent()}
        </SheetContent>
      </Sheet>

      {editingNotesBlockId && (
        <NotesEditModal
          initialNotes={editingNotes}
          onSave={handleNotesSave}
          onCancel={handleCloseNotesEditor}
          isSaving={mutations.isUpdatingNotes}
        />
      )}
      {isCreatingBlockInput && (
        <BlockCreationModal
          onSave={handleBlockCreationSave}
          onCancel={handleCloseBlockCreator}
          isSaving={mutations.isCreatingBlock}
        />
      )}

      {/* Optional: Add Undo Notification UI element here if needed */}
      {undoBlockId && (
         <div className={styles.undoNotification}>
             Block created. <button onClick={() => mutations.performUndoBlockCreation(undoBlockId)}>Undo</button>
             {/* Add a visual timer maybe? */}
         </div>
       )}
    </div>
  );
}

// Simple component to display loading errors
function CanvasErrorComponent({ error }: { error: Error }) {
  return (
    <div className={styles.container} style={{ color: 'red' }}>
      <Link to="/">&laquo; Back to Canvases</Link>
      <h2>Error Loading Canvas</h2>
      <p>{error?.message ?? 'An unknown error occurred.'}</p>
    </div>
  );
}
