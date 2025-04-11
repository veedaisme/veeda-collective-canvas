# Project Progress

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

## April 11, 2025

*   **Milestone:** Public/Private Toggle for Canvases Implemented.
    *   Added RLS (Row Level Security) policies in Supabase to allow anyone to SELECT canvases, blocks, and connections if the parent canvas is public (`is_public = true`).
    *   Updated `backend/src/data/migrations/001_init.sql` to include:
        *   `CREATE POLICY "Can view public canvases"` on `canvases`
        *   `CREATE POLICY "Can view blocks of public canvases"` on `blocks`
        *   `CREATE POLICY "Can view connections of public canvases"` on `connections`
    *   Added `updateCanvasVisibility` mutation to GraphQL schema (`backend/src/graphql/schema.ts`).
    *   Implemented `updateCanvasVisibilityRecord` data access function in `backend/src/data/db.ts`.
    *   Added resolver for `updateCanvasVisibility` in `backend/src/graphql/resolvers.ts`.
    *   Enforced that when a canvas is public, all its blocks and connections are also public (viewable by anyone with the link).
    *   This enables the MVP sharing requirements: users can toggle a canvas public/private, generate a shareable link, and anyone with the link can view the canvas (read-only).

## April 10, 2025

*   **Fix:** Resolved TypeScript import errors in `backend-node/src/server.ts`.
    *   Added explicit `.js` extensions to relative imports (`./graphql/schema.js`, `./graphql/resolvers.js`, `./lib/supabaseClient.js`) to comply with `moduleResolution: node16`.
    *   Removed invalid named import `User` from `@supabase/supabase-js`.
    *   Imported `type { AuthUser }` instead and updated all relevant type annotations (`GraphQLContext`, `getUserFromAuthHeader`).
    *   This fixes module resolution and type errors, ensuring compatibility with Supabase JS v2+ and Node.js ESM.

*   **Milestone:** Migrated Backend from Deno to Node.js
    *   Created a new Node.js project in `backend-node/` directory.
    *   Initialized with latest stable Node.js and npm.
    *   Installed dependencies: `@supabase/supabase-js`, `graphql`, `graphql-yoga`.
    *   Copied over GraphQL schema, resolvers, Supabase client, and database files.
    *   Converted Deno-specific code to Node.js:
        *   Replaced `Deno.env.get` with `process.env`.
        *   Removed `Deno.serve` in favor of Node.js HTTP server.
        *   Used `graphql-yoga`'s built-in server with Node.js `http` module.
        *   Added environment variable loading via `dotenv`.
    *   Created `src/server.ts` as the new entry point.
    *   Added `tsconfig.json` for TypeScript configuration.
    *   Updated `package.json` with `start` script using `ts-node`.
    *   Copied `.env` and `.env.example` for environment configuration.
    *   The backend can now be run with `npm start` inside `backend-node/`.
    *   This migration enables running the backend with Node.js instead of Deno, improving compatibility with common Node.js tooling.

*   **Milestone:** Enabled CORS Middleware for Local Development Only.
    *   Modified `backend/dev.ts` to import and apply `@hono/middleware.ts` CORS middleware.
    *   Configured to allow cross-origin requests from `http://localhost:5173` with appropriate headers and methods.
    *   This setup enables smooth frontend-backend integration during local development.
    *   The production server (`backend/main.ts`) remains unchanged, maintaining stricter CORS policies.
    *   This separation ensures permissive CORS in dev without affecting production security.

*   **Fix:** Fixed invalid named import of `createResolvers` in `backend-node/index.ts`.
    *   The file `src/graphql/resolvers.ts` exports a default `resolvers` object, not a `createResolvers` function.
    *   Updated import to `import resolvers from './src/graphql/resolvers'`.
    *   Removed the call to `createResolvers()`.
    *   Updated GraphQL schema creation to use the imported `resolvers` object directly.
    *   Fixed TypeScript errors related to Hono context `.set()` and `.get()` by augmenting `ContextVariableMap` via `src/types/hono.d.ts`.
    *   Fixed GraphQL Yoga context passing by attaching the Hono context to the Fetch `Request` and accessing it in Yoga's `context` function.
    *   Implemented missing `listConnectionsByCanvas` function in `src/data/db.ts` to resolve import error in resolvers.
    *   Fixed all remaining TypeScript errors in `backend-node/index.ts`.
    *   The backend GraphQL server now builds cleanly with correct context typing and resolver imports.
