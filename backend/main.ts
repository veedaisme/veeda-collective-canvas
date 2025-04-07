import { Hono } from "@hono/mod.ts";
import type { Context as HonoContext, Next } from "@hono/mod.ts";
import { createYoga } from "graphql-yoga";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./src/graphql/schema.ts";
import { resolvers } from "./src/graphql/resolvers.ts";
import { supabase, supabaseAdmin } from './src/lib/supabaseClient.ts';
import type { User } from '@supabase/supabase-js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define the shape of our GraphQL context
interface GraphQLContext {
    request: Request;
    user: User | null;
    supabase: SupabaseClient;
    supabaseAdmin: SupabaseClient;
}

// --- Hono Auth Middleware --- 
const authMiddleware = async (c: HonoContext, next: Next) => {
    let user: User | null = null;
    let token: string | null = null;
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        try {
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
            if (error) {
                console.warn('[Auth Middleware] Token validation error:', error.message);
            } else {
                user = supabaseUser;
                console.log(`[Auth Middleware] User ${user?.id} authenticated via token.`);
            }
        } catch (err: any) {
            console.error('[Auth Middleware] Error during token validation:', err.message);
        }
    }

    c.set('user', user);
    c.set('token', token);
    await next();
};

// --- GraphQL Yoga Setup ---

// Create the executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Yoga setup adjusted for Hono context
const yoga = createYoga<
    HonoContext<{ Variables: { user: User | null, token: string | null } }>,
    GraphQLContext
>({ 
  schema,
  context: (honoContext: HonoContext<{ Variables: { user: User | null, token: string | null } }>): GraphQLContext => { 
      const user = honoContext.get('user') ?? null;
      const token = honoContext.get('token') ?? null;
      console.log(`[GraphQL Context] User from context: ${user?.id ?? 'None'}`);
      
      const requestSupabaseClient = createClient(
          Deno.env.get('SUPABASE_URL')!, 
          Deno.env.get('SUPABASE_ANON_KEY')!,
          {
              global: {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
              },
              auth: {
                  persistSession: false,
              }
          }
      );

      return {
          request: honoContext.req.raw,
          user: user,
          supabase: requestSupabaseClient,
          supabaseAdmin: supabaseAdmin
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

// Handle GraphQL requests - pass Hono context directly to Yoga context factory
app.all("/graphql", (c: HonoContext<{ Variables: { user: User | null, token: string | null } }>) => {
    // Pass Hono context 'c' directly as the second argument
    return yoga(c.req.raw, c); 
});

// Basic health check / root route
app.get("/", (c: HonoContext) => c.text("Veeda Backend API Running"));

// --- Server Start ---

const port = parseInt(Deno.env.get("PORT") || "8000", 10);

console.log(`Backend server starting on http://localhost:${port}`);

Deno.serve({ port }, app.fetch); 