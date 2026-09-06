import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Users, Activity, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLoader } from '../context/LoaderContext';

const Dashboard = () => {
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();
  const [stats, setStats] = useState({
    pages_connected: 0,
    posts_generated: 0,
    pending_review: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    showLoader('Loading Dashboard...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      showToast('Could not load dashboard stats.', 'error');
    } finally {
      hideLoader();
    }
  };

  const statCards = [
    { label: 'Pages Connected', value: stats.pages_connected, icon: <Users size={18} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Posts Generated', value: stats.posts_generated, icon: <Activity size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Pending Review', value: stats.pending_review, icon: <Clock size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ];

  return (
    <SidebarLayout title="Dashboard">
      
      {/* Stats Row — responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {statCards.map((card, idx) => (
          <div key={idx} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: card.bg, padding: '0.6rem', borderRadius: 'var(--radius-md)', display: 'flex', flexShrink: 0 }}>
              {React.cloneElement(card.icon, { color: card.color })}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{card.label}</p>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="glass-panel" style={{ minHeight: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <TrendingUp size={15} color="var(--color-text-muted)" />
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No recent activity to display yet. Generate your first post to get started.</p>
      </div>

    </SidebarLayout>
  );
};

export default Dashboard;
