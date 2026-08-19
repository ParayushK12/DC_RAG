# BlockDiagram

> **Intelligent Architecture & Workflow Diagram Generator** powered by **LangChain** and **Mistral Large (`mistral-large-latest`)**.

Transform technical documents, system specifications, user stories, and architecture notes into clear, interactive **Mermaid diagrams** in seconds.

---

## 🌟 Key Features

- **True LangChain RAG Architecture**:
  - `PyPDFLoader` & `pdfplumber` for robust PDF text extraction.
  - `RecursiveCharacterTextSplitter` for document chunking.
  - In-memory `FAISS` vector store indexed with `MistralAIEmbeddings(model="mistral-embed")`.
  - Contextual retrieval and structured diagram synthesis powered by `ChatMistralAI(model="mistral-large-latest")`.
- **Multiple Diagram Types**:
  - Flowcharts (`flowchart TD` / `flowchart LR`), Sequence Diagrams (`sequenceDiagram`), State Machines (`stateDiagram-v2`), and Class Diagrams (`classDiagram`).
- **Targeted Query & Focus Mode**:
  - Auto-generate complete end-to-end system flows or specify targeted focus prompts (e.g., *"Focus on authentication flow and Redis session cache"*).
- **Concise Natural Language Summaries**:
  - Direct, clear 2–4 sentence plain-English architectural overview without markdown clutter.
- **Interactive Canvas & Export**:
  - Interactive diagram canvas with **Pan & Drag, Zoom In/Out, Reset (100%), and Fullscreen view**.
  - **Live Mermaid Code Editor** with instant preview re-rendering.
  - **One-Click Export**: Download high-resolution **PNG**, vector **SVG**, or copy raw Mermaid syntax.
- **Unified Single-Service Deployment**:
  - Flask backend automatically serves the compiled Vite React frontend in production for zero-CORS deployment on **Render**.

---

## 🏗️ Architecture Flow

```
[ PDF Upload / Raw Text Input ]
              │
              ▼
    [ Document Chunking ]
(RecursiveCharacterTextSplitter)
              │
              ▼
 [ Vector Embedding & Indexing ]
    (MistralAIEmbeddings + FAISS)
              │
              ▼
[ Semantic Similarity Retrieval ]
      (Top-k Relevant Chunks)
              │
              ▼
  [ Mistral Large LLM Engine ]
  (Diagram Syntax + Clean Summary)
              │
              ▼
 [ Mermaid Code Auto-Sanitizer ]
(Label quoting & Syntax validation)
              │
              ▼
   [ Interactive React Canvas ]
 (Pan/Zoom SVG, PNG/SVG Download)
```

---

## 📁 Project Structure

```
BlockDiagram/
├── backend/
│   ├── app.py                 # Flask server (API + static React UI serving)
│   ├── rag_engine.py          # LangChain + FAISS + Mistral Large RAG engine
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # React UI & interactive canvas
│   │   ├── App.css            # Modern dark styling
│   │   ├── Logo.jsx           # SVG brand logo
│   │   └── main.jsx           # React mount point
│   ├── index.html             # HTML entry & typography
│   ├── package.json           # Frontend build scripts
│   └── vite.config.js         # Vite proxy configuration
├── DEPLOYMENT.md              # Render deployment guide
├── package.json               # Root scripts (npm run dev, build, start)
├── README.md                  # Project documentation
└── render.yaml                # One-click Render Blueprint
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+ (or [uv](https://github.com/astral-sh/uv))
- Node.js 18+ and npm

### 2. Configure Environment Variables
Create a `.env` file in the root directory and in `backend/`:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
PORT=5001
```

### 3. Install Dependencies

**Backend (using UV or pip):**
```bash
# Using uv (recommended)
uv venv
uv pip install -r backend/requirements.txt

# Or using standard pip
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 4. Run the Application

**Option A: Run Both Together (from root)**
```bash
npm run dev
```

**Option B: Run Separately**
```bash
# Terminal 1: Backend
python backend/app.py

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## ☁️ Deploying to Render

This repository is pre-configured with a [`render.yaml`](./render.yaml) blueprint for single-service Web Service deployment.

### Steps:
1. Push your repository to GitHub.
2. Go to the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Web Service** → Connect your repository `ParayushK12/DC_RAG`.
4. Configure build settings:
   - **Environment**: `Python`
   - **Build Command**:
     ```bash
     pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     python backend/app.py
     ```
5. In **Environment Variables**, add:
   - `MISTRAL_API_KEY`: *Your Mistral API Key*
   - `PYTHON_VERSION`: `3.12.0`
6. Click **Deploy Web Service**.

---

## 📄 License & Author

- **Author**: [ParayushK12](https://github.com/ParayushK12)
- **License**: MIT
