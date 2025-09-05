import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/globals.css' // Global styles
import './styles/blueprint-theme.css' // Blueprint.js dark theme
import './styles/goober-setup' // Initialize goober setup
import { ThemeProvider } from './contexts/ThemeProvider'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
