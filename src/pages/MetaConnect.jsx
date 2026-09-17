import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';

const MetaConnect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [pageId, setPageId] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);

  // Auto Reply State
  const [autoReplyText, setAutoReplyText] = useState('');
  const [isAutoReplyActive, setIsAutoReplyActive] = useState(false);
  const [isSavingReply, setIsSavingReply] = useState(false);

  // Fetch Auto Reply Settings
  useEffect(() => {
    const fetchAutoReply = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/auto-reply-settings/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAutoReplyText(data.reply_text || '');
          setIsAutoReplyActive(data.is_active || false);
        }
      } catch (error) { console.error(error); }
    };
    fetchAutoReply();
  }, []);

  const saveAutoReply = async () => {
    setIsSavingReply(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/auto-reply-settings/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` 
        },
        body: JSON.stringify({ reply_text: autoReplyText, is_active: isAutoReplyActive })
      });
      if (res.ok) showToast('Auto-Reply settings saved!', 'success');
      else showToast('Failed to save settings', 'error');
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsSavingReply(false);
    }
  };

  const fetchMetaStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/status/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.is_connected);
        setPageId(data.page_id);
        if (data.is_connected && !data.page_id) {
          fetchPages();
        } else if (data.is_connected && data.page_id) {
          // If they already have a meta account and a page selected, auto-redirect!
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to fetch Meta status', err);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/pages/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Fallback in case the API returns an object instead of an array directly
        const pagesArray = Array.isArray(data) ? data : (data.pages || data.data || []);
        setPages(pagesArray);
      }
    } catch (err) {
      console.error('Failed to fetch pages', err);
    }
  };

  useEffect(() => {
    fetchMetaStatus();
    
    const code = searchParams.get('code');
    if (code) handleMetaCallback(code);
  }, [searchParams]);

  const handleMetaCallback = async (code) => {
    showLoader('Linking Meta Account...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/callback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ code })
      });
      if (response.ok) {
        hideLoader();
        showToast('Meta account linked!', 'success');
        fetchMetaStatus();
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        hideLoader();
        showToast('Failed to link Meta account.', 'error');
      }
    } catch (error) {
      hideLoader();
      showToast('Network error.', 'error');
    }
  };

  const handleMetaConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/auth-url/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      const data = await response.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        showToast("No valid URL from backend.", 'error');
        setIsConnecting(false);
      }
    } catch (error) {
      showToast('Could not fetch Meta login URL.', 'error');
      setIsConnecting(false);
    }
  };

  const handleSavePage = async () => {
    if (!selectedPage) {
      showToast('Please select a page', 'info');
      return;
    }
    showLoader('Saving page...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/pages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ page_id: selectedPage, auto_reply: autoReplyEnabled })
      });
      if (res.ok) {
        hideLoader();
        showToast('Page selected successfully!', 'success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        hideLoader();
        showToast('Failed to save page.', 'error');
      }
    } catch (err) {
      hideLoader();
      showToast('Network error.', 'error');
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '340px', width: '100%', textAlign: 'center', padding: '1.75rem' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            width: '48px', height: '48px', 
            background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Globe size={22} color={isConnected ? "var(--color-success)" : "var(--color-primary)"} />
          </div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>
            {isConnected ? 'Meta Connected' : 'Connect Meta Account'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {isConnected 
              ? 'Your Meta account is linked. Please select a page to publish to.'
              : 'Link your Facebook or Instagram pages to generate and publish content.'}
          </p>
        </div>

        {!isConnected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
            {['Publish posts automatically', 'Read page analytics', 'Automate comment & message replies'].map(text => (
              <div key={text} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={14} color="var(--color-accent)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{text}</span>
              </div>
            ))}
          </div>
        )}

        {isConnected && !pageId && (
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label className="label">Select Facebook Page</label>
            <select 
              className="input-field" 
              value={selectedPage} 
              onChange={(e) => setSelectedPage(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              <option value="">-- Choose a Page --</option>
              {Array.isArray(pages) && pages.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--color-text)', marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              <input type="checkbox" checked={autoReplyEnabled} onChange={(e) => setAutoReplyEnabled(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
              Enable Auto-Reply
            </label>

            <button 
              className="btn btn-primary" 
              onClick={handleSavePage}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Save & Continue
            </button>
          </div>
        )}

        {!isConnected && (
          <button 
            className="btn btn-primary" 
            onClick={handleMetaConnect}
            disabled={isConnecting}
            style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem', padding: '0.5rem' }}
          >
            {isConnecting ? <RefreshCw className="animate-spin" size={15} /> : <Globe size={15} />}
            <span>{isConnecting ? 'Connecting...' : 'Connect with Meta'}</span>
          </button>
        )}

        {/* Auto Reply Settings Panel */}
        <div className="glass-panel" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Smart Auto-Reply</h3>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                Reply to incoming comments on FB and IG.
              </p>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ 
                width: '40px', height: '20px', background: isAutoReplyActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                borderRadius: '20px', position: 'relative', transition: 'all 0.3s'
              }}>
                <div style={{
                  width: '16px', height: '16px', background: 'white', borderRadius: '50%',
                  position: 'absolute', top: '2px', left: isAutoReplyActive ? '22px' : '2px', transition: 'all 0.3s'
                }} />
              </div>
              <input 
                type="checkbox" 
                hidden 
                checked={isAutoReplyActive} 
                onChange={(e) => setIsAutoReplyActive(e.target.checked)} 
              />
            </label>
          </div>

          <div style={{ opacity: isAutoReplyActive ? 1 : 0.5, transition: 'opacity 0.3s', pointerEvents: isAutoReplyActive ? 'auto' : 'none' }}>
            <label className="label">Auto-Reply Message</label>
            <textarea 
              className="input-field" 
              rows="3" 
              placeholder="e.g. Thanks for your comment! We will DM you shortly."
              value={autoReplyText} 
              onChange={(e) => setAutoReplyText(e.target.value)}
              style={{ width: '100%', resize: 'vertical', marginBottom: '1rem' }}
            />
            
            <button 
              className="btn btn-primary" 
              onClick={saveAutoReply} 
              disabled={isSavingReply}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isSavingReply ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>


        
      </div>
    </div>
  );
};

export default MetaConnect;
