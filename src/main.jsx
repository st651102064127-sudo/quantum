import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // หรือ HashRouter
import './index.css'
import App from './App.jsx' // ต้องมี .jsx และตัว A พิมพ์ใหญ่ตามชื่อไฟล์

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
