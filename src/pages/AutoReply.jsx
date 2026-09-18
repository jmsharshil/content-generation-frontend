import React, { useEffect, useState } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { MessageSquareReply, History } from 'lucide-react';

const AutoReply = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();
  
  const [autoReplyText, setAutoReplyText] = useState('');
  const [isAutoReplyActive, setIsAutoReplyActive] = useState(false);
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [autoReplyLogs, setAutoReplyLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

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
    
    const fetchAutoReplyLogs = async () => {
      setIsLoadingLogs(true);
      try {
        // Attempting to fetch logs
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auto-reply-logs/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAutoReplyLogs(data);
        }
      } catch (error) { 
        console.error("Error fetching logs:", error); 
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAutoReply();
    fetchAutoReplyLogs();
  }, []);

  const saveAutoReply = async (activeState) => {
    const isActiveToSave = typeof activeState === 'boolean' ? activeState : isAutoReplyActive;
    setIsSavingReply(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/auto-reply-settings/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` 
        },
        body: JSON.stringify({ reply_text: autoReplyText, is_active: isActiveToSave })
      });
      if (res.ok) showToast('Auto-Reply settings saved!', 'success');
      else showToast('Failed to save settings', 'error');
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsSavingReply(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <SidebarLayout title="Auto-Reply Settings">
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Settings Panel */}
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
            
            <button 
              onClick={() => setShowHistory(!showHistory)}
              style={{ 
                background: showHistory ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', 
                color: 'white', border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              <History size={16} /> 
              <span style={{ fontSize: '0.9rem' }}>History</span>
            </button>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: '1rem' }}>
              <div style={{ 
                width: '48px', height: '24px', background: isAutoReplyActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                borderRadius: '24px', position: 'relative', transition: 'all 0.3s'
              }}>
                <div style={{
                  width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                  position: 'absolute', top: '2px', left: isAutoReplyActive ? '26px' : '2px', transition: 'all 0.3s'
                }} />
              </div>
              <input 
                type="checkbox" 
                hidden 
                checked={isAutoReplyActive} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsAutoReplyActive(checked);
                  saveAutoReply(checked);
                }} 
              />
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

        {/* History Panel */}
        {showHistory && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <History size={20} color="var(--color-primary)" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Auto-Reply History</h2>
          </div>

          {isLoadingLogs ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              Loading history...
            </div>
          ) : (!Array.isArray(autoReplyLogs) && !autoReplyLogs?.results) || (Array.isArray(autoReplyLogs) ? autoReplyLogs.length === 0 : autoReplyLogs.results?.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <History size={32} color="var(--color-text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No auto-replies have been sent yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Platform</th>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Comment</th>
                    <th style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(autoReplyLogs) ? autoReplyLogs : (autoReplyLogs?.results || [])).map((log) => (
                    <tr key={log.id || Math.random()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {log.platform?.toLowerCase() === 'facebook' ? (
                            <span style={{ color: '#1877F2', fontWeight: 'bold' }}>FB</span>
                          ) : (
                            <span style={{ color: '#E4405F', fontWeight: 'bold' }}>IG</span>
                          )}
                          <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>{log.platform}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                        {log.commenter_name}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.comment_text}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MessageSquareReply size={12} /> {log.reply_text}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

      </div>
    </SidebarLayout>
  );
};

export default AutoReply;

