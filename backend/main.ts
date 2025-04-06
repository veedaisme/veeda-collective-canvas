import { Hono } from "https://deno.land/x/hono@v4.4.13/mod.ts";
import type { Context } from "https://deno.land/x/hono@v4.4.13/mod.ts";
import { createYoga } from "https://esm.sh/graphql-yoga@5.3.1";
import { makeExecutableSchema } from "https://esm.sh/@graphql-tools/schema@10.0.4";
import { typeDefs } from "./src/graphql/schema.ts";
import { resolvers } from "./src/graphql/resolvers.ts";

// --- GraphQL Yoga Setup ---

// Create the executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema, // Pass the executable schema
  context: async (ctx: Context) => {
    // Placeholder for adding auth context later
    // Example: const user = await getUserFromAuthHeader(ctx.request.headers.get('Authorization'));
    // For now, just pass the raw request if needed by resolvers (though not currently used)
    return { request: ctx.req /*, user */ };
  },
  logging: true, // Enable logging for development
  graphiql: {
    title: "Veeda GraphQL API",
    // Optionally add default queries/mutations here for the GraphiQL interface
    // defaultQuery: "..."
  },
  maskedErrors: false, // Show full errors during development for easier debugging
});

// --- Hono Setup ---

const app = new Hono();

// TODO: Add CORS middleware if needed for frontend interaction
// Example using Hono's built-in CORS middleware:
// import { cors } from "@hono/cors.ts";
// app.use('/graphql', cors({ origin: 'http://localhost:5173' })); // Allow frontend origin

// Handle GraphQL requests using the Yoga handler - much simpler approach
// This will handle all HTTP methods (GET, POST) for the /graphql endpoint
app.all("/graphql", (c: Context) => yoga(c.req.raw, {}));

// Basic health check / root route
app.get("/", (c: Context) => c.text("Veeda Backend API Running"));

// --- Server Start ---

const port = parseInt(Deno.env.get("PORT") || "8000", 10);

console.log(`Backend server starting on http://localhost:${port}`);

Deno.serve({ port }, app.fetch); 