import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { 
  Activity, Clock, CheckCircle2, Rocket, MessageSquare, Send, 
  Sparkles, Calendar, ArrowUpRight, RefreshCw, Layers, PlusCircle, Megaphone, ChevronRight, TrendingUp, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { useToast } from '../context/ToastContext';
import { useLoader } from '../context/LoaderContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();

  // Exact real data from backend API
  const [stats, setStats] = useState({
    published_posts: 0,
    scheduled_posts: 0,
    auto_replies_sent: 0,
    auto_dms_sent: 0,
    ad_campaigns_total: 0,
    recent_activity: []
  });

  const [postsList, setPostsList] = useState([]);
  const [adCampaignsList, setAdCampaignsList] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('business_name') || 'Your Brand');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (manual = false) => {
    if (!manual) showLoader('Loading Dashboard...');
    else setIsRefreshing(true);

    try {
      await Promise.allSettled([
        fetchStats(),
        fetchPostsHistory(),
        fetchAdsHistory(),
        fetchScheduledPosts(),
      ]);
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      if (!manual) hideLoader();
      else setIsRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Stats error:', error);
      showToast('Could not load dashboard stats.', 'error');
    }
  };

  const fetchPostsHistory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setPostsList(results);
      }
    } catch (err) {
      console.error('Error loading posts list', err);
    }
  };

  const fetchAdsHistory = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ads/history/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setAdCampaignsList(results);
      }
    } catch (err) {
      console.error('Error loading ads history', err);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/?status=APPROVED`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setScheduledPosts(results.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading scheduled posts', err);
    }
  };

  // Compute Last 7 Days Activity Breakdown strictly matching the KPI cards
  const { chartData, total7DaysPosts, total7DaysCampaigns, total7DaysActions } = useMemo(() => {
    const days = [];
    const postsCountMap = {};
    const adsCountMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ key, label: `${shortDay} (${fullDate})`, shortLabel: shortDay });
      postsCountMap[key] = 0;
      adsCountMap[key] = 0;
    }

    // 1. Group ONLY Published Posts by date (must match card count)
    const publishedPostsList = postsList.filter(p => p.status === 'PUBLISHED' || p.is_published);
    publishedPostsList.forEach(post => {
      const dateStr = post.published_at || post.date || post.created_at || post.scheduled_at;
      if (dateStr) {
        const key = dateStr.split('T')[0];
        if (postsCountMap[key] !== undefined) {
          postsCountMap[key] += 1;
        }
      }
    });

    // 2. Group Ad Campaigns by created date
    adCampaignsList.forEach(camp => {
      const dateStr = camp.created_at || camp.date;
      if (dateStr) {
        const key = dateStr.split('T')[0];
        if (adsCountMap[key] !== undefined) {
          adsCountMap[key] += 1;
        }
      }
    });

    // If ad campaigns API is empty or didn't return dates, fallback to stats.recent_activity type === 'AD'
    if (adCampaignsList.length === 0 && (stats.recent_activity || []).length > 0) {
      (stats.recent_activity || []).forEach(act => {
        if (act.type === 'AD' && act.date) {
          const key = act.date.split('T')[0];
          if (adsCountMap[key] !== undefined) {
            adsCountMap[key] += 1;
          }
        }
      });
    }

    let pSum = 0;
    let aSum = 0;

    const data = days.map(d => {
      const p = postsCountMap[d.key] || 0;
      const a = adsCountMap[d.key] || 0;
      pSum += p;
      aSum += a;
      return {
        key: d.key,
        name: d.shortLabel,
        fullDate: d.label,
        'Published Posts': p,
        'Ad Campaigns': a,
        total: p + a
      };
    });

    return {
      chartData: data,
      total7DaysPosts: pSum,
      total7DaysCampaigns: aSum,
      total7DaysActions: pSum + aSum
    };
  }, [postsList, adCampaignsList, stats.recent_activity]);

  // Selected Stat Cards
  const statCards = [
    { 
      label: 'Published Posts', 
      value: stats.published_posts || 0, 
      icon: <CheckCircle2 size={20} />, 
      color: '#8b5cf6', 
      bg: 'rgba(139,92,246,0.12)',
      border: 'rgba(139,92,246,0.25)',
      action: () => navigate('/history')
    },
    { 
      label: 'Ad Campaigns', 
      value: stats.ad_campaigns_total || 0, 
      icon: <Rocket size={20} />, 
      color: '#f59e0b', 
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.25)',
      action: () => navigate('/ad-campaigns')
    },
    { 
      label: 'Auto Replies', 
      value: stats.auto_replies_sent || 0, 
      icon: <MessageSquare size={20} />, 
      color: '#ec4899', 
      bg: 'rgba(236,72,153,0.12)',
      border: 'rgba(236,72,153,0.25)',
      action: () => navigate('/auto-reply')
    },
    { 
      label: 'Auto DMs Sent', 
      value: stats.auto_dms_sent || 0, 
      icon: <Send size={20} />, 
      color: '#06b6d4', 
      bg: 'rgba(6,182,212,0.12)',
      border: 'rgba(6,182,212,0.25)',
      action: () => navigate('/auto-reply')
    },
  ];

  const quickActions = [
    { title: 'Create Post', desc: 'AI content generator', icon: <Sparkles size={16} color="#3b82f6" />, path: '/studio' },
    { title: 'Launch Ad', desc: 'Promote campaigns to Meta', icon: <Megaphone size={16} color="#f59e0b" />, path: '/ad-campaigns' },
    { title: 'Auto-Reply Rules', desc: 'Manage comment & DM rules', icon: <MessageSquare size={16} color="#ec4899" />, path: '/auto-reply' },
    { title: 'Brand Setup', desc: 'Brand voice & tone settings', icon: <Layers size={16} color="#10b981" />, path: '/brand-setup' },
  ];

  // Custom informative tooltip for the graph
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '0.65rem 0.9rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          fontSize: '0.78rem'
        }}>
          <p style={{ margin: '0 0 0.4rem 0', fontWeight: 700, color: 'var(--color-text)' }}>
            📅 {data.fullDate}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', color: '#8b5cf6' }}>
              <span>• Published Posts:</span>
              <strong>{data['Published Posts']}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', color: '#f59e0b' }}>
              <span>• Ad Campaigns:</span>
              <strong>{data['Ad Campaigns']}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.3rem', paddingTop: '0.3rem', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text)', fontWeight: 600 }}>
              <span>Total Activity:</span>
              <span>{data.total}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <SidebarLayout title="Dashboard">
      
      {/* Header with Greeting & Action Controls */}
      <div 
        className="glass-panel" 
        style={{ 
          marginBottom: '1.25rem', 
          padding: '1.25rem 1.5rem',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)',
          borderColor: 'rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
            }}
          >
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
              Welcome back, <span className="text-gradient">{businessName}</span>
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
              Real-time summary of your automated content and Meta campaigns.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/studio')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem 1rem' }}
          >
            <PlusCircle size={15} />
            Create Content
          </button>
        </div>
      </div>

      {/* Real Stats Metric Cards Grid (4 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {statCards.map((card, idx) => (
          <div 
            key={idx} 
            className="glass-panel" 
            onClick={card.action}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              padding: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderColor: 'var(--color-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = card.border;
              e.currentTarget.style.boxShadow = `0 6px 18px -4px ${card.bg}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                {card.label}
              </span>
              <div style={{ background: card.bg, padding: '0.45rem', borderRadius: '8px', display: 'flex', color: card.color }}>
                {card.icon}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {card.value}
              </h2>
              <ArrowUpRight size={15} color="var(--color-text-muted)" />
            </div>
          </div>
        ))}
      </div>

      {/* ENHANCED: Last 7 Days Activity Graph with Clear Breakdown & Highlights */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* Header & Quick Summary Pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.45rem', borderRadius: '8px' }}>
              <TrendingUp size={18} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Last 7 Days Content & Campaign Activity
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Day-by-day comparison of published posts vs. campaign actions over the last week
              </p>
            </div>
          </div>

          {/* Stat Badges for Quick Understanding */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ 
              background: 'rgba(139,92,246,0.1)', 
              border: '1px solid rgba(139,92,246,0.25)', 
              padding: '0.3rem 0.65rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></span>
              Posts: <strong>{total7DaysPosts}</strong>
            </div>

            <div style={{ 
              background: 'rgba(245,158,11,0.1)', 
              border: '1px solid rgba(245,158,11,0.25)', 
              padding: '0.3rem 0.65rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              Campaigns: <strong>{total7DaysCampaigns}</strong>
            </div>

            <div style={{ 
              background: 'var(--color-bg-tertiary)', 
              border: '1px solid var(--color-border)', 
              padding: '0.3rem 0.65rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              Total Actions: <strong>{total7DaysActions}</strong>
            </div>
          </div>
        </div>

        {/* Bar Chart Representation for crystal-clear per-day clarity */}
        <div style={{ width: '100%', height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.35} vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-text-muted)" 
                fontSize={12} 
                tickLine={false} 
              />
              <YAxis 
                stroke="var(--color-text-muted)" 
                fontSize={11} 
                tickLine={false} 
                allowDecimals={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }} 
              />
              <Bar dataKey="Published Posts" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Ad Campaigns" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Helpful Explanation Footer */}
        <div style={{ 
          marginTop: '0.75rem', 
          paddingTop: '0.75rem', 
          borderTop: '1px solid var(--color-border)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.4rem', 
          fontSize: '0.72rem', 
          color: 'var(--color-text-muted)' 
        }}>
          <Info size={13} color="var(--color-primary)" />
          <span>
            Hover over any day's bar to see the exact breakdown of posts published and ad campaign activities logged on that date.
          </span>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          Quick Workflows
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {quickActions.map((action, idx) => (
            <div 
              key={idx}
              className="glass-panel"
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
                  {action.icon}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>{action.title}</h4>
                  <p style={{ margin: '0.15rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.73rem' }}>{action.desc}</p>
                </div>
              </div>
              <ChevronRight size={15} color="var(--color-text-muted)" />
            </div>
          ))}
        </div>
      </div>

      {/* Real Data Feeds: Recent Activity & Upcoming Scheduled */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Recent Activity Log (100% Real from API) */}
        <div className="glass-panel" style={{ minHeight: '260px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.4rem', borderRadius: '6px' }}>
                <Activity size={16} color="#3b82f6" />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Recent Activity</h3>
            </div>
            <button 
              onClick={() => navigate('/history')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}
            >
              View History →
            </button>
          </div>
          
          {stats.recent_activity && stats.recent_activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {stats.recent_activity.slice(0, 5).map((activity, idx) => (
                <div 
                  key={activity.id || idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem', 
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ 
                      background: activity.type === 'AD' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', 
                      padding: '0.45rem', 
                      borderRadius: '50%',
                      display: 'flex',
                      flexShrink: 0
                    }}>
                      {activity.type === 'AD' ? <Rocket size={14} color="#f59e0b" /> : <Activity size={14} color="#10b981" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activity.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                        <Clock size={11} /> 
                        {new Date(activity.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '0.2rem 0.55rem', 
                    borderRadius: '10px', 
                    background: activity.type === 'AD' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                    color: activity.type === 'AD' ? '#f59e0b' : '#10b981',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginLeft: '0.5rem'
                  }}>
                    {activity.type || 'POST'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <Activity size={32} color="var(--color-text-muted)" style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
                No recent activity logged yet.
              </p>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/studio')} 
                style={{ marginTop: '0.85rem', fontSize: '0.78rem' }}
              >
                Create First Post
              </button>
            </div>
          )}
        </div>

        {/* Scheduled Posts Pipeline (100% Real from /api/posts/?status=APPROVED) */}
        <div className="glass-panel" style={{ minHeight: '260px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.4rem', borderRadius: '6px' }}>
                <Calendar size={16} color="#8b5cf6" />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Scheduled Queue</h3>
            </div>
            <button 
              onClick={() => navigate('/studio')}
              style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}
            >
              Open Calendar →
            </button>
          </div>

          {scheduledPosts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {scheduledPosts.map((post) => (
                <div 
                  key={post.id}
                  style={{
                    padding: '0.75rem 0.9rem',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase' }}>
                      {post.platform || 'Both Platforms'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={11} />
                      {post.scheduled_time ? new Date(post.scheduled_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Queued'}
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.82rem', 
                    color: 'var(--color-text)', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {post.content || post.topic || 'Scheduled post'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <Calendar size={32} color="var(--color-text-muted)" style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
                No scheduled posts in the queue.
              </p>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/studio')} 
                style={{ marginTop: '0.85rem', fontSize: '0.78rem' }}
              >
                Schedule Posts
              </button>
            </div>
          )}
        </div>

      </div>

    </SidebarLayout>
  );
};

export default Dashboard;
