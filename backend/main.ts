// backend/main.ts
import { Hono } from "https://deno.land/x/hono@v4.2.9/mod.ts";
import { cors } from "https://deno.land/x/hono@v4.2.9/middleware.ts";
import type { Context as HonoContext, Next } from "https://deno.land/x/hono@v4.2.9/mod.ts";
import { createYoga } from "https://esm.sh/graphql-yoga@5";
import { makeExecutableSchema } from "https://esm.sh/@graphql-tools/schema@10";
import { typeDefs } from "./src/graphql/schema.ts";
import { resolvers } from "./src/graphql/resolvers.ts";
// Import supabaseAdmin but maybe not the default supabase if creating client per-request
import { supabaseAdmin } from './src/lib/supabaseClient.ts'; 
import type { User } from "https://esm.sh/@supabase/supabase-js@2";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define the shape of our GraphQL context
interface GraphQLContext {
    request: Request;
    user: User | null;
    supabase: SupabaseClient; // Request-specific client
    supabaseAdmin: SupabaseClient; // Global admin client
}

// --- Hono Auth Middleware --- 
const authMiddleware = async (c: HonoContext, next: Next) => {
    let user: User | null = null;
    let token: string | null = null;
    const authHeader = c.req.header('Authorization');

    // Get Supabase details from environment *inside* the middleware or context
    // Ensure these are available in the Cloudflare environment as secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[Auth Middleware] Missing Supabase URL or Anon Key in environment!");
        // Return an error response or handle appropriately
        return c.json({ error: "Configuration error" }, 500);
    }
    
    // Create a temporary Supabase client instance for user validation
    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
    });

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        try {
            // Use the temporary client to validate the token
            const { data: { user: supabaseUser }, error } = await tempSupabase.auth.getUser(token);
            if (error) {
                console.warn('[Auth Middleware] Token validation error:', error.message);
                // Optionally clear token if invalid
                token = null; 
            } else {
                user = supabaseUser;
                console.log(`[Auth Middleware] User ${user?.id} authenticated via token.`);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('[Auth Middleware] Error during token validation:', err.message);
            } else {
                console.error('[Auth Middleware] Unknown error during token validation:', err);
            }
            token = null; // Clear token on error
        }
    } else {
         console.log('[Auth Middleware] No valid Authorization header found.');
    }

    c.set('user', user);
    c.set('token', token); // Store the validated (or null) token
    await next();
};

// --- GraphQL Yoga Setup ---
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga<
    // Define Hono context variables more explicitly if needed
    HonoContext<{ Variables: { user: User | null, token: string | null } }>, 
    GraphQLContext // Define your GraphQL context shape
>({ 
  schema,
  context: (honoContext): GraphQLContext => { // Hono context is passed implicitly now
      const user = honoContext.get('user') ?? null;
      const token = honoContext.get('token') ?? null; // Get token set by middleware
      console.log(`[GraphQL Context] User from context: ${user?.id ?? 'None'}`);

      // Get Supabase details from environment
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      if (!supabaseUrl || !supabaseAnonKey) {
          console.error("[GraphQL Context] Missing Supabase URL or Anon Key!");
          // Handle error appropriately, maybe throw or return context with error state
          throw new Error("Server configuration error: Missing Supabase credentials.");
      }

      // Create a request-specific Supabase client with the user's token (if available)
      const requestSupabaseClient = createClient(
          supabaseUrl, 
          supabaseAnonKey,
          {
              global: {
                  // Pass the validated token from middleware
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
              },
              auth: {
                  persistSession: false, // Important for serverless environments
              }
          }
      );

      return {
          request: honoContext.req.raw, // Pass the raw Request object
          user: user,
          supabase: requestSupabaseClient, // Provide the request-scoped client
          supabaseAdmin: supabaseAdmin // Provide the shared admin client
      };
  },
  logging: true,
  graphiql: {
    title: "Veeda GraphQL API",
  },
  // Consider enabling maskedErrors in production
  maskedErrors: Deno.env.get("ENVIRONMENT") !== "development", 
});

// --- Hono App Setup ---
const app = new Hono();

// --- Configuration ---
// Define allowed origins (include your production frontend and local dev frontend)
const ALLOWED_ORIGINS = [
    'https://app.veeda.space',     // Your production frontend
    'http://localhost:5173',   // Your local dev frontend (adjust port if needed)
    // Add any other trusted origins like preview deployment URLs if necessary
  ];

// *** ADD CORS MIDDLEWARE HERE ***
// Apply CORS middleware to allow requests from your frontend's origin
// This should generally come BEFORE your routes that need CORS handling.
app.use('*', cors({
    origin: (origin) => { // Dynamically check against allowed list
        if (ALLOWED_ORIGINS.includes(origin)) {
          return origin;
        }
        // You might return a default origin or null if none match,
        // depending on how strict you want CORS itself to be.
        // For origin *restriction*, the next middleware handles blocking.
        return ALLOWED_ORIGINS[0]; // Or simply return the first allowed origin
      }, // Allow production and local dev frontends
    allowHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
    allowMethods: ['POST', 'GET', 'OPTIONS'], // Allow necessary methods (POST for GraphQL, OPTIONS for preflight)
    // Optional: allowCredentials: true, // If you need to send cookies/auth headers with credentials
  }));


// Origin Check Middleware (Block requests from non-allowed origins)
app.use('*', async (c: HonoContext, next: Next) => {
    const origin = c.req.header('Origin');
  
    // Allow requests with no Origin header? (e.g., server-to-server, curl?) 
    // Set allowNoOrigin = true/false based on your security needs.
    // For strict browser-only access, set to false.
    const allowNoOrigin = false; 
  
    if (!origin && allowNoOrigin) {
        console.log('[Origin Check] Allowed: No Origin header present.');
        await next();
        return;
    }
  
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      // Origin is present and in the allowed list
      console.log(`[Origin Check] Allowed: Origin: ${origin}`);
      await next();
    } else {
      // Origin is missing (and allowNoOrigin is false) OR not in the allowed list
      console.warn(`[Origin Check] Forbidden: Origin: ${origin ?? 'Not Present'}`);
      // Return a 403 Forbidden response
      return c.text('Forbidden', 403); 
    }
  });

// Add Request Logging Middleware (Example)
app.use('*', async (c, next) => {
    console.log(`[Request] ${c.req.method} ${c.req.url}`);
    await next();
    console.log(`[Response] ${c.req.method} ${c.req.url} -> ${c.res.status}`);
});


// Apply Auth Middleware globally or specifically
// Applying globally ensures context variables (user, token) are always potentially set
app.use('*', authMiddleware); 

app.all("/graphql", (c: HonoContext<{ Variables: { user: User | null, token: string | null } }>) => {
    // Pass Hono context 'c' directly as the second argument
    return yoga(c.req.raw, c); 
});

// Basic health check / root route
app.get("/", (c: HonoContext) => c.text("Veeda Backend API Running (Cloudflare Worker)"));

// --- IMPORTANT: Export the Hono app for Cloudflare Workers ---
// The Worker runtime expects a default export with a 'fetch' method.
// Hono's app object provides this directly.
export default app;

// --- REMOVE or Comment Out the Deno.serve block ---
/*
const port = parseInt(Deno.env.get("PORT") || "8000", 10);
console.log(`Backend server starting on http://localhost:${port}`);
Deno.serve({ port }, app.fetch); 
*/
