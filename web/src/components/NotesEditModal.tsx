import React, { useState, useEffect } from 'react';
import styles from './NotesEditModal.module.css'; // Assuming CSS module exists

interface NotesEditModalProps {
    initialNotes: string | null | undefined;
    onSave: (notes: string) => void;
    onCancel: () => void;
    isSaving: boolean;
}

export const NotesEditModal: React.FC<NotesEditModalProps> = ({
    initialNotes,
    onSave,
    onCancel,
    isSaving,
}) => {
    const [notes, setNotes] = useState('');

    // Initialize state when the modal opens (initialNotes changes)
    useEffect(() => {
        setNotes(initialNotes || '');
    }, [initialNotes]);

    const handleSaveClick = () => {
        onSave(notes);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Edit Block Notes</h2>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your notes or reflections here..."
                    rows={10}
                    cols={50}
                    className={styles.notesTextarea} // Apply specific styling if needed
                    disabled={isSaving}
                />
                <div className={styles.modalActions}>
                    <button onClick={handleSaveClick} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Notes'}
                    </button>
                    <button onClick={onCancel} disabled={isSaving}>Cancel</button>
                </div>
            </div>
        </div>
    );
}; 