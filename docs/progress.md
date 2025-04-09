# Project Progress

## April 9, 2025

*   **Milestone:** Supabase Migration Setup.
    *   Introspected existing Supabase project "veeda collective canvas".
    *   Generated initial migration SQL (`backend/src/data/migrations/001_init.sql`) containing schema for `canvases`, `blocks`, and `connections` tables.
    *   Included RLS policies enforcing user ownership on all three tables.
    *   Migration file enables `uuid-ossp` extension, creates tables with constraints, enables RLS, and adds policies.
    *   This migration can be used to recreate the schema in new environments or reset the database state.
    *   Next steps: integrate migration application into backend workflow or CI/CD pipeline.

*   **Milestone:** Cloudflare Deployment Configuration.
    *   Analyzed deployment options for the `web` (React/Vite) frontend and `backend` (Deno/Hono) applications.
    *   Planned strategy: Deploy frontend to Cloudflare Pages and backend to Cloudflare Workers.
    *   Created `backend/wrangler.toml` configuration file for the Cloudflare Worker.
    *   Created `.github/workflows/deploy.yml` to automate deployment of both frontend and backend via GitHub Actions upon pushes to the `main` branch.
    *   Added environment variables from `backend/.env.example` to GitHub Actions workflow for Cloudflare Worker deployment.
    *   Identified necessary GitHub secrets and Cloudflare Worker secrets for the deployment pipeline.

*   **Milestone:** Fixed Backend GitHub Action Deployment with Wrangler v4.
    *   Investigated GitHub Actions error: "Missing entry-point" and outdated Wrangler warning.
    *   Determined root cause was use of deprecated `cloudflare/wrangler-action@v3` and explicit entry file argument.
    *   Removed explicit `main.ts` argument from deploy command to rely on `wrangler.toml` config.
    *   Attempted upgrade to `cloudflare/wrangler-action@v4`, but it does not exist (deprecated).
    *   Updated workflow to install latest Wrangler CLI globally via `npm install -g wrangler@latest`.
    *   Simplified deploy step to `wrangler deploy --env production` with correct working directory.
    *   This aligns with Cloudflare's recommended approach for Wrangler v4+ and resolves the entry-point detection error.

## April 7, 2025 (cont.)

*   **Milestone:** Improved UI with Shadcn Sheet and Bug Fixes.
    *   Installed shadcn/ui and added `sheet`, `button` components.
    *   Replaced custom `BlockInfoSidebar` with shadcn `Sheet` component in `CanvasViewPage` for displaying selected block details.
    *   Updated single-click (`onNodeClick`) and double-click (`onNodeDoubleClick`) handlers to manage Sheet visibility and trigger appropriate actions (show sheet, navigate link, open editor).
    *   Updated `renderSheetContent` to display incoming/outgoing connection information based on current `edges` and `nodes` state.
    *   Fixed Supabase RLS policy for deleting connections by adjusting type casting (`fix_rls_delete_connections_join_cast_uid`).
    *   Fixed `deleteConnectionRecord` in `db.ts` to correctly return `true` on success even if RLS hides the affected row count.
    *   Fixed `handleEdgesDelete` in `CanvasViewPage` to correctly iterate and call the delete mutation for each selected edge.
    *   Resolved path alias issues for shadcn/ui imports in Vite/TSConfig.
    *   Fixed various linter errors (unused variables, type mismatches, property access).
    *   Ensured connection creation updates the UI immediately by using `setEdges(addEdge(...))` in mutation `onSuccess`.

## April 7, 2025

*   **Milestone:** Block Notes and Link Block Creation Implemented.
    *   Added `notes` column to `blocks` table in Supabase.
    *   Added `updateBlockNotes` mutation to GraphQL schema and resolvers.
    *   Implemented `updateBlockRecordNotes` data access function.
    *   Added `UPDATE_BLOCK_NOTES_MUTATION` and `updateBlockNotes` API function (frontend).
    *   Added `NotesEditModal` component and CSS.
    *   Updated `CanvasViewPage` to handle double-clicking non-text blocks to open the notes modal.
    *   Refactored `CanvasViewPage` and `CanvasWorkspace` to correctly manage React Flow state (fixing unnecessary position updates).
    *   Changed "Add New Block" to open `BlockCreationModal`.
    *   Implemented `isUrl` utility function.
    *   Updated block creation logic in `CanvasViewPage` to detect URLs in the modal input and create blocks with `type: 'link'` and `{ url: ... }` content, otherwise creating `type: 'text'` blocks.
    *   Fixed prop mismatches and linter errors related to block/notes editing.

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

*   **Milestone:** Integrated Supabase PostgreSQL Database.
    *   Installed Supabase CLI and initialized local development environment.
    *   Defined database schema (Canvases, Blocks, Connections) with RLS policies for user ownership.
    *   Replaced in-memory data stores (`db.ts`) with Supabase client operations (select, insert, update, delete).
    *   Implemented Supabase authentication middleware in the backend.
    *   Updated frontend to use Supabase client for authentication (Login/Signup).
    *   Refactored frontend routes and data fetching to handle authenticated sessions and redirects.
    *   Ensured data operations correctly use user-specific Supabase client via context to respect RLS.
    *   Fixed issues related to updating canvas titles and creating blocks due to incorrect client usage or schema mismatches (using `PositionInput`, standard `JSON` scalar).

## April 8, 2025

*   **Milestone:** Refined Block Node UI with `StyledBlockNode`.
    *   Created `StyledBlockNode` component using shadcn `Card` for a consistent UI.
    *   Implemented logic to display block `type` in the header, main `content` (text, link, or fallback), and optional `notes` as a footnote.
    *   Added CSS module (`StyledBlockNode.module.css`) and iteratively refined styling (padding, borders, font sizes, max-height, overflow) for better layout and readability based on visual feedback.
    *   Replaced the previous `LinkNode` with `StyledBlockNode` in `CanvasWorkspace`, updating `nodeTypes` and `mapBlockToNode`.
    *   Removed the unused `LinkNode` component and its styles.

*   **Next Steps:**
    *   Implement double-click on link-type blocks to open the URL in a new tab.
    *   Implement link preview (fetch title/favicon) for link blocks, potentially using a backend function.
    *   Add capability to update block notes from the sidebar/sheet.
    *   Refine UI/UX (e.g., styling consistency, loading/error states).
    *   Implement Image Blocks (BM-3).
    *   Implement basic Sharing features (SV-1, SV-2, SV-3).
    *   Re-enable/refactor text block content editing.

## April 8, 2025 (cont.)

*   **Milestone:** Canvas Background Double-Click Block Creation.
    *   Implemented double-click on empty canvas background to open the block creation modal.
    *   New block is created precisely at the double-clicked position.
    *   Disabled default React Flow zoom on double-click to enable this feature.

*   **Milestone:** Inline Link Preview for Link-Type Blocks
    *   Updated `StyledBlockNode` component to display a link preview **below the main content and above the footnote (notes)**.
    *   The preview fetches metadata (title, favicon) for the URL and displays it as a clickable card.
    *   Clicking the preview opens the link in a new browser tab (`target="_blank"` with `rel="noopener noreferrer"`).
    *   Implemented client-side metadata fetching using `useEffect` and `fetch`.
    *   Handled loading and error states gracefully within the preview area.
    *   Styled the preview for visual clarity and hover feedback, consistent with existing UI.
    *   This replaces the previous plan to open the URL on double-click, providing a more intuitive and discoverable interaction.

*   **Milestone:** Enhanced Inline Link Preview Functionality
    *   Improved metadata extraction by parsing Open Graph tags and Twitter oEmbed API for richer previews.
    *   Implemented special handling for Twitter links to fetch tweet info via oEmbed.
    *   Simplified preview UI by removing redundant title/domain when content already shows the URL.
    *   Error messages for failed previews now auto-dismiss after 3 seconds and appear less prominently.
    *   Link preview container is only rendered when loading, error, or metadata exists, reducing empty space.
    *   Adjusted styling for a cleaner, more proportional block layout.

*   **Milestone:** Optimized Block Dragging to Reduce Unnecessary Backend Updates
    *   Implemented drag start position tracking to detect significant block movements.
    *   Backend update for block position now only triggers if the block was moved beyond a minimal threshold.
    *   Updated `CanvasWorkspace` to forward `onNodeDragStart` to React Flow.
    *   This reduces redundant network calls and improves performance during block interactions.

*   **Milestone:** Refactored Canvas Page Component (`canvas.$canvasId.tsx`).
    *   Extracted data fetching logic into `useCanvasData` hook.
    *   Extracted React Flow state management into `useReactFlowState` hook.
    *   Extracted UI state management (modals, sidebar, undo) into `useCanvasUIState` hook.
    *   Consolidated API mutations into `useCanvasMutations` hook.
    *   Grouped React Flow interaction handlers into `useCanvasInteractionHandlers` hook.
    *   Created `canvasUtils.ts` for type guards and data mappers.
    *   Created `constants.ts` for query keys and magic numbers.
    *   Simplified the main `CanvasViewPage` component to use these hooks, improving modularity and readability.
    *   Fixed single/double-click handling conflict on nodes.
