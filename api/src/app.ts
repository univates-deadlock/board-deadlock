import express, { json } from "express";
import "dotenv/config";

// Utils
import helmet from "helmet";
import cors from "./utils/cors.js";
import rateLimit from "./utils/rateLimit.js";

// Routes Import
import healthRoute from "./routes/health.route.js";

// Creates App
const app = express();

// Utils
app.use(cors);
app.use(json());
app.use(helmet());
app.use(rateLimit);

// Routes Use
app.use('/api/health', healthRoute);

// Constants
const PORT = process.env.PORT || 3000;

// Initializing server
app.listen('/', () => {
  console.info(`API listening on port ${PORT}`);
})
