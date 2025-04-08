import React, { useState, useEffect } from 'react';
import styles from './NotesEditModal.module.css'; // Reuse styles
import { Button } from '@/components/ui/button';

interface TextContentEditModalProps {
  initialContent: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function TextContentEditModal({
  initialContent,
  onSave,
  onCancel,
  isSaving = false,
}: TextContentEditModalProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Edit Block Content</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Enter block content..."
        />
        <div className={styles.modalButtons}>
          <Button onClick={() => onSave(content)} disabled={isSaving}>
            Save
          </Button>
          <Button onClick={onCancel} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TextContentEditModal;
