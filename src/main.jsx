import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { seedIfEmpty } from './utils/seedData'

// Seed runs async in background; Dashboard fetches data via its own useEffect
seedIfEmpty().catch(console.error);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
