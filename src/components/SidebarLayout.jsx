import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenTool, LogOut, Sun, Moon, Menu, X, User, PanelLeftClose, PanelLeftOpen, Megaphone, MessageSquareReply, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const SidebarLayout = ({ children, title }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('business_name') || 'JMS Automation');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_email') || '');

  const sidebarWidth = isCollapsed ? '72px' : '245px';

  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBusinessName(data.business_name || 'JMS Automation');
          setUserEmail(data.email || '');
          localStorage.setItem('business_name', data.business_name || 'JMS Automation');
          localStorage.setItem('user_email', data.email || '');
        }
      } catch (err) {
        console.error('Failed to fetch user info', err);
      }
    };

    const fetchMetaStatus = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/status/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.is_connected) {
            showToast('No meta account added, please add one first.', 'info');
            navigate('/meta-connect');
          }
        }
      } catch (err) {
        console.error('Failed to fetch Meta status', err);
      }
    };

    fetchMe();
    fetchMetaStatus();
  }, [navigate, showToast]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={19} /> },
    { name: 'Brand Setup', path: '/brand-setup', icon: <BookOpen size={19} /> },
    { name: 'Content Studio', path: '/studio', icon: <PenTool size={19} /> },
    { name: 'History', path: '/history', icon: <Clock size={19} /> },
    { name: 'Ad Campaigns', path: '/ad-campaigns', icon: <Megaphone size={19} /> },
    { name: 'Auto-Reply', path: '/auto-reply', icon: <MessageSquareReply size={19} /> },
    { name: 'Profile', path: '/profile', icon: <User size={19} /> },
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
    localStorage.removeItem('business_name');
    localStorage.removeItem('user_email');
    showToast('Logged out successfully', 'success');
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
          width: sidebarWidth,
          background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: isCollapsed ? '1rem 0.5rem' : '1.25rem 1rem',
          position: 'fixed',
          height: '100vh',
          zIndex: 20,
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>

          {/* Top Row: Toggle Button */}
          <div style={{ width: '100%', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', padding: isCollapsed ? '0' : '0 0.25rem' }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="desktop-only"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              style={{
                background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)', cursor: 'pointer', padding: '6px', display: 'flex',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s'
              }}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Bottom Row: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', width: '100%' }}>
            <img
              src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png"
              alt="JMS Logo"
              style={{ height: isCollapsed ? '28px' : '44px', maxWidth: '100%', objectFit: 'contain', transition: 'all 0.25s' }}
            />
          </div>

          {/* Close button for mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-muted)',
              cursor: 'pointer', padding: '6px', display: 'none', position: 'absolute', right: '12px', top: '16px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              title={isCollapsed ? item.name : ''}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '0.85rem',
                padding: isCollapsed ? '0.75rem 0' : '0.65rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                letterSpacing: '0.01em',
                color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.22) 0%, rgba(99, 102, 241, 0.16) 100%)' 
                  : 'transparent',
                borderLeft: isActive && !isCollapsed ? '3px solid var(--color-primary)' : '3px solid transparent',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                fontWeight: isActive ? '600' : '500',
                transition: 'all var(--transition-fast)',
                textDecoration: 'none'
              })}
            >
              {item.icon}
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User profile & footer actions */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          {!isCollapsed ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 0.8rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0, boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}></div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{businessName}</span>
              </div>
              {userEmail && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', paddingLeft: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userEmail}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }} title={businessName}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), #6366f1)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}>
                {businessName ? businessName.charAt(0).toUpperCase() : 'B'}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : ""}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start', gap: '0.75rem',
              color: 'var(--color-text-muted)', fontSize: '0.88rem', fontWeight: '500',
              padding: isCollapsed ? '0.7rem 0' : '0.6rem 0.85rem', background: 'none', border: '1px solid transparent',
              cursor: 'pointer', width: '100%', borderRadius: 'var(--radius-md)',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-danger)';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, marginLeft: sidebarWidth, padding: '1.25rem 1.5rem', transition: 'margin-left 0.25s ease-in-out' }}>
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
          .desktop-only {
            display: none !important;
          }
          .sidebar {
            transform: translateX(-100%);
            width: 250px !important;
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

