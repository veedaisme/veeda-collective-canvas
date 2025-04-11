import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import 'reactflow/dist/style.css';

// UI Components
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CanvasHeader } from '../components/CanvasHeader';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { NotesEditModal } from '../components/NotesEditModal';
import { BlockCreationModal } from '../components/BlockCreationModal';
import { TextContentEditModal } from '../components/TextContentEditModal';

// API, Utils, Constants, Hooks
import { Block, updateCanvasVisibility } from '../lib/api';
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
    editingContentBlockId,
    editingContent,
    openContentEditor,
    closeContentEditor,
    isCreatingBlockInput,
    newBlockPosition,
    handleOpenBlockCreator,
    handleCloseBlockCreator,
    undoBlockId,
    handleShowUndoNotification,
    handleUndoFail,
  } = useCanvasUIState();

  const mutations = useCanvasMutations(
    canvasId,
    setEdges,
    handleShowUndoNotification,
    handleUndoFail
  );

  const interactionHandlers = useCanvasInteractionHandlers(
    canvasId,
    {
      performUpdateBlockPosition: mutations.performUpdateBlockPosition,
      performCreateConnection: mutations.performCreateConnection,
      performDeleteConnection: mutations.performDeleteConnection,
    },
    {
      setSelectedNode,
      handleOpenNotesEditor,
      handleOpenBlockCreator,
      openContentEditor,
    }
  );

  // --- Auth State for Owner Check ---
  const [userId, setUserId] = useState<string | null>(null);
  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null));
  });

  // --- Local State for Toggle ---
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  // --- Handlers ---
  const handleCreateNewBlock = useCallback(() => {
    handleOpenBlockCreator({ x: 100, y: 100 });
  }, [handleOpenBlockCreator]);

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
    const finalPosition = newBlockPosition || { x: 150, y: 150 };
    mutations.performCreateBlock({ canvasId, type: blockType, position: finalPosition, content: blockContent });
    handleCloseBlockCreator();
  }, [canvasId, newBlockPosition, mutations.performCreateBlock, handleCloseBlockCreator]);

  const handleNotesSave = useCallback((newNotes: string) => {
    if (editingNotesBlockId === null) return;
    mutations.performUpdateBlockNotes({ blockId: editingNotesBlockId, notes: newNotes });
    handleCloseNotesEditor();
  }, [editingNotesBlockId, mutations.performUpdateBlockNotes, handleCloseNotesEditor]);

  // --- Visibility Toggle Handler ---
  const handleToggleVisibility = async () => {
    if (!canvasData) return;
    setIsUpdatingVisibility(true);
    setVisibilityError(null);
    try {
      const updated = await updateCanvasVisibility({ id: canvasData.id, isPublic: !canvasData.isPublic });
      // Optimistically update UI (or refetch)
      canvasData.isPublic = updated.isPublic;
    } catch (err: any) {
      setVisibilityError(err?.message || "Failed to update visibility");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // --- Owner and View-Only Logic ---
  const isOwner = userId && canvasData && (userId === (canvasData as any).userId);
  const isPublic = canvasData?.isPublic;
  const showViewOnlyBanner = !isOwner && isPublic;

  // --- Render Sheet Content (unchanged) ---
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
              const node = nodes.find(n => n.id === edge.source);
              return (node?.data as { label?: string })?.label || edge.source;
            });
    const outgoingConnections = relatedEdges
        .filter(edge => edge.source === selectedNode.id)
        .map(edge => {
          const node = nodes.find(n => n.id === edge.target);
          return (node?.data as { label?: string })?.label || edge.target;
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
      } catch {
          return '(Cannot display content)';
      }
    };

    return (
        <>
            <SheetHeader><SheetTitle>Block Info</SheetTitle></SheetHeader>
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
  }

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
      {/* Public/Private Toggle and View Only Banner */}
      <div className={styles.visibilityBar}>
        {isOwner && (
          <div className={styles.visibilityToggle}>
            <label>
              <input
                type="checkbox"
                checked={!!canvasData.isPublic}
                onChange={handleToggleVisibility}
                disabled={isUpdatingVisibility}
              />
              {canvasData.isPublic ? "Public" : "Private"}
            </label>
            {isUpdatingVisibility && <span className={styles.visibilityStatus}>Updating...</span>}
            {visibilityError && <span className={styles.visibilityError}>{visibilityError}</span>}
            {canvasData.isPublic && (
              <span className={styles.shareLink}>
                Shareable Link: <input type="text" readOnly value={window.location.href} style={{ width: 280 }} onFocus={e => e.target.select()} />
              </span>
            )}
          </div>
        )}
        {showViewOnlyBanner && (
          <div className={styles.viewOnlyBanner}>
            <strong>View Only:</strong> This canvas is public and you are not the owner. Editing is disabled.
          </div>
        )}
      </div>
      <CanvasHeader
        initialCanvas={canvasData}
        onCreateBlock={handleCreateNewBlock}
        isCreatingBlock={mutations.isCreatingBlock}
      />
      <div className="flex flex-grow overflow-hidden">
        <CanvasWorkspace
          key={canvasId}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStart={interactionHandlers.handleNodeDragStart}
          onNodeDragStop={interactionHandlers.handleNodeDragStop}
          onNodeClick={interactionHandlers.handleNodeClick}
          onNodeDoubleClick={interactionHandlers.handleNodeDoubleClick}
          onConnect={interactionHandlers.handleConnect}
          onEdgesDelete={interactionHandlers.handleEdgesDelete}
          onBackgroundDoubleClick={interactionHandlers.handleBackgroundDoubleClick}
          readOnly={showViewOnlyBanner}
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

      {undoBlockId && (
         <div className={styles.undoNotification}>
             Block created. <button onClick={() => mutations.performUndoBlockCreation(undoBlockId)}>Undo</button>
         </div>
       )}

      {editingContentBlockId && (
        <TextContentEditModal
          initialContent={editingContent}
          onSave={(newContent) => {
            if (!editingContentBlockId) return;
            mutations.performUpdateBlockContent({ blockId: editingContentBlockId, content: { text: newContent } });
            closeContentEditor();
          }}
          onCancel={closeContentEditor}
        />
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
