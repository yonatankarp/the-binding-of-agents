import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { DashboardErrorBoundary } from './App'
import './styles/tboi.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DashboardErrorBoundary>
      <App />
    </DashboardErrorBoundary>
  </React.StrictMode>,
)
