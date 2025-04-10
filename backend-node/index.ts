// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './graphql/schema';
import { createResolvers } from './graphql/resolvers';
import { createSupabaseClient } from './lib/supabaseClient';

// Create Hono app
const app = new Hono();

// Setup CORS
app.use('*', cors());

// Setup context for each request
app.use(async (c, next) => {
  try {
    // Initialize Supabase client
    const supabase = createSupabaseClient();
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    
    // Add context to the request
    c.set('supabase', supabase);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('Auth error:', error);
      } else if (data.user) {
        c.set('user', data.user);
      }
    }
    
    await next();
  } catch (error) {
    console.error('Middleware error:', error);
    await next();
  }
});

// Create GraphQL schema with resolvers
const resolvers = createResolvers();
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create GraphQL yoga instance
const yoga = createYoga({
  schema,
  context: ({ request }) => {
    const c = request.hono;
    // Pass Hono context to GraphQL resolvers
    return {
      supabase: c?.get('supabase'),
      user: c?.get('user'),
    };
  },
});

// Handle GraphQL requests
app.use('/graphql', async (c) => {
  // Add the Hono context to the request so it can be accessed in the GraphQL context
  c.req.raw.hono = c;
  
  const response = await yoga.handle(c.req.raw, {
    request: { headers: c.req.raw.headers }
  });
  
  // Convert the Response to Hono's Response
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

// Health check route
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Export the Hono app
export default app;
