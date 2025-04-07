import React, { useState } from 'react';
import styles from './BlockCreationModal.module.css'; // Assuming CSS module exists

interface BlockCreationModalProps {
    onSave: (inputValue: string) => void;
    onCancel: () => void;
    isSaving: boolean;
}

export const BlockCreationModal: React.FC<BlockCreationModalProps> = ({
    onSave,
    onCancel,
    isSaving,
}) => {
    const [inputValue, setInputValue] = useState('');

    const handleSaveClick = () => {
        onSave(inputValue);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Optional: Save on Enter (Shift+Enter for newline)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent newline
            handleSaveClick();
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Create New Block</h2>
                <p>Enter text or paste a URL:</p>
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type text or paste a URL here..."
                    rows={5} // Adjust size as needed
                    className={styles.inputTextarea}
                    onKeyDown={handleKeyDown} // Optional: Save on Enter
                    disabled={isSaving}
                    autoFocus // Focus the input when modal opens
                />
                <div className={styles.modalActions}>
                    <button onClick={handleSaveClick} disabled={isSaving || !inputValue.trim()}>
                        {isSaving ? 'Creating...' : 'Create Block'}
                    </button>
                    <button onClick={onCancel} disabled={isSaving}>Cancel</button>
                </div>
            </div>
        </div>
    );
}; 