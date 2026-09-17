import React, { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { MessageSquareReply } from 'lucide-react';

const AutoReply = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();
  
  const [autoReplyText, setAutoReplyText] = useState('');
  const [isAutoReplyActive, setIsAutoReplyActive] = useState(false);
  const [isSavingReply, setIsSavingReply] = useState(false);

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

  return (
    <SidebarLayout title="Auto-Reply Settings">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                <MessageSquareReply size={24} color="var(--color-primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Smart Auto-Reply</h2>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Automatically reply to incoming comments on your linked Facebook and Instagram pages.
              </p>
            </div>
            
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ 
                width: '48px', height: '24px', background: isAutoReplyActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                borderRadius: '24px', position: 'relative', transition: 'all 0.3s'
              }}>
                <div style={{
                  width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                  position: 'absolute', top: '2px', left: isAutoReplyActive ? '26px' : '2px', transition: 'all 0.3s'
                }} />
              </div>
              <input type="checkbox" hidden checked={isAutoReplyActive} onChange={(e) => setIsAutoReplyActive(e.target.checked)} />
            </label>
          </div>

          <div style={{ opacity: isAutoReplyActive ? 1 : 0.5, transition: 'opacity 0.3s', pointerEvents: isAutoReplyActive ? 'auto' : 'none' }}>
            <label className="label">Auto-Reply Message Template</label>
            <textarea 
              className="input-field" 
              rows="5" 
              placeholder="e.g. Thanks for your comment! We will DM you shortly."
              value={autoReplyText} 
              onChange={(e) => setAutoReplyText(e.target.value)}
              style={{ width: '100%', resize: 'vertical', marginBottom: '1.5rem', fontSize: '0.9rem', padding: '1rem' }}
            />
            
            <button 
              className="btn btn-primary" 
              onClick={saveAutoReply} 
              disabled={isSavingReply}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }}
            >
              {isSavingReply ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
          
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AutoReply;
