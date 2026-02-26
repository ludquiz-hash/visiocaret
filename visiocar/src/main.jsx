import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

console.log('🚀 APP START - main.jsx loaded')
console.log('Environment:', import.meta.env.MODE)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set')
console.log('API URL:', import.meta.env.VITE_API_URL ? 'Set' : 'Not set')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found!')
} else {
  console.log('✅ Root element found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

console.log('✅ App rendered')
