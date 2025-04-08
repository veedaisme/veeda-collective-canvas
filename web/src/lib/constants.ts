// Query Keys
export const queryKeys = {
  canvas: (canvasId: string) => ['canvas', canvasId] as const,
  // Add other query keys as needed
};

// Timeouts & Durations (in milliseconds)
export const UNDO_GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
export const STALE_TIME_CANVAS_DATA = 5 * 60 * 1000; // 5 minutes

// Interaction Thresholds
export const NODE_DRAG_THRESHOLD = 1; // Minimum pixels moved to trigger update

// Add other constants as needed
