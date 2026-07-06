import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './routes/api.routes.js';

// Load environmental variables securely from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname equivalence for Node.js ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware Stack ---
app.use(cors()); // Enables cross-origin requests from frontends
app.use(express.json()); // Parses incoming standard application/json requests
app.use(express.urlencoded({ extended: true }));

// --- Serve Static Assets (Frontend Control Panel) ---
// This mounts the root directory so you can place 'index.html' inside a 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// --- REST API Binding ---
// Maps all your modular controller pipelines with the /api prefix
app.use('/api', apiRouter);

// --- Fallback Catch-All Route ---
// Prevents default unhandled crashes and gracefully directs to a 404 message
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// --- Boot Routine ---
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Enterprise RAG Core Engine Operational`);
  console.log(`🌐 Local Control Center Available: http://localhost:${PORT}`);
  console.log(`📡 Ingestion Endpoint:            http://localhost:${PORT}/api/ingest`);
  console.log(`🧠 Retrieval Endpoint:            http://localhost:${PORT}/api/query`);
  console.log(`===================================================`);
});