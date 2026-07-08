import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { MyProvider } from './Context.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import './i18n'
import 'leaflet/dist/leaflet.css'

createRoot(document.getElementById('root')).render(
  <MyProvider>
    <CurrencyProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CurrencyProvider>
  </MyProvider>
)