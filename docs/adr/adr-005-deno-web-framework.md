# ADR-005: Deno Web Framework Choice

**Date:** Current Date
**Status:** Accepted

## Context

Our Deno backend requires a web framework to handle incoming HTTP requests, manage routing (primarily to the GraphQL endpoint), and potentially handle middleware for concerns like logging, CORS, and authentication checks before requests reach the GraphQL layer. We have already selected `graphql-yoga` (ADR-003) as the GraphQL server library, which needs to be integrated with the chosen web framework.

## Decision Drivers

*   **Performance:** The framework should be efficient and add minimal overhead.
*   **Ease of Use:** Simple API and clear documentation for defining routes and middleware.
*   **Integration:** Must integrate cleanly with `graphql-yoga` and the Deno runtime.
*   **Middleware Support:** Should have a robust and flexible middleware pattern.
*   **Maintenance & Community:** Active development and community support.
*   **Lightweight:** Prefer a minimal framework core to keep the application lean.

## Considered Options

### Option 1: Hono

*   A modern, lightweight, high-performance web framework designed for multiple JavaScript runtimes, including Deno.
*   **Pros:**
    *   **Excellent Performance:** Often cited as one of the fastest JS web frameworks.
    *   **Lightweight:** Minimal core, keeping dependencies small.
    *   **Simple API:** Familiar routing API (similar to Express/Fastify).
    *   **Good Middleware Support:** Clear middleware pattern.
    *   **Actively Maintained:** Rapidly evolving with strong community backing.
    *   Excellent TypeScript support.
    *   Known to integrate well with `graphql-yoga`.
*   **Cons:**
    *   Newer than Oak, potentially a slightly smaller established Deno-specific user base (though growing fast).

### Option 2: Oak

*   A middleware framework for Deno's native HTTP server, inspired by Koa.js.
*   **Pros:**
    *   More established within the Deno ecosystem historically.
    *   Robust middleware architecture based on Koa.
    *   Good documentation and community examples for Deno.
    *   Good TypeScript support.
    *   Also integrates with `graphql-yoga`.
*   **Cons:**
    *   Generally benchmarks slower than Hono.
    *   Potentially slightly more boilerplate for simple cases compared to Hono.
    *   Focus is primarily Deno, unlike Hono's multi-runtime approach (which might indicate a more broadly tested core).

## Decision Outcome

**Chosen Option:** Hono.

**Rationale:**

Hono is selected due to its exceptional performance, lightweight nature, and simple, modern API, which aligns well with the goal of building an efficient Deno backend. Its excellent TypeScript support and proven integration with `graphql-yoga` make it a strong choice. While Oak is also a viable and more established option in the Deno ecosystem, Hono's focus on performance and minimalism provides a slight edge, particularly as performance is often a key consideration when choosing Deno. The active development and growing community support for Hono further solidify this decision.

## Consequences

*   **Positive:**
    *   Likely performance benefits due to the framework's efficiency.
    *   Minimal framework overhead and dependency size.
    *   Utilizes a modern framework with active development.
    *   Simple routing and middleware API enhances developer experience.
*   **Negative:**
    *   Relies on a framework that, while growing rapidly, has a shorter history within the Deno ecosystem compared to Oak.
    *   May encounter edge cases or require community support for less common scenarios due to its relative newness compared to Oak. 