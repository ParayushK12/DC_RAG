import os
import tempfile
import traceback
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Determine frontend static build directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "frontend", "dist")

app = Flask(
    __name__,
    static_folder=FRONTEND_DIST if os.path.exists(FRONTEND_DIST) else None,
    static_url_path=""
)
CORS(app)

# Lazy-loaded RAG Engine
rag_engine = None

def get_rag_engine():
    global rag_engine
    if rag_engine is None:
        from rag_engine import DiagramRAGEngine
        rag_engine = DiagramRAGEngine()
    return rag_engine


# Serve Frontend static files for unified deployment (e.g. on Render)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if FRONTEND_DIST and os.path.exists(FRONTEND_DIST):
        file_path = os.path.join(FRONTEND_DIST, path)
        if path != "" and os.path.exists(file_path):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, 'index.html')
    
    # Fallback if frontend dist is not built
    return jsonify({
        'status': 'online',
        'service': 'RAG Diagram Generator Backend',
        'endpoints': {
            '/api/process-rag': 'POST (unified RAG endpoint for PDF and text)',
            '/health': 'GET (health check)'
        },
        'note': 'Build frontend to serve web UI directly from root.'
    })


@app.route('/health', methods=['GET'])
def health_check():
    api_key_set = bool(os.getenv("MISTRAL_API_KEY"))
    return jsonify({
        'status': 'healthy',
        'mistral_api_key_configured': api_key_set,
        'frontend_dist_found': os.path.exists(FRONTEND_DIST) if FRONTEND_DIST else False
    })


@app.route('/api/process-rag', methods=['POST'])
def process_rag():
    """
    Unified RAG endpoint.
    Accepts:
      - multipart/form-data with 'file' (PDF) + optional 'query', 'diagram_type'
      - JSON with 'text' (string) + optional 'query', 'diagram_type'
    """
    temp_pdf_path = None
    try:
        engine = get_rag_engine()
        
        # Check if PDF file was uploaded
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({'error': 'Uploaded file must be a PDF'}), 400
            
            query = request.form.get('query', '').strip()
            diagram_type = request.form.get('diagram_type', 'auto')

            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_pdf:
                file.save(temp_pdf.name)
                temp_pdf_path = temp_pdf.name
            
            result = engine.process(
                pdf_path=temp_pdf_path,
                query=query if query else None,
                diagram_type=diagram_type
            )
            return jsonify(result)

        # Check for JSON text payload
        payload = request.get_json(silent=True) or {}
        text = payload.get('text', '').strip()
        query = payload.get('query', '').strip()
        diagram_type = payload.get('diagram_type', 'auto')

        if not text:
            return jsonify({'error': 'Please provide either a PDF file or text content.'}), 400

        result = engine.process(
            text=text,
            query=query if query else None,
            diagram_type=diagram_type
        )
        return jsonify(result)

    except Exception as e:
        print(f"Error in process_rag: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to process document and generate diagram.'
        }), 500

    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            try:
                os.unlink(temp_pdf_path)
            except Exception:
                pass


# Backward compatibility endpoints
@app.route('/api/process-pdf', methods=['POST'])
def legacy_process_pdf():
    return process_rag()


@app.route('/api/process-text', methods=['POST'])
def legacy_process_text():
    return process_rag()


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"Starting RAG Diagram Generator Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)