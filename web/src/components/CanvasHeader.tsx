import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCanvasTitle, Canvas } from '../lib/api';
import styles from './CanvasHeader.module.css';

interface CanvasHeaderProps {
    initialCanvas: Canvas;
    onCreateBlock: () => void; // Callback to trigger block creation
    isCreatingBlock: boolean;
    isOwner: string | boolean | null | undefined;
}

export function CanvasHeader({ initialCanvas, onCreateBlock, isCreatingBlock, isOwner }: CanvasHeaderProps) {
    const queryClient = useQueryClient();
    const canvasId = initialCanvas.id;

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState(initialCanvas.title);
    const [updateTitleError, setUpdateTitleError] = useState<string | null>(null);

    // Effect to reset editTitle if initialCanvas data changes
    useEffect(() => {
        setEditTitle(initialCanvas.title);
    }, [initialCanvas.title]);

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

    return (
        <div className={styles.topBar}>
            <Link to="/" className={styles.backLink}>&laquo; Back to Canvases</Link>
            <div className={styles.titleContainer}>
                {isOwner ? (
                    <>
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
                            <h2 className={styles.title} onClick={() => setIsEditingTitle(true)} title="Click to edit">
                                {initialCanvas.title}
                            </h2>
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
                    </>
                ) : (
                    <h2 className={styles.title}>{initialCanvas.title}</h2>
                )}
            </div>
            {updateTitleError && <p className={styles.errorText}>Error: {updateTitleError}</p>}
            {isOwner && (
                <button onClick={onCreateBlock} disabled={isCreatingBlock} className={styles.createButton}>
                    {isCreatingBlock ? 'Creating Block...' : '+ Add Block'}
                </button>
            )}
        </div>
    );
}