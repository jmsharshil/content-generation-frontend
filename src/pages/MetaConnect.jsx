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
        setPages(data);
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
        body: JSON.stringify({ page_id: selectedPage })
      });
      if (res.ok) {
        hideLoader();
        showToast('Page selected successfully!', 'success');
        navigate('/brand-setup');
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
            {['Publish posts automatically', 'Read page analytics'].map(text => (
              <div key={text} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={14} color="var(--color-accent)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{text}</span>
              </div>
            ))}
          </div>
        )}

        {isConnected && !pageId && pages.length > 0 && (
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label className="label">Select Facebook Page</label>
            <select 
              className="input-field" 
              value={selectedPage} 
              onChange={(e) => setSelectedPage(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              <option value="">-- Choose a Page --</option>
              {pages.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
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

        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/brand-setup')}
          style={{ width: '100%', padding: '0.5rem', marginTop: isConnected ? '0.5rem' : 0 }}
        >
          <span>Skip for now</span>
          <ArrowRight size={13} />
        </button>
        
      </div>
    </div>
  );
};

export default MetaConnect;
