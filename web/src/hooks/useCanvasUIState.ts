import { useState, useCallback } from 'react';
import { Node } from 'reactflow';
import { UNDO_GRACE_PERIOD_MS } from '../lib/constants';

/**
 * Custom hook to manage UI-related state for the canvas page.
 *
 * @returns An object containing UI state variables and their setters/handlers.
 */
export function useCanvasUIState() {
    // Sidebar/Sheet state
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const isSidebarOpen = !!selectedNode;

    // Notes Editing Modal state
    const [editingNotesBlockId, setEditingNotesBlockId] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState<string>("");

    // Text Content Editing Modal state
    const [editingContentBlockId, setEditingContentBlockId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState<string>("");

    // Block Creation Modal state
    const [isCreatingBlockInput, setIsCreatingBlockInput] = useState<boolean>(false);
    const [newBlockPosition, setNewBlockPosition] = useState<{ x: number; y: number }>({ x: 100, y: 100 });

    // Undo Notification state
    const [undoBlockId, setUndoBlockId] = useState<string | null>(null);
    const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

    // --- Handlers ---

    const handleShowUndoNotification = useCallback((blockId: string) => {
        console.log("[useCanvasUIState] Showing undo for", blockId);
        setUndoBlockId(blockId);
        if (undoTimeoutId) clearTimeout(undoTimeoutId);
        const timeoutId = window.setTimeout(() => {
            console.log("[useCanvasUIState] Undo timeout expired for", blockId);
            setUndoBlockId(null);
        }, UNDO_GRACE_PERIOD_MS - 1000); // Subtract a second for safety margin
        setUndoTimeoutId(timeoutId);
    }, [undoTimeoutId]);

    const openContentEditor = useCallback((blockId: string, currentContent: string) => {
        setEditingContentBlockId(blockId);
        setEditingContent(currentContent);
    }, []);

    const closeContentEditor = useCallback(() => {
        setEditingContentBlockId(null);
        setEditingContent("");
    }, []);

    const handleUndoFail = useCallback((blockId: string) => {
        console.warn(`[useCanvasUIState] Failed to undo block ${blockId} (likely expired)`);
        alert("Undo period expired or failed.");
        if (undoBlockId === blockId) setUndoBlockId(null);
        if (undoTimeoutId) clearTimeout(undoTimeoutId);
    }, [undoBlockId, undoTimeoutId]); // Dependencies to check/clear state

    const handleCloseSidebar = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const handleOpenNotesEditor = useCallback((blockId: string, currentNotes: string) => {
        setSelectedNode(null); // Close sidebar if open
        setEditingNotes(currentNotes);
        setEditingNotesBlockId(blockId);
    }, []);

    const handleCloseNotesEditor = useCallback(() => {
        setEditingNotesBlockId(null);
        setEditingNotes("");
    }, []);

    const handleOpenBlockCreator = useCallback((position: { x: number, y: number }) => {
        setNewBlockPosition(position);
        setIsCreatingBlockInput(true);
    }, []);

    const handleCloseBlockCreator = useCallback(() => {
        setIsCreatingBlockInput(false);
    }, []);

    return {
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
        setUndoBlockId, // Expose setter if needed by mutation hook directly
        handleShowUndoNotification,
        handleUndoFail,
    };
}
