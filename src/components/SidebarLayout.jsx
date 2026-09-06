import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenTool, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SidebarLayout = ({ children, title }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState('JMS Automation');

  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBusinessName(data.business_name || 'JMS Automation');
        }
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    };
    fetchMe();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Brand Setup', path: '/brand-setup', icon: <BookOpen size={16} /> },
    { name: 'Content Studio', path: '/studio', icon: <PenTool size={16} /> },
  ];

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('jwt_refresh');
      if (refresh) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh })
        });
      }
    } catch (err) {
      console.error('Logout error', err);
    }
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_refresh');
    navigate('/auth');
  };

  const handleNavClick = () => {
    setSidebarOpen(false); // Close sidebar on mobile after nav click
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 19, display: 'none'
          }}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        style={{ 
          width: '200px', 
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0.75rem',
          position: 'fixed',
          height: '100vh',
          zIndex: 20,
          transition: 'transform 0.25s ease-in-out'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img 
              src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png" 
              alt="JMS Logo" 
              style={{ height: '28px', objectFit: 'contain' }}
            />
            {/* Close button for mobile */}
            <button
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text-muted)',
                cursor: 'pointer', padding: '4px', display: 'none'
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
            {businessName}
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: isActive ? 'white' : 'var(--color-text-muted)',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                fontWeight: isActive ? '500' : '400',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none'
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.6rem', 
              color: 'var(--color-text-muted)', fontSize: '0.8rem',
              padding: '0.45rem 0.75rem', background: 'none', border: 'none',
              cursor: 'pointer', width: '100%', borderRadius: 'var(--radius-md)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, marginLeft: '200px', padding: '1.25rem 1.5rem' }}>
        <header style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Hamburger button for mobile */}
            <button 
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text)',
                cursor: 'pointer', padding: '4px', display: 'none'
              }}
            >
              <Menu size={20} />
            </button>
            <h1 style={{ margin: 0 }}>{title}</h1>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem', borderRadius: '50%' }}
            onClick={toggleTheme}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>
        <main className="animate-fade-in">
          {children}
        </main>
      </div>

      {/* Responsive styles injected as a <style> tag */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.sidebar-open {
            transform: translateX(0) !important;
          }
          .sidebar-overlay {
            display: block !important;
          }
          .sidebar-close-btn {
            display: block !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .main-content {
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SidebarLayout;
