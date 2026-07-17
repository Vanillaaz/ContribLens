import { serve } from "@hono/node-server";
import { createDependencies } from "./di-container.js";
import { createServer } from "./server.js";

const port = process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 3000;

console.log("Starting ContribLens API...");

// Initialize dependencies
const deps = createDependencies(process.env);

// Create app
const app = createServer(deps);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port.toString()}`);
});
