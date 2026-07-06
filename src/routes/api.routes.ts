import { Router } from "express";
import { ingestDocument } from "../controllers/ingest.controller.js";
// Alias queryController to queryRAG here to match your route setup perfectly
import { queryController as queryRAG } from "../controllers/query.controller.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Ingestion Pipeline Endpoint
router.post("/ingest", upload.single("file"), ingestDocument);

// Contextual Query Engine Endpoint 
router.post("/query", queryRAG);

export default router;