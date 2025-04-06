# Project Progress

## April 5, 2025

*   **Milestone:** Block Positioning Implemented.
    *   Added `updateBlockPosition` mutation to backend schema and resolvers.
    *   Implemented corresponding data access function (`updateBlockRecordPosition`).
    *   Added frontend API function for updating position.
    *   Implemented `onNodeDragStop` handler in `CanvasWorkspace` to trigger the mutation.
    *   Updated React Query cache on successful position update.

*   **Milestone:** Initial Block Management Features Implemented.
    *   Added `Block` type and relations to backend GraphQL schema.
    *   Implemented backend mutations for `createBlock` and `undoBlockCreation` (30s grace period) with in-memory store.
    *   Updated backend canvas query to fetch associated blocks.
    *   Integrated `reactflow` library into the frontend canvas view.
    *   Mapped fetched blocks to `reactflow` nodes for display.
    *   Implemented frontend mutation handling for creating blocks via a button.
    *   Added frontend undo notification mechanism linked to the `undoBlockCreation` mutation.

*   **Milestone:** Initial Canvas Management MVP Features Implemented.
    *   Setup basic Frontend (React/Vite/TS + TanStack Router/Query) and Backend (Deno/TS + Hono + GraphQL Yoga) projects.
    *   Implemented GraphQL API (in-memory) and corresponding frontend logic for:
        *   Listing user canvases (`/`).
        *   Creating new canvases (`/`).
        *   Viewing a specific canvas details page (`/canvas/:id`).
        *   Updating canvas titles inline on the detail page.
    *   Established project structure, ADRs for key tech choices, and initial styling.
    *   Ensured frontend linting and build pass.

*   **Block Content Editing (Text Blocks - Modal):**
    *   Added `updateBlockContent` mutation to GraphQL schema (`schema.ts`).
    *   Added `updateBlockRecordContent` function to `db.ts` (backend).
    *   Added `updateBlockContent` resolver (backend).
    *   Added `UPDATE_BLOCK_CONTENT_MUTATION` and `updateBlockContent` API function (frontend).
    *   Modified `CanvasWorkspace` to accept `onNodeDoubleClick` callback.
    *   In `CanvasViewPage`:
        *   Added state for `editingBlockId` and `editingContent`.
        *   Added `useMutation` hook for `updateBlockContent`.
        *   Implemented `handleNodeDoubleClick` to open editor (only for 'text' blocks).
        *   Implemented `handleContentSave` and `handleContentCancel`.
        *   Added modal overlay with textarea and save/cancel buttons triggered by `editingBlockId`.
    *   Added CSS styles for the editing modal (`canvas.$canvasId.module.css`).

*   **Block Connections (Edges):**
    *   Added `Connection` type and `createConnection`/`deleteConnection` mutations to GraphQL schema (`schema.ts`).
    *   Added `connections` field resolver to `Canvas` type in schema.
    *   Added `ConnectionRecord` type, `connectionsStore`, and `create/delete/list` functions to `db.ts` (backend).
    *   Added resolvers for `createConnection`, `deleteConnection`, and `Canvas.connections` (backend).
    *   Updated `GET_CANVAS_QUERY` to fetch connections (frontend `api.ts`).
    *   Added `CREATE/DELETE_CONNECTION_MUTATION` and `create/deleteConnection` API functions (frontend `api.ts`).
    *   Updated `CanvasWorkspace` to handle `initialEdges`, `onConnect`, `onEdgesDelete` props.
    *   In `CanvasViewPage` (`canvas.$canvasId.tsx`):
        *   Fetched connections and mapped them to `Edge` objects.
        *   Added `useMutation` hooks for `createConnection` and `deleteConnection` with cache updates.
        *   Implemented `handleConnect` and `handleEdgesDelete` callbacks.
    *   Fixed schema/resolver mismatch for `Canvas.connections`.
    *   Fixed frontend `ReferenceError` for `handleTitleSave` and `updateCanvasTitleMutation`.
    *   Corrected `graphql-scalars` import path in backend resolvers and cached dependency.

*   **Next Steps:**
    *   Connect backend to PostgreSQL database.
    *   Implement User Authentication.
