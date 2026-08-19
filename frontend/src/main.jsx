import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './App.css'

// Auto-reload if dynamic chunk hashes change after a new build
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)