import app from "./main.ts"; // Import the Hono app from main.ts

const port = parseInt(Deno.env.get("PORT") || "8000", 10);

console.log(`🚀 Starting local development server...`);
console.log(`👂 Listening on http://localhost:${port}`);
console.log(`🌴 GraphQL endpoint available at http://localhost:${port}/graphql`);

Deno.serve({
    port: port,
    // Use hostname if you need to access it from other devices on your network
    // hostname: "0.0.0.0", 
}, app.fetch); // Pass the app's fetch handler to Deno.serve
