# Project Progress

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
