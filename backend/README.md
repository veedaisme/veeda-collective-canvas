# Veeda Backend

## Environment Setup

To run the backend, you need to set up the following environment variables in your `.env` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### How to Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard at https://app.supabase.io
2. Click on the "Settings" icon in the left sidebar
3. Go to "API" in the settings menu
4. Under "Project API keys", copy the "service_role key" (Note: Keep this key secure as it bypasses RLS)
5. Add this key to your `.env` file as `SUPABASE_SERVICE_ROLE_KEY`

## Running the Backend

```
deno run --allow-net --allow-env --allow-read --env-file=.env main.ts
```

## Important Security Notes

- The service role key bypasses Row Level Security (RLS) and should be kept strictly on the server side.
- Never expose the service role key to the frontend or include it in client-side code.
- The backend uses the service role key only for specific operations that require bypassing RLS, like creating resources on behalf of users. 