# Deploying DC_RAG to Render

This repository is configured for single-service Web Service deployment on [Render](https://render.com). 
The Flask backend automatically serves the compiled Vite React frontend from `frontend/dist/`.

---

## 🚀 One-Click Deploy (Using `render.yaml`)

1. Push your repository to GitHub:
   ```bash
   git push origin main --force
   ```
2. Go to [Render Blueprints](https://dashboard.render.com/blueprints).
3. Connect your repository `ParayushK12/DC_RAG`.
4. Set the `MISTRAL_API_KEY` environment variable when prompted.
5. Click **Apply**.

---

## 🛠️ Manual Web Service Setup on Render

1. Open [Render Dashboard](https://dashboard.render.com) and click **New +** → **Web Service**.
2. Connect your repository: `ParayushK12/DC_RAG`.
3. Configure the settings:
   - **Name**: `dc-rag-diagram-generator`
   - **Environment**: `Python`
   - **Region**: Closest to your users (e.g. Frankfurt, Oregon, Singapore)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     python backend/app.py
     ```
4. **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `MISTRAL_API_KEY` | *Your Mistral API Key* |
   | `PYTHON_VERSION` | `3.12.0` |
   | `PORT` | `10000` *(Render sets this automatically)* |
5. Click **Deploy Web Service**.

---

## 💻 Local Development

### 1. Configure Environment
```env
MISTRAL_API_KEY=your_mistral_api_key_here
PORT=5001
```

### 2. Run Dev Servers Concurrently
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.
