import { Hono } from "@hono/mod.ts";
import type { Context as HonoContext, Next } from "@hono/mod.ts";
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./src/graphql/schema.ts";
import { resolvers } from "./src/graphql/resolvers.ts";
import { supabase } from './src/lib/supabaseClient.ts';
import type { User } from '@supabase/supabase-js';

// Define the shape of our GraphQL context
interface GraphQLContext {
    request: Request;
    user: User | null;
}

// --- Hono Auth Middleware --- 
const authMiddleware = async (c: HonoContext, next: Next) => {
    let user: User | null = null;
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer '
        try {
            // Verify token with Supabase
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
            if (error) {
                console.warn('[Auth Middleware] Token validation error:', error.message);
            } else {
                user = supabaseUser; // Attach validated user
                console.log(`[Auth Middleware] User ${user?.id} authenticated via token.`);
            }
        } catch (err: any) {
            console.error('[Auth Middleware] Error during token validation:', err.message);
        }
    }

    // Set user in context state for access in GraphQL context factory
    c.set('user', user);
    await next();
};

// --- GraphQL Yoga Setup ---

// Create the executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Yoga setup adjusted for Hono context
const yoga = createYoga<{
    honoContext: HonoContext<{ Variables: { user: User | null } }> 
}, GraphQLContext>({ 
  schema,
  // The context factory receives the context object passed in the second arg of yoga()
  context: ({ request, context }): GraphQLContext => { 
      // Directly access the passed honoContext from the 'context' property
      const honoContext = context?.honoContext;
      const user = honoContext?.get('user') ?? null;
      console.log(`[GraphQL Context] User from context: ${user?.id ?? 'None'}`);
      return {
          request: request,
          user: user
      };
  },
  logging: true,
  graphiql: {
    title: "Veeda GraphQL API",
  },
  maskedErrors: false,
});

// --- Hono Setup ---

const app = new Hono();

// Apply Auth Middleware *only* to the /graphql route
app.use('/graphql', authMiddleware);

// Handle GraphQL requests - pass Hono context to Yoga context factory
app.all("/graphql", (c: HonoContext<{ Variables: { user: User | null } }>) => {
    // Pass the context object shape expected by the factory
    return yoga(c.req.raw, { 
        honoContext: c
    }); 
});

// Basic health check / root route
app.get("/", (c: HonoContext) => c.text("Veeda Backend API Running"));

// --- Server Start ---

const port = parseInt(Deno.env.get("PORT") || "8000", 10);

console.log(`Backend server starting on http://localhost:${port}`);

Deno.serve({ port }, app.fetch); 