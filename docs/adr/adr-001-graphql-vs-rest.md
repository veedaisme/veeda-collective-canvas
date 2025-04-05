# ADR-001: API Design Choice - GraphQL vs. REST

**Date:** Current Date
**Status:** Accepted

## Context

The Veeda application requires a backend API to serve data to the React frontend client. The core data model involves interconnected entities: users own canvases, canvases contain blocks, blocks can have notes, and blocks can be connected to other blocks within the same canvas. Key functional requirements include creating, reading, updating these entities, managing user authentication, and handling specific logic like the non-deletion of blocks (with a short undo window).

Future requirements include real-time collaboration features (multiple users interacting with the same canvas simultaneously) and potentially more complex querying or filtering capabilities as the application evolves.

We need to decide on the primary API paradigm for communication between the frontend and the custom Deno/TypeScript backend.

## Decision Drivers

*   **Efficient Data Fetching:** The frontend often needs nested or related data (e.g., a canvas with its blocks, or a block with its notes). The API should allow clients to request precisely the data needed in a single request to avoid under-fetching (requiring multiple round trips) or over-fetching (receiving unnecessary data).
*   **Strong Typing & Developer Experience:** The backend and frontend are both using TypeScript. The API design should leverage this for end-to-end type safety, improving developer experience and reducing runtime errors.
*   **API Evolution:** The API needs to evolve as new features are added. The chosen paradigm should facilitate adding new capabilities without breaking existing clients or requiring complex versioning schemes.
*   **Interconnected Data Model:** The relationships between canvases, blocks, notes, and connections are central to the application. The API should naturally represent and query these relationships.
*   **Future Real-time Needs:** The architecture should ideally accommodate future real-time features (like collaborative editing) with minimal friction.

## Considered Options

### Option 1: RESTful API

*   A traditional approach using standard HTTP verbs (GET, POST, PATCH, DELETE) and resource-based URLs (e.g., `/api/canvases`, `/api/canvases/:id/blocks`).
*   **Pros:**
    *   Mature, well-understood, and widely adopted.
    *   Simpler initial setup for basic CRUD operations.
    *   Leverages HTTP caching mechanisms effectively for GET requests.
    *   Large ecosystem of tools and libraries.
*   **Cons:**
    *   Can lead to over-fetching or under-fetching, requiring multiple client requests for complex data views.
    *   No built-in standard for strong typing between client and server (requires external tools like OpenAPI schemas + code generation).
    *   API evolution can be cumbersome (versioning in URLs/headers).
    *   Handling deeply nested relationships can require complex query parameters or multiple endpoints.
    *   Real-time features typically require separate WebSocket implementations alongside REST.

### Option 2: GraphQL API

*   A query language for APIs where clients request exactly the data structure they need.
*   **Pros:**
    *   **Efficient Data Fetching:** Clients specify required fields, eliminating over/under-fetching.
    *   **Strong Typing:** The schema provides a strongly typed contract between client and server, excellent for TypeScript integration.
    *   **API Evolution:** Easier to add new fields/types without breaking existing clients. Deprecation mechanism is built-in.
    *   **Developer Experience:** Introspective schema aids tooling and exploration.
    *   **Real-time:** GraphQL Subscriptions provide a standardized way to handle real-time data pushes over WebSockets.
*   **Cons:**
    *   Steeper initial learning curve compared to REST.
    *   More complex server-side implementation (schema definition, resolvers).
    *   HTTP caching is less straightforward than for simple REST GET requests.
    *   Potential performance pitfalls (e.g., N+1 problem) require careful resolver implementation and tooling (like DataLoader).
    *   Less mature ecosystem compared to REST, although rapidly growing.

## Decision Outcome

**Chosen Option:** GraphQL API.

**Rationale:**

While GraphQL introduces more initial complexity compared to a simple REST API for the MVP, its benefits align better with the long-term vision and specific needs of Veeda:

1.  **Data Fetching Efficiency:** Given the nested nature of canvases, blocks, and notes, GraphQL's ability to fetch precisely tailored data structures in a single request is a significant advantage, simplifying frontend logic and improving performance by reducing round trips.
2.  **Type Safety:** The inherent strong typing of the GraphQL schema integrates seamlessly with the TypeScript stack, providing end-to-end type safety and enhancing developer productivity.
3.  **API Evolution:** GraphQL's schema evolution capabilities are better suited for an application expected to grow in complexity, making it easier to add features without versioning headaches.
4.  **Future Real-time:** Adopting GraphQL now positions the application well for implementing real-time collaboration features later using GraphQL Subscriptions, integrating them into the same API paradigm.

The benefits of efficient data fetching, strong typing, and future-proofing for real-time features and API evolution outweigh the initial setup complexity for this specific application context.

## Consequences

*   **Positive:**
    *   Frontend development is simplified by tailored data fetching.
    *   Improved type safety across the stack.
    *   API is more flexible for future feature additions.
    *   Clear path for implementing real-time features via Subscriptions.
*   **Negative:**
    *   Increased initial development effort on the backend to set up the GraphQL server, schema, and resolvers.
    *   Requires learning/implementing strategies to mitigate potential GraphQL performance issues (e.g., DataLoader for N+1 problems).
    *   Frontend needs a GraphQL client library and integration.
    *   Server-side caching strategies might be more complex than simple HTTP caching for REST. 