# RAG Control Centre

A high-performance, locally-grounded Retrieval-Augmented Generation (RAG) system built with **Node.js (ES Modules)** and **TypeScript**. 

This system solves context fragmentation and high LLM costs by combining **Hierarchical Parent-Child Window Chunking** with an autonomous **Spatial Vector Semantic Cache Layer** and a resilient **Quota Fallback Layer**.

---

## 💡 System Concepts

Standard RAG pipelines often suffer from a core dilemma: large text chunks dilute semantic precision, while small chunks lose critical context. This project solves that problem by splitting structural context storage from vector search:

* **The Parents (Relational Layer):** Macro-level text blocks are stored in a fast local relational database (**LibSQL / Turso**). This preserves complete narrative structures and chronological document text.
* **The Children (Vector Layer):** Parent blocks are broken down into micro-sized sub-fragments ("children"). These are vectorized using a local **ONNX runtime engine** and indexed into **Qdrant**.

When you query the system, it targets the precise child fragment, maps its relational link, and extracts the full parent context block to feed into the LLM.

### Integrated Features
* **Autonomous Semantic Caching:** Previous queries are cached in Qdrant. If a new prompt matches a historical question with $\ge 0.92$ Cosine similarity, the saved answer is served instantly with $0\text{ ms}$ downstream LLM processing time.
* **Cognitive Quota Fallback:** If cloud provider limits or rate limits (`429 Too Many Requests`) are hit, the application automatically drops back to **Local Grounding Engine Mode**, displaying the raw matching context blocks safely without crashing.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (v18+) with strict TypeScript & Native ES Modules.
* **Vector DB:** Qdrant (Self-hosted via Docker).
* **Relational DB:** LibSQL (Modern, asynchronous SQLite engine).
* **Embeddings:** Local ONNX runtime inference (no external API needed for vectors).
* **Orchestration:** Express.js middleware pipeline.

---

## 🚀 Quick Setup & Installation

### 1. Clone and Install Dependencies
```bash
git clone [https://github.com/YOUR_USERNAME/enterprise-rag-prototype.git](https://github.com/YOUR_USERNAME/enterprise-rag-prototype.git)
cd enterprise-rag-prototype
npm install

```

*(Note: Ensure you commit your local `package-lock.json` file to keep dependencies locked and consistent across environments).*

### 2. Configure Environment

Create a `.env` file in the project root:

```env
PORT=3000
OPENAI_API_KEY=your_sk_openai_api_key_here

```

### 3. Spin Up Vector Infrastructure

Use the included `docker-compose.yml` to launch your persistent Qdrant instance:

```bash
docker-compose up -d

```

Once running, initialize your database collection namespaces using terminal commands:

```bash
# Initialize Knowledge Base Namespace
curl -X PUT "http://localhost:6333/collections/child_chunks" \
     -H "Content-Type: application/json" \
     -d '{"vectors": {"size": 384, "distance": "Cosine"}}'

# Initialize Semantic Cache Namespace
curl -X PUT "http://localhost:6333/collections/semantic_cache" \
     -H "Content-Type: application/json" \
     -d '{"vectors": {"size": 384, "distance": "Cosine"}}'

```

### 4. Start the Application Engine

```bash
npx tsx src/server.ts

```

Open your browser and navigate to `http://localhost:3000` to interact with the web control panel interface.

---

## 📡 REST API Specifications

* **`POST /api/ingest`** — Accepts a binary PDF file stream attachment (`multipart/form-data`, key: `file`), processes relational chunks, and updates database indices.
* **`POST /api/query`** — Processes semantic questions (`application/json`), evaluates real-time structural caching, maps parent records, and routes contextual responses.

---

## 🌲 Git Tracking Guidelines

* **Database Files:** The local database items (`local.db`, `local.db-shm`, `local.db-wal`) are git-ignored to keep large changing binaries out of repo histories.
* **Environment Configuration:** Sensitive credentials (`.env`) are excluded from staging.

---
## Author
* **Developer:** Bharath Raj
* **GitHub Profile:** github.com/bharathrajzero

---
## License
This project is licensed under the MIT License © 2026 Bharath Raj, AlphaGroup .

```

```
