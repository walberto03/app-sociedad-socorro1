import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// ¡ESTA LÍNEA ES OBLIGATORIA PARA QUE SE VEA BONITO!
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)