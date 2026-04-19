import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Telas from './pages/Telas';
import Midias from './pages/Midias';
import Playlists from './pages/Playlists';
import Player from './pages/Player';
import './index.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div style={{ fontWeight: 500 }}>Gestão de Mídia Indoor</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              backgroundColor: 'var(--bg-elevated)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>AD</span>
            </div>
          </div>
        </header>
        <div className="page-container animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/player/:code" element={<Player />} />
        
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="telas" element={<Telas />} />
          <Route path="midias" element={<Midias />} />
          <Route path="playlists" element={<Playlists />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
