# ADR-003: GraphQL Server Library Choice (Deno)

**Date:** Current Date
**Status:** Accepted

## Context

Having chosen GraphQL as the API paradigm (ADR-001) and Deno/TypeScript as the backend runtime, we need to select a specific library to implement the GraphQL server within the Deno environment. The library needs to handle incoming GraphQL requests (queries, mutations), parse them, execute resolver functions, and format the responses according to the GraphQL specification. It should integrate with a web framework like Oak or Hono to handle HTTP requests.

## Decision Drivers

*   **Deno Compatibility:** Must work reliably and ideally be optimized for the Deno runtime.
*   **Spec Compliance:** Must adhere to the official GraphQL specification.
*   **Ease of Use & Setup:** Should be relatively straightforward to configure for the MVP.
*   **Performance:** Should have reasonable performance for typical GraphQL operations.
*   **Features:** Needs to support core GraphQL features (queries, mutations). Support for Subscriptions (over WebSockets) is desirable for future real-time features.
*   **Maintenance & Community:** Preferably actively maintained with community support.
*   **Integration:** Should integrate well with common Deno web frameworks (e.g., Oak, Hono).

## Considered Options

### Option 1: `graphql-yoga`

*   A fully-featured, spec-compliant GraphQL server library maintained by The Guild.
*   **Pros:**
    *   Explicitly supports Deno and other non-Node.js environments.
    *   Lightweight and generally easier setup compared to Apollo Server.
    *   Actively maintained by a reputable group.
    *   Supports queries, mutations, and subscriptions.
    *   Framework-agnostic, integrates easily with Oak/Hono.
*   **Cons:**
    *   May lack some of the most advanced, enterprise-focused features of Apollo Server (e.g., deep Apollo Federation integration, Apollo Studio integration - not needed for MVP).

### Option 2: Apollo Server (adapted for Deno/Oak)

*   The most popular GraphQL server library, primarily focused on Node.js but can often be adapted.
*   **Pros:**
    *   Very feature-rich (caching directives, federation, metrics, Apollo Studio integration).
    *   Largest community and ecosystem.
    *   Excellent documentation.
*   **Cons:**
    *   Primarily designed for Node.js; integration with Deno/Oak requires adapters or specific configurations, which can be less straightforward or stable.
    *   Can be more heavyweight than `graphql-yoga`.
    *   Many advanced features are overkill for the MVP.

### Option 3: Other/Lower-level Libraries

*   Using lower-level libraries like `graphql-js` (the reference implementation) directly or smaller community projects.
*   **Pros:**
    *   Maximum control.
*   **Cons:**
    *   Requires implementing much of the server logic (HTTP handling, WebSocket handling for subscriptions) manually.
    *   Significantly increases development time and complexity.
    *   Smaller libraries might lack features or maintenance.

## Decision Outcome

**Chosen Option:** `graphql-yoga`.

**Rationale:**

`graphql-yoga` provides the best fit for implementing a GraphQL server in Deno for the Veeda MVP. Its explicit support for Deno, ease of setup, spec compliance, support for essential features (including subscriptions), and active maintenance make it a practical and robust choice. While Apollo Server is powerful, the added complexity of adapting it for Deno and its feature set (largely unnecessary for the MVP) make `graphql-yoga` a more pragmatic starting point. Building directly on lower-level libraries would add unnecessary development overhead.

## Consequences

*   **Positive:**
    *   Utilizes a library designed for and tested with Deno.
    *   Relatively straightforward setup and integration with Oak/Hono.
    *   Provides necessary core GraphQL features, including subscriptions for future use.
    *   Benefits from maintenance and support from The Guild.
*   **Negative:**
    *   If extremely advanced Apollo-specific features (like deep Federation v2) become necessary later, migration might be required (though unlikely given the project scope). 