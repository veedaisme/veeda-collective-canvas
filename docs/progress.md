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

*   **Next Steps:**
    *   Implement Block content editing.
    *   Connect backend to PostgreSQL database.
    *   Implement User Authentication.
