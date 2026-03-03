import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// เปลี่ยนบรรทัดนี้: จาก BrowserRouter เป็น HashRouter
import { HashRouter } from 'react-router-dom' 
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* เปลี่ยนตรงนี้ด้วย */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
