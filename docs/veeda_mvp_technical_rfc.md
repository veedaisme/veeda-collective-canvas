# Technical RFC: Veeda MVP Implementation

**Date:** Current Date
**Author(s):** AI Assistant
**Status:** Draft
**Related Documents:** [Veeda MVP PRD](veeda_mvp_prd.md)

## 1. Abstract

This RFC outlines the proposed technical architecture and key implementation details for the Minimum Viable Product (MVP) of the Veeda application. It specifies the chosen technology stack, data models, API design, and core component structure necessary to deliver the functionalities defined in the Veeda MVP PRD. The proposed stack includes React with the TanStack ecosystem for the frontend and **a custom Deno/TypeScript backend utilizing GraphQL and PostgreSQL.**

## 2. Motivation

The primary motivation is to translate the functional requirements from the [Veeda MVP PRD](veeda_mvp_prd.md) into a concrete technical plan. This ensures alignment within the development team on the implementation approach before coding begins. The chosen technologies aim for a modern, efficient, and maintainable codebase:

*   **Frontend:** React provides a robust component model. The TanStack ecosystem ([Router](https://tanstack.com/router/latest), [Query](https://tanstack.com/query/latest), [Form](https://tanstack.com/form/latest)) offers type-safe, performant solutions for routing, server state management, and form handling. **The frontend interacts solely with the backend GraphQL API for all data needs.**
*   **Backend:** A custom backend built with Deno and TypeScript provides maximum flexibility and control. Utilizing GraphQL offers efficient data fetching, strong typing aligned with TypeScript, and better long-term API evolution compared to REST, especially given the interconnected data model and potential future features like real-time collaboration. **The backend handles all database interactions using the Supabase client.**
*   **Database:** Supabase (managed PostgreSQL) offers reliability, strong data integrity features, excellent JSONB support, and built-in authentication and RLS capabilities.

## 3. Proposed Solution / Detailed Design

### 3.1. Overall Architecture

A standard client-server architecture will be employed:

*   **Client:** A Single Page Application (SPA) built with React and TanStack. This client **communicates exclusively** with the backend GraphQL API.
*   **Server:** A GraphQL API server built with Deno/TypeScript. This server **is the sole interface** to the database (Supabase/PostgreSQL) and encapsulates all business logic and data access.
*   **Database:** Supabase (managed PostgreSQL) instance storing all application data.

```mermaid
graph LR
    A[Client (React + TanStack)] <-- GraphQL (HTTP) --> B(Backend GraphQL API Server Deno + TS);
    B <-- SQL/Supabase Client --> C(Database Supabase PostgreSQL);
```

### 3.2. Frontend (React + TanStack)

*   **Framework:** React (v18+)
*   **Language:** TypeScript
*   **Core Libraries:**
    *   **Routing:** `@tanstack/react-router` - For defining and managing application routes.
    *   **Server State:** `@tanstack/react-query` - For fetching, caching, and updating server state. Will interact with the GraphQL API using a GraphQL client library (e.g., `graphql-request`, Apollo Client).
    *   **Forms:** `@tanstack/react-form` - For managing form state and validation.
    *   **Canvas Rendering:** `react-flow` (or similar) - For the visual canvas interface.
    *   **UI State Management:** React Context API or Zustand - For local UI state.
    *   **GraphQL Client:** `graphql-request`, `urql`, or Apollo Client - For interacting with the GraphQL API.
*   **Key Components (Conceptual):**
    *   `App.tsx`: Main application entry point, sets up router.
    *   `AuthLayout.tsx`: Layout for login/signup pages.
    *   `DashboardLayout.tsx`: Layout for authenticated views (sidebar, header).
    *   `CanvasListPage.tsx`: Displays list of user's canvases.
    *   `CanvasViewPage.tsx`: Main canvas interaction area.
        *   `CanvasRenderer.tsx`: Uses `react-flow` to render the canvas, blocks, and connections.
        *   `BlockComponent.tsx`: Renders individual blocks (text, image, link).
        *   `NoteEditor.tsx`: Component for adding/editing notes.
        *   `ConnectionLayer.tsx`: Handles rendering and interaction for drawing connections.
        *   `Toolbar.tsx`: Contains tools for adding blocks, etc.
*   **Styling:** CSS Modules or Tailwind CSS for component styling.

### 3.3. Backend (Custom Deno/TypeScript + GraphQL)

*   **Runtime:** Deno (preferred).
*   **Language:** TypeScript
*   **Framework/Libraries:**
    *   **GraphQL Server:** `graphql-yoga` or Apollo Server adapted for Deno/Oak.
    *   **Web Framework (for GraphQL endpoint):** Hono (ADR-005).
    *   **GraphQL Schema Definition:** SDL (Schema Definition Language) or code-first approach (e.g., using `TypeGraphQL` if adapted).
*   **Database:** Supabase (managed PostgreSQL) (v14+ - could be self-hosted or managed).
*   **Database Client:** `@supabase/supabase-js` (for Deno backend).
*   **Authentication:** Primarily handled by Supabase Auth on the backend, with JWTs potentially passed from frontend to backend GraphQL requests for authorization checks within resolvers against Supabase RLS or custom logic.
*   **API Specification:** GraphQL API.
    *   **Core Types (Conceptual):** `User`, `Canvas`, `Block`, `Note`, `Connection`. **These types map closely to the Supabase database schema.**
    *   **Queries:** `myCanvases`, `canvas(id: ID!)`, `publicCanvas(shareId: String!)`, etc.
    *   **Mutations:** `signup`, `login`, `createCanvas`, `updateCanvasTitle`, `createBlock`, `updateBlockContent`, `updateBlockPosition`, `createNote`, `updateNote`, `createConnection`, `deleteConnection`, `updateCanvasSharing`, `undoBlockCreation(blockId: ID!)` (implements 5-min rule).
    *   **Subscriptions (Optional for MVP, Essential for Real-time):** `canvasUpdates(id: ID!)` - For future real-time collaboration.
*   **Block Immutability Logic:**
    *   No `deleteBlock` mutation will be exposed.
    *   The `undoBlockCreation` mutation will contain logic to check the `created_at` timestamp and only allow deletion within the grace period.
*   **Canvas Rendering Library:** Initial choice is `react-flow` (ADR-002). Need to validate performance with expected MVP block counts during development. Alternatives (`react-konva`, etc.) will be considered only if significant issues arise.
*   **GraphQL Server Library (Deno):** Initial choice is `graphql-yoga` (ADR-003). Evaluate if any specific limitations arise during development compared to alternatives like Apollo Server (adapted).
*   **GraphQL Client Library (React):** Initial approach is `graphql-request` integrated with `@tanstack/react-query` (ADR-004). Evaluate if limitations necessitate a more feature-rich client like `urql` or `Apollo Client` later.
*   **GraphQL Implementation Details:** Detailed GraphQL schema design and efficient resolver implementation strategy (including addressing potential N+1 issues, perhaps with DataLoader).
*   **Undo Grace Period Logic:** Finalize server-side implementation details for the 30-second `undoBlockCreation` mutation.
*   **Image Upload Strategy:** Strategy for handling large image uploads/storage (direct to server vs. dedicated object storage like S3, potentially presigned URLs initiated via GraphQL mutation).
*   **Query Complexity/Depth Limiting:** Implement strategies to prevent excessively complex or deep GraphQL queries from overwhelming the server.

### 3.4. Database Schema (High-Level)

*(The specific SQL schema is now managed and reflected within the Supabase project dashboard and potentially via Supabase migrations. The TypeScript types generated by Supabase serve as the primary reference within the backend code.)*
*(Schema definition removed as it's now managed by Supabase)*

## 4. Alternatives Considered

*   **Backend API:**
    *   RESTful API: Simpler setup for MVP but less efficient data fetching and potentially harder API evolution compared to GraphQL.
    *   gRPC: More performant but less web-native than GraphQL/REST, adds complexity.
*   **Backend Runtime:**
    *   Node.js/TypeScript: Mature alternative to Deno, wider library support but lacks Deno's built-in tooling and security model.
*   **Frontend:**
    *   Vue, Svelte, Angular: React has a large ecosystem and aligns with TanStack preference.
    *   Other state managers (Redux): TanStack Query handles server state well; simpler local state management is preferred.
*   **Database:**
    *   MongoDB: Less structured, but PostgreSQL's JSONB offers similar flexibility with added relational benefits.
*   **Database Client:** Deno `postgres` library (Supabase client provides higher-level abstractions and integration).

## 5. Open Questions

*   Specific choice of canvas rendering library (`react-flow` vs. alternatives).
*   Choice of GraphQL server library for Deno (`graphql-yoga` vs. others).
*   Choice of GraphQL client library for React (`graphql-request`, `urql`, Apollo Client).
*   Detailed GraphQL schema design and resolver implementation strategy.
*   Exact implementation details of the 5-minute undo grace period (`undoBlockCreation` mutation logic).
*   Strategy for handling large image uploads/storage (direct to server vs. dedicated object storage like S3, potentially presigned URLs initiated via GraphQL mutation).
*   Handling potential GraphQL performance issues (N+1 problem, query complexity limiting).

## 6. Future Considerations

*   **Real-time Collaboration:** GraphQL Subscriptions provide a standard mechanism for pushing updates to clients.
*   **API Evolution:** GraphQL's schema evolution is generally considered easier to manage than REST versioning.
*   **Scalability:** Database indexing, connection pooling, GraphQL query optimization, potential deployment to serverless/containerized environments.
*   **Mobile Apps:** React Native can utilize the same GraphQL endpoint and potentially share some type definitions.
*   **Advanced Features:** Versioning, archiving, tagging can be added as new types/fields/mutations/queries to the GraphQL schema. 