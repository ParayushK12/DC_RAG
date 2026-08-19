import React, { useState, useRef, useEffect, useCallback } from 'react'
import mermaid from 'mermaid'
import Logo from './Logo'
import './App.css'

export default function App() {
  const [mode, setMode] = useState('text') // 'text' | 'pdf'
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [diagramType, setDiagramType] = useState('auto')
  
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('diagram') // 'diagram' | 'code' | 'summary'
  
  // Results
  const [summaryText, setSummaryText] = useState('')
  const [mermaidCode, setMermaidCode] = useState('')
  const [editableCode, setEditableCode] = useState('')
  const [copiedType, setCopiedType] = useState(null)
  
  // Canvas zoom & pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)

  const previewContainerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initialize Mermaid with Mistral warm-dark theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#16161a',
        primaryColor: '#fa520f',
        primaryTextColor: '#fff8e0',
        primaryBorderColor: '#ffa110',
        lineColor: '#a8a8a8',
        secondaryColor: '#2c2c2c',
        tertiaryColor: '#1f1f1f'
      }
    })
  }, [])

  // Render Mermaid code to SVG
  const renderDiagram = useCallback(async (code) => {
    if (!previewContainerRef.current) return
    if (!code || !code.trim()) {
      previewContainerRef.current.innerHTML = '<div class="canvas-placeholder">No diagram generated yet</div>'
      return
    }

    try {
      const id = 'mermaid-svg-' + Math.random().toString(36).substring(2, 9)
      const { svg } = await mermaid.render(id, code)
      previewContainerRef.current.innerHTML = svg
      
      const svgElement = previewContainerRef.current.querySelector('svg')
      if (svgElement) {
        svgElement.style.maxWidth = '100%'
        svgElement.style.height = 'auto'
      }
      setError(null)
    } catch (err) {
      console.error('Mermaid render error:', err)
      previewContainerRef.current.innerHTML = `
        <div class="render-error">
          <p class="error-title">Diagram syntax issue</p>
          <pre>${err.message || 'Check the Mermaid code tab.'}</pre>
        </div>`
    }
  }, [])

  useEffect(() => {
    renderDiagram(mermaidCode)
    setEditableCode(mermaidCode)
  }, [mermaidCode, renderDiagram])

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Please choose a valid PDF file.')
        return
      }
      setFile(selected)
      setError(null)
    }
  }

  // Handle Diagram Generation
  const handleGenerate = async () => {
    setError(null)
    setLoading(true)
    setLoadingStep('Analyzing context...')

    try {
      let res
      if (mode === 'pdf') {
        if (!file) {
          throw new Error('Please select a PDF file to process.')
        }
        const formData = new FormData()
        formData.append('file', file)
        if (query.trim()) formData.append('query', query.trim())
        if (diagramType) formData.append('diagram_type', diagramType)

        setTimeout(() => setLoadingStep('Generating diagram...'), 1600)

        res = await fetch('/api/process-rag', {
          method: 'POST',
          body: formData
        })
      } else {
        if (!text.trim()) {
          throw new Error('Please enter text or select a preset.')
        }

        setTimeout(() => setLoadingStep('Generating diagram...'), 1200)

        res = await fetch('/api/process-rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            query: query.trim() || undefined,
            diagram_type: diagramType
          })
        })
      }

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Diagram generation failed.')
      }

      setMermaidCode(data.mermaid_code)
      setEditableCode(data.mermaid_code)
      if (data.summary) {
        setSummaryText(data.summary)
      }
      setActiveTab('diagram')
      resetView()

    } catch (err) {
      setError(err.message || 'An error occurred during generation.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // Live code editor apply
  const handleApplyCodeEdit = () => {
    setMermaidCode(editableCode)
    renderDiagram(editableCode)
  }

  // Pan and Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4))
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e) => {
    if (activeTab !== 'diagram') return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Copy helper
  const copyToClipboard = (textToCopy, type) => {
    navigator.clipboard.writeText(textToCopy)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  // Export SVG
  const downloadSVG = () => {
    const svgEl = previewContainerRef.current?.querySelector('svg')
    if (!svgEl) {
      setError('Please generate a diagram first before downloading.')
      return
    }
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `blockdiagram-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Export PNG
  const downloadPNG = () => {
    const svgEl = previewContainerRef.current?.querySelector('svg')
    if (!svgEl) {
      setError('Please generate a diagram first before downloading.')
      return
    }

    try {
      const bbox = svgEl.getBoundingClientRect()
      const viewBox = svgEl.viewBox?.baseVal
      const width = (viewBox && viewBox.width > 0) ? viewBox.width : (bbox.width || 1200)
      const height = (viewBox && viewBox.height > 0) ? viewBox.height : (bbox.height || 800)

      // Clone SVG and enforce dimensions and xmlns
      const clonedSvg = svgEl.cloneNode(true)
      clonedSvg.setAttribute('width', width)
      clonedSvg.setAttribute('height', height)
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

      const svgString = new XMLSerializer().serializeToString(clonedSvg)
      const svgBase64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)

      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const scale = 2 // High DPI 2x
        const canvas = document.createElement('canvas')
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.fillStyle = '#16161a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `blockdiagram-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 'image/png')
      }

      img.onerror = (err) => {
        console.error('PNG export render error, falling back to SVG:', err)
        downloadSVG()
      }

      img.src = svgBase64
    } catch (e) {
      console.error('PNG conversion error:', e)
      downloadSVG()
    }
  }

  return (
    <div className={`mistral-shell ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Top Navbar */}
      <header className="mistral-navbar">
        <div className="brand-lockup">
          <Logo size={32} />
          <div className="brand-text">
            <span className="brand-name">BlockDiagram</span>
          </div>
        </div>

        <div className="navbar-controls">
          <a
            href="https://github.com/ParayushK12/DC_RAG"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Hero Headline Section */}
      <div className="hero-banner">
        <h1 className="hero-heading">Generate diagrams instantly from text and documents.</h1>
        <p className="hero-lead">Transform technical architecture, processes, and flows into interactive diagrams.</p>
      </div>

      {/* Main Workspace Layout */}
      <main className="mistral-workspace">
        {/* Left Side: Input & Options */}
        <section className="mistral-card controls-card">
          <div className="card-heading-group">
            <span className="eyebrow">INPUT</span>
            <h2 className="card-title">Source Material</h2>
          </div>

          {/* Segmented Mode Selector */}
          <div className="mistral-segmented">
            <button
              type="button"
              className={`segmented-tab ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}
            >
              Text Input
            </button>
            <button
              type="button"
              className={`segmented-tab ${mode === 'pdf' ? 'active' : ''}`}
              onClick={() => setMode('pdf')}
            >
              PDF Document
            </button>
          </div>

          {mode === 'text' ? (
            <div className="field-group">
              <label className="field-label">Document Text</label>
              <textarea
                className="mistral-textarea"
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter or paste text to generate a diagram..."
              />
            </div>
          ) : (
            <div className="field-group">
              <label className="field-label">Upload Document</label>
              <div
                className={`mistral-dropzone ${file ? 'active-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <div className="selected-file-row">
                    <span className="file-icon">📄</span>
                    <div className="file-info-col">
                      <span className="file-title">{file.name}</span>
                      <span className="file-meta">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button
                      type="button"
                      className="btn-clear"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="dropzone-empty">
                    <span className="dropzone-icon">↑</span>
                    <p className="dropzone-title">Upload PDF document</p>
                    <p className="dropzone-sub">Documents will be analyzed for diagram structures</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Query Focus */}
          <div className="field-group">
            <label className="field-label">
              Focus / Query <span className="label-sub">(Optional)</span>
            </label>
            <input
              type="text"
              className="mistral-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Focus on token validation and session cache"
            />
          </div>

          {/* Diagram Type Selector */}
          <div className="field-group">
            <label className="field-label">Diagram Type</label>
            <select
              className="mistral-select"
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
            >
              <option value="auto">Auto-Detect</option>
              <option value="flowchart_td">Flowchart (Top to Bottom)</option>
              <option value="flowchart_lr">Flowchart (Left to Right)</option>
              <option value="sequence">Sequence Diagram</option>
              <option value="state">State Machine</option>
              <option value="class">Class / Entity Diagram</option>
            </select>
          </div>

          {error && (
            <div className="mistral-alert error">
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            className={`btn-primary ${loading ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-state">
                <span className="mistral-spinner"></span>
                <span>{loadingStep || 'Processing...'}</span>
              </span>
            ) : (
              <span>Generate Diagram</span>
            )}
          </button>
        </section>

        {/* Right Side: Viewer & Inspector */}
        <section className="mistral-card viewer-card">
          {/* Viewer Tabs Navigation */}
          <div className="viewer-tab-bar">
            <div className="tab-buttons">
              <button
                type="button"
                className={`tab-link ${activeTab === 'diagram' ? 'active' : ''}`}
                onClick={() => setActiveTab('diagram')}
              >
                Diagram
              </button>
              <button
                type="button"
                className={`tab-link ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                Mermaid Code
              </button>
              <button
                type="button"
                className={`tab-link ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
            </div>

            <div className="action-buttons">
              {activeTab === 'diagram' && (
                <>
                  <button type="button" className="btn-icon" onClick={handleZoomIn} title="Zoom in">+</button>
                  <button type="button" className="btn-icon" onClick={handleZoomOut} title="Zoom out">-</button>
                  <button type="button" className="btn-icon" onClick={resetView} title="Reset view">100%</button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title="Toggle fullscreen"
                  >
                    {isFullscreen ? 'Exit' : 'Full'}
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn-action highlight"
                onClick={() => copyToClipboard(mermaidCode, 'code')}
              >
                {copiedType === 'code' ? '✓ Copied' : 'Copy Code'}
              </button>
              <button type="button" className="btn-action" onClick={downloadSVG}>
                SVG
              </button>
              <button type="button" className="btn-action" onClick={downloadPNG}>
                PNG
              </button>
            </div>
          </div>

          {/* Tab 1: Diagram Canvas */}
          <div
            className={`canvas-container ${activeTab === 'diagram' ? 'visible' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div
              className="canvas-content"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center'
              }}
              ref={previewContainerRef}
            />
          </div>

          {/* Tab 2: Live Code Editor */}
          <div className={`editor-container ${activeTab === 'code' ? 'visible' : ''}`}>
            <div className="editor-top-bar">
              <span className="editor-hint">Edit Mermaid syntax directly to re-render preview</span>
              <button type="button" className="btn-apply" onClick={handleApplyCodeEdit}>
                Apply Changes
              </button>
            </div>
            <textarea
              className="mistral-code-editor"
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              spellCheck="false"
            />
          </div>

          {/* Tab 3: Concise Summary */}
          <div className={`summary-container ${activeTab === 'summary' ? 'visible' : ''}`}>
            <div className="summary-card-inner">
              <div className="summary-top">
                <span className="summary-badge">ARCHITECTURE SUMMARY</span>
                <button
                  type="button"
                  className="btn-action"
                  onClick={() => copyToClipboard(summaryText, 'summary')}
                >
                  {copiedType === 'summary' ? '✓ Copied' : 'Copy Summary'}
                </button>
              </div>
              <p className="summary-paragraph">
                {summaryText || 'Summary will appear here after generating a diagram.'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Signature Sunset Stripe Footer Band */}
      <footer className="mistral-footer-stripe">
        <div className="sunset-bar"></div>
        <div className="footer-content">
          <span>BlockDiagram</span>
          <span>© 2026 BlockDiagram • Built by ParayushK12</span>
        </div>
      </footer>
    </div>
  )
}
