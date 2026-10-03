import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Users, Activity, TrendingUp, Clock, CheckCircle2, Rocket, MessageSquare, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLoader } from '../context/LoaderContext';

const Dashboard = () => {
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();
  const [stats, setStats] = useState({
    pages_connected: 0,
    posts_generated: 0,
    published_posts: 0,
    scheduled_posts: 0,
    auto_replies_sent: 0,
    auto_dms_sent: 0,
    ad_campaigns_total: 0,
    recent_activity: []
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
    { label: 'Pages Connected', value: stats.pages_connected || 0, icon: <Users size={18} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Posts Generated', value: stats.posts_generated || 0, icon: <Activity size={18} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Published Posts', value: stats.published_posts || 0, icon: <CheckCircle2 size={18} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Ad Campaigns', value: stats.ad_campaigns_total || 0, icon: <Rocket size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Auto Replies', value: stats.auto_replies_sent || 0, icon: <MessageSquare size={18} />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { label: 'Auto DMs Sent', value: stats.auto_dms_sent || 0, icon: <Send size={18} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={15} color="var(--color-text-muted)" />
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
        </div>
        
        {stats.recent_activity && stats.recent_activity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recent_activity.map(activity => (
              <div key={activity.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ 
                  background: activity.type === 'AD' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', 
                  padding: '0.5rem', borderRadius: '50%' 
                }}>
                  {activity.type === 'AD' ? <Rocket size={16} color="#f59e0b" /> : <Activity size={16} color="#10b981" />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{activity.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem' }}>
                    <Clock size={12} /> 
                    {new Date(activity.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>No recent activity to display yet. Generate your first post to get started.</p>
        )}
      </div>

    </SidebarLayout>
  );
};

export default Dashboard;
