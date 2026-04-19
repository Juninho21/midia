import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MonitorPlay, Image as ImageIcon, ListVideo, Settings } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          S
        </div>
        <div className="sidebar-title">Safe Mídia</div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/telas" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MonitorPlay size={20} />
          <span>Telas (TVs)</span>
        </NavLink>
        
        <NavLink 
          to="/midias" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ImageIcon size={20} />
          <span>Mídias</span>
        </NavLink>
        
        <NavLink 
          to="/playlists" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ListVideo size={20} />
          <span>Playlists</span>
        </NavLink>
      </nav>
      
      <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
        <div className="nav-item">
          <Settings size={20} />
          <span>Configurações</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
