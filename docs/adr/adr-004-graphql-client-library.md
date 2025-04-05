# ADR-004: GraphQL Client Library Choice (React)

**Date:** Current Date
**Status:** Accepted

## Context

The React frontend needs a way to communicate with the backend GraphQL API. This involves sending GraphQL queries and mutations, handling responses, and potentially managing client-side cache or state related to the server data. We are already committed to using `@tanstack/react-query` for managing server state (fetching, caching, background updates, optimistic updates, etc.). The GraphQL client library choice should complement this existing decision.

## Decision Drivers

*   **Integration with `@tanstack/react-query`:** The primary driver is seamless integration. The chosen solution should work effectively within the `queryFn` and `mutationFn` of `react-query` hooks.
*   **Simplicity:** Avoid unnecessary complexity or redundant features (like overlapping caching mechanisms) if possible for the MVP.
*   **Type Safety:** Should support TypeScript for typed GraphQL operations.
*   **Bundle Size:** Prefer a lightweight solution if it meets the core requirements.
*   **Core Functionality:** Must be able to send queries and mutations effectively.

## Considered Options

### Option 1: Lightweight Fetcher (`graphql-request`) + `@tanstack/react-query`

*   Use `graphql-request` (or even the native `fetch` API with appropriate headers/body) solely for executing the GraphQL requests within `react-query`'s functions.
*   **Pros:**
    *   **Excellent `react-query` Integration:** Leverages `react-query` for all state management aspects (caching, loading/error states, refetching, etc.).
    *   **Simplicity:** `graphql-request` is minimal and focuses only on sending the request.
    *   **No Cache Overlap:** Avoids conflicts or redundancy with `react-query`'s cache.
    *   **Small Bundle Size:** `graphql-request` is very lightweight.
    *   Supports TypeScript.
*   **Cons:**
    *   Doesn't provide its own normalized caching (but this is handled by `react-query`).
    *   Requires explicit integration within `react-query` hooks (which is the intended pattern here).

### Option 2: Feature-Rich Client (`urql`) + `@tanstack/react-query` Integration

*   `urql` is a popular, extensible GraphQL client with its own caching mechanisms.
*   **Pros:**
    *   Provides powerful features like normalized caching and extensibility ('exchanges').
    *   Good TypeScript support.
*   **Cons:**
    *   **Cache Overlap:** Using `urql`'s cache alongside `react-query`'s cache adds complexity and potential redundancy. Requires careful configuration to potentially disable `urql`'s cache or ensure they work together without conflict.
    *   **Increased Bundle Size:** Adds more code compared to `graphql-request`.
    *   Less direct integration pattern with `react-query` compared to using a simple fetcher.

### Option 3: Feature-Rich Client (Apollo Client) + `@tanstack/react-query` Integration

*   Apollo Client is the most feature-rich GraphQL client, with sophisticated normalized caching, state management features, and integration with the Apollo ecosystem.
*   **Pros:**
    *   Most powerful caching and state management capabilities specific to GraphQL.
    *   Large community and ecosystem.
    *   Excellent TypeScript support.
*   **Cons:**
    *   **Significant Cache Overlap/Complexity:** Integrating Apollo Client's cache with `react-query` is generally complex and often redundant. It's usually recommended to choose one or the other for primary server state management.
    *   **Largest Bundle Size:** Significantly larger than `graphql-request` or `urql`.
    *   Often considered overkill if not using its advanced features or the broader Apollo platform.

## Decision Outcome

**Chosen Option:** Lightweight Fetcher (`graphql-request`) integrated with `@tanstack/react-query`.

**Rationale:**

Given the prior commitment to using `@tanstack/react-query` as the primary server state management library, the most logical and efficient approach is to use a minimal library like `graphql-request` purely for the network request aspect. `react-query` will handle all the complexities of caching, background updates, loading/error states, optimistic updates, etc. Introducing another layer of caching and state management via `urql` or Apollo Client would add unnecessary complexity, increase bundle size, and potentially lead to conflicts or redundant work. The combination of `graphql-request` and `react-query` provides a clean separation of concerns (network execution vs. state management) and leverages the strengths of both libraries effectively for the MVP.

## Consequences

*   **Positive:**
    *   Simplifies the frontend state management architecture by relying solely on `react-query`.
    *   Minimizes frontend bundle size.
    *   Avoids cache synchronization issues between different libraries.
    *   Clear separation of concerns: `graphql-request` sends requests, `react-query` manages state.
*   **Negative:**
    *   Doesn't provide standalone GraphQL client features like normalized caching (but this is intentionally delegated to `react-query`).
    *   Relies on `react-query` being sufficient for all server state needs (which is expected). 