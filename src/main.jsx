import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { PlayerProvider } from './context/PlayerContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { ProfileProvider } from './context/ProfileContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LibraryProvider>
        <ProfileProvider>
          <PlayerProvider>
            <App />
          </PlayerProvider>
        </ProfileProvider>
      </LibraryProvider>
    </BrowserRouter>
  </React.StrictMode>
)
