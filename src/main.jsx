import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './portal/portal-theme.css'
import './portal/portal-premium.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
