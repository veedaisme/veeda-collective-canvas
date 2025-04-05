import { Hono } from "@hono/hono.ts";
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./schema.ts";
import { resolvers } from "./resolvers.ts";

// --- GraphQL Yoga Setup ---

// Create the executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema, // Pass the executable schema
  context: async (ctx) => {
    // Placeholder for adding auth context later
    // Example: const user = await getUserFromAuthHeader(ctx.request.headers.get('Authorization'));
    // For now, just pass the raw request if needed by resolvers (though not currently used)
    return { request: ctx.request /*, user */ };
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
app.all("/graphql", (c) => yoga(c.req.raw, {}));

// Basic health check / root route
app.get("/", (c) => c.text("Veeda Backend API Running"));

// --- Server Start ---

const port = parseInt(Deno.env.get("PORT") || "8000", 10);

console.log(`Backend server starting on http://localhost:${port}`);

Deno.serve({ port }, app.fetch); 