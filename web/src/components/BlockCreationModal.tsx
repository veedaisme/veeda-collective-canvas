import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { THEME } from "@/theme";

interface BlockCreationModalProps {
  open: boolean;
  onSave: (inputValue: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const BlockCreationModal: React.FC<BlockCreationModalProps> = ({
  open,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (open) setInputValue("");
  }, [open]);

  if (!open) return null;

  const handleSaveClick = () => {
    onSave(inputValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSaveClick();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      style={{ zIndex: THEME.zIndexHeader + 20 }}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col gap-6 border border-border">
        <div>
          <h2 className="text-xl font-bold mb-1">Create New Block</h2>
          <p className="text-muted-foreground mb-2">Enter text or paste a URL:</p>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type text or paste a URL here..."
            rows={5}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 resize-none"
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            autoFocus
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            onClick={handleSaveClick}
            disabled={isSaving || !inputValue.trim()}
            className="min-w-[120px]"
          >
            {isSaving ? "Creating..." : "Create Block"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
