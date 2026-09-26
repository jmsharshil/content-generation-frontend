import React, { useEffect, useState, useMemo } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { MessageSquareReply, Heart, Send, AlertCircle, CheckCircle2, XCircle, History, Image, AlignLeft } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
    <div style={{
      width: '44px', height: '22px', background: checked ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
      borderRadius: '22px', position: 'relative', transition: 'all 0.3s'
    }}>
      <div style={{
        width: '18px', height: '18px', background: 'white', borderRadius: '50%',
        position: 'absolute', top: '2px', left: checked ? '24px' : '2px', transition: 'all 0.3s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }} />
    </div>
    <input type="checkbox" hidden checked={checked} onChange={onChange} />
  </label>
);

const TabButton = ({ id, activeTab, setActiveTab, icon, label, count }) => (
  <button
    onClick={() => setActiveTab(id)}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.6rem 1rem',
      background: activeTab === id ? 'rgba(59,130,246,0.15)' : 'transparent',
      color: activeTab === id ? 'var(--color-primary)' : 'var(--color-text-muted)',
      border: activeTab === id ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--color-border)',
      borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
      fontWeight: activeTab === id ? 600 : 400, transition: 'all 0.2s',
      fontFamily: 'var(--font-primary)'
    }}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span style={{
        background: activeTab === id ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
        color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.4rem',
        borderRadius: '10px', fontWeight: 600, minWidth: '20px', textAlign: 'center'
      }}>{count}</span>
    )}
  </button>
);

const RenderComment = ({ text }) => {
  if (!text) return <span>No comment text</span>;
  const match = text.match(/\[MEDIA:(.+?)\]/);
  if (match) {
    const textPart = text.replace(match[0], '').trim();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
        {textPart && <span>{textPart}</span>}
        <img src={match[1]} alt="Sticker/GIF" style={{ maxWidth: '100px', borderRadius: '8px' }} />
      </div>
    );
  }
  return <span>{text}</span>;
};

const AutomationCard = ({ icon, iconBg, title, subtitle, heartColor, checked, onToggle, textValue, onTextChange, placeholder, infoText }) => (
  <div className="glass-panel" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {title}
            {heartColor && <Heart size={14} color={heartColor} fill={heartColor} />}
          </h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{subtitle}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onToggle} />
    </div>

    <div style={{ opacity: checked ? 1 : 0.4, transition: 'opacity 0.3s', pointerEvents: checked ? 'auto' : 'none' }}>
      <label className="label">Message Template</label>
      <textarea
        className="input-field"
        rows="3"
        placeholder={placeholder}
        value={textValue}
        onChange={onTextChange}
        style={{ width: '100%', resize: 'vertical', fontSize: '0.85rem', padding: '0.75rem' }}
      />
      {infoText && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.75rem',
          padding: '0.65rem 0.85rem', borderRadius: '8px',
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)'
        }}>
          <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{infoText}</p>
        </div>
      )}
    </div>
  </div>
);

const fbIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const igIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="#E4405F" strokeWidth="2" /><circle cx="12" cy="12" r="5" stroke="#E4405F" strokeWidth="2" /><circle cx="17.5" cy="6.5" r="1.5" fill="#E4405F" /></svg>;

const PostGroupedHistory = ({ logs, logRenderer, icon, emptyMessage }) => {
  const [activePostId, setActivePostId] = useState(null);
  const [postDetailsCache, setPostDetailsCache] = useState({});

  const logsByPost = useMemo(() => {
    return logs.reduce((acc, log) => {
      const pid = log.post_id || 'Unknown Post';
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(log);
      return acc;
    }, {});
  }, [logs]);

  const postIds = Object.keys(logsByPost);

  useEffect(() => {
    if (!activePostId && postIds.length > 0) {
      setActivePostId(postIds[0]);
    }
  }, [postIds, activePostId]);

  // Fetch Post Details from new Backend Endpoint
  useEffect(() => {
    postIds.forEach(async (pid) => {
      if (pid === 'Unknown Post' || postDetailsCache[pid]) return;
      try {
        const firstLog = logsByPost[pid][0];
        const platform = firstLog?.platform || 'instagram';
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/post-details/${pid}/?platform=${platform}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Extract the image and link depending on FB or IG format
          const imageUrl = data.media_url || data.thumbnail_url || data.full_picture || data.picture;
          const linkUrl = data.permalink || data.permalink_url;
          const mediaType = data.media_type || (imageUrl?.match(/\.(mp4|webm|ogg|mov)/i) ? 'VIDEO' : 'IMAGE');
          
          setPostDetailsCache(prev => ({
            ...prev,
            [pid]: { image: imageUrl, link: linkUrl, mediaType }
          }));
        }
      } catch (e) {
        console.error("Failed to fetch post details for", pid);
      }
    });
  }, [postIds]); // Fetch whenever new post IDs appear

  if (logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.4, marginBottom: '0.75rem' }}>{icon}</div>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Swipe Swipe UI for Posts */}
      <div style={{ 
        display: 'flex', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem',
        scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', msOverflowStyle: 'none'
      }}>
        <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="hide-scroll" style={{ display: 'flex', gap: '1rem', width: 'max-content' }}>
          {postIds.map(pid => {
            const details = postDetailsCache[pid];
            return (
              <div 
                key={pid}
                onClick={() => {
                  if (activePostId === pid && details?.link) {
                    window.open(details.link, '_blank'); // Open post on double-click/tap
                  }
                  setActivePostId(pid);
                }}
                style={{
                  scrollSnapAlign: 'start', flexShrink: 0,
                  width: '140px', height: '150px', borderRadius: '12px',
                  background: activePostId === pid ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activePostId === pid ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden',
                  boxShadow: activePostId === pid ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                  position: 'relative'
                }}
              >
                {/* Thumbnail Image */}
                <div style={{ 
                  width: '100%', height: '80px', background: 'rgba(255,255,255,0.05)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderBottom: `1px solid ${activePostId === pid ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`
                }}>
                  {details?.image ? (
                    details.mediaType === 'VIDEO' || details.image.match(/\.(mp4|webm|ogg|mov)/i) ? (
                      <video src={details.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop autoPlay playsInline />
                    ) : (
                      <img src={details.image} alt="Post thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )
                  ) : (
                    pid === 'Unknown Post' || !details ? (
                      <Image size={24} color={activePostId === pid ? '#fff' : 'var(--color-text-muted)'} />
                    ) : (
                      <AlignLeft size={24} color={activePostId === pid ? '#fff' : 'var(--color-text-muted)'} />
                    )
                  )}
                </div>

                <div style={{ padding: '0.5rem', textAlign: 'center', width: '100%' }}>
                  <p style={{ margin: 0, fontSize: '0.65rem', color: activePostId === pid ? '#fff' : 'var(--color-text)', fontWeight: 600, wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {pid === 'Unknown Post' ? 'Unknown Post' : pid}
                  </p>
                  <span style={{ fontSize: '0.65rem', color: activePostId === pid ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    {logsByPost[pid].length} Logs
                  </span>
                  {details?.link && (
                    <span style={{ fontSize: '0.55rem', color: activePostId === pid ? '#fff' : 'var(--color-primary)', marginTop: '0.2rem', display: 'block', textDecoration: 'underline' }}>
                      Click again to view
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Logs List */}
      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <History size={16} color="var(--color-primary)" />
        History for {activePostId === 'Unknown Post' ? 'Unknown Post' : 'Selected Post'}
      </h4>
      
      {activePostId && logsByPost[activePostId] && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           {logsByPost[activePostId].map(log => logRenderer(log))}
        </div>
      )}
    </div>
  );
};

const AutoReply = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();

  // Facebook: Auto-reply to comments
  const [fbReplyText, setFbReplyText] = useState('');
  const [fbAutoReplyActive, setFbAutoReplyActive] = useState(false);

  // Instagram: Auto-reply to comments
  const [igReplyText, setIgReplyText] = useState('');
  const [igAutoReplyActive, setIgAutoReplyActive] = useState(false);

  // Facebook DM on Like
  const [fbDmText, setFbDmText] = useState('');
  const [fbDmOnLikeActive, setFbDmOnLikeActive] = useState(false);

  // Instagram DM on Like
  const [igDmText, setIgDmText] = useState('');
  const [igDmOnLikeActive, setIgDmOnLikeActive] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Logs
  const [autoReplyLogs, setAutoReplyLogs] = useState([]);
  const [autoDmLogs, setAutoDmLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingDmLogs, setIsLoadingDmLogs] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/auto-reply-settings/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFbReplyText(data.fb_reply_text || data.reply_text || '');
          setFbAutoReplyActive(data.fb_auto_reply_active || false);
          setIgReplyText(data.ig_reply_text || data.reply_text || '');
          setIgAutoReplyActive(data.ig_auto_reply_active || false);
          setFbDmText(data.fb_dm_text || '');
          setFbDmOnLikeActive(data.fb_dm_on_like_active || false);
          setIgDmText(data.ig_dm_text || '');
          setIgDmOnLikeActive(data.ig_dm_on_like_active || false);
        }
      } catch (error) { console.error(error); }
    };

    const fetchAutoReplyLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auto-reply-logs/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAutoReplyLogs(Array.isArray(data) ? data : (data?.results || []));
        }
      } catch (error) { console.error("Error fetching logs:", error); }
      finally { setIsLoadingLogs(false); }
    };

    const fetchDmLogs = async () => {
      setIsLoadingDmLogs(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auto-dm-logs/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAutoDmLogs(Array.isArray(data) ? data : (data?.results || []));
        }
      } catch (error) { console.error("Error fetching DM logs:", error); }
      finally { setIsLoadingDmLogs(false); }
    };

    fetchSettings();
    fetchAutoReplyLogs();
    fetchDmLogs();
  }, []);

  const saveSettings = async (overrides = {}) => {
    setIsSaving(true);
    try {
      const payload = {
        fb_reply_text: fbReplyText,
        fb_auto_reply_active: fbAutoReplyActive,
        ig_reply_text: igReplyText,
        ig_auto_reply_active: igAutoReplyActive,
        fb_dm_text: fbDmText,
        fb_dm_on_like_active: fbDmOnLikeActive,
        ig_dm_text: igDmText,
        ig_dm_on_like_active: igDmOnLikeActive,
        ...overrides
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/auto-reply-settings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) showToast('Settings saved!', 'success');
      else showToast('Failed to save settings', 'error');
    } catch (error) {
      showToast('Network error', 'error');
    } finally {
      setIsSaving(false);
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
    <SidebarLayout title="Automation Settings">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <TabButton id="settings" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MessageSquareReply size={16} />} label="Settings" />
          <TabButton id="comment-history" activeTab={activeTab} setActiveTab={setActiveTab} icon={<History size={16} />} label="Reply History" count={autoReplyLogs.length} />
          <TabButton id="dm-history" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Send size={16} />} label="DM History" count={autoDmLogs.length} />
        </div>

        {/* ==================== SETTINGS TAB ==================== */}
        {activeTab === 'settings' && (
          <>
            {/* Section Header: Auto-Reply to Comments */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <MessageSquareReply size={18} color="var(--color-primary)" />
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text)' }}>Auto-Reply to Comments</h2>
            </div>

            {/* Facebook Auto-Reply */}
            <AutomationCard
              icon={fbIcon}
              iconBg="linear-gradient(135deg, rgba(24,119,242,0.15), rgba(59,130,246,0.1))"
              title="Facebook Auto-Reply"
              subtitle="Reply to comments on your Facebook Page posts"
              checked={fbAutoReplyActive}
              onToggle={(e) => {
                const checked = e.target.checked;
                setFbAutoReplyActive(checked);
                saveSettings({ fb_auto_reply_active: checked });
              }}
              textValue={fbReplyText}
              onTextChange={(e) => setFbReplyText(e.target.value)}
              placeholder="e.g. Thanks for your comment! We appreciate your feedback &#128588;"
            />

            {/* Instagram Auto-Reply */}
            <AutomationCard
              icon={igIcon}
              iconBg="linear-gradient(135deg, rgba(228,64,95,0.15), rgba(252,175,69,0.1))"
              title="Instagram Auto-Reply"
              subtitle="Reply to comments on your Instagram posts"
              checked={igAutoReplyActive}
              onToggle={(e) => {
                const checked = e.target.checked;
                setIgAutoReplyActive(checked);
                saveSettings({ ig_auto_reply_active: checked });
              }}
              textValue={igReplyText}
              onTextChange={(e) => setIgReplyText(e.target.value)}
              placeholder="e.g. Hey! Thanks for commenting &#10084;&#65039; We'll get back to you soon!"
            />

            {/* Section Header: DM on Comment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquareReply size={18} color="#3b82f6" />
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text)' }}>Auto DM on Comment</h2>
            </div>

            {/* Facebook DM on Comment */}
            <AutomationCard
              icon={fbIcon}
              iconBg="linear-gradient(135deg, rgba(24,119,242,0.15), rgba(59,130,246,0.1))"
              title="Facebook Auto-DM (On Comment)"
              subtitle="Send a private DM to users who comment on your Facebook posts"
              heartColor="#3b82f6"
              checked={fbDmOnLikeActive}
              onToggle={(e) => {
                const checked = e.target.checked;
                setFbDmOnLikeActive(checked);
                saveSettings({ fb_dm_on_like_active: checked });
              }}
              textValue={fbDmText}
              onTextChange={(e) => setFbDmText(e.target.value)}
              placeholder="e.g. Hey! Thanks for your comment! Here is the link..."
            />

            {/* Instagram DM on Comment */}
            <AutomationCard
              icon={igIcon}
              iconBg="linear-gradient(135deg, rgba(228,64,95,0.15), rgba(252,175,69,0.1))"
              title="Instagram Auto-DM (On Comment)"
              subtitle="Send a private DM to users who comment on your posts"
              heartColor="#E4405F"
              checked={igDmOnLikeActive}
              onToggle={(e) => {
                const checked = e.target.checked;
                setIgDmOnLikeActive(checked);
                saveSettings({ ig_dm_on_like_active: checked });
              }}
              textValue={igDmText}
              onTextChange={(e) => setIgDmText(e.target.value)}
              placeholder="e.g. Thanks for your comment! Here is the link you requested..."
            />

            {/* Save All Button */}
            <button
              className="btn btn-primary"
              onClick={() => saveSettings()}
              disabled={isSaving}
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem', borderRadius: '10px' }}
            >
              {isSaving ? 'Saving...' : 'Save All Settings'}
            </button>
          </>
        )}

        {/* ==================== COMMENT REPLY HISTORY TAB ==================== */}
        {activeTab === 'comment-history' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquareReply size={20} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Comment Auto-Reply History</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{autoReplyLogs.length} replies sent</p>
              </div>
            </div>

            {isLoadingLogs ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Loading...</div>
            ) : autoReplyLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <MessageSquareReply size={32} color="var(--color-text-muted)" style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>No auto-replies sent yet.</p>
              </div>
            ) : (
              <PostGroupedHistory 
                logs={autoReplyLogs}
                icon={<MessageSquareReply size={32} />}
                emptyMessage="No auto-replies sent yet."
                logRenderer={(log) => (
                  <div key={log.id || Math.random()} style={{
                    padding: '0.85rem 1rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                          background: log.platform?.toLowerCase() === 'facebook' ? 'rgba(24,119,242,0.15)' : 'rgba(228,64,95,0.15)',
                          color: log.platform?.toLowerCase() === 'facebook' ? '#1877F2' : '#E4405F'
                        }}>
                          {log.platform?.toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{log.commenter_name}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(log.created_at)}</span>
                    </div>
                    <div style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <RenderComment text={log.comment_text} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MessageSquareReply size={12} /> {log.reply_text}
                    </p>
                  </div>
                )}
              />
            )}
          </div>
        )}

        {/* ==================== DM HISTORY TAB ==================== */}
        {activeTab === 'dm-history' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(252,175,69,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Auto DM History</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{autoDmLogs.length} DMs sent on likes</p>
              </div>
            </div>

            {isLoadingDmLogs ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Loading...</div>
            ) : autoDmLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Heart size={32} color="var(--color-text-muted)" style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>No auto DMs sent yet.</p>
                <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0', fontSize: '0.8rem' }}>Enable "DM on Like" in Settings and wait for likes!</p>
              </div>
            ) : (
              <PostGroupedHistory 
                logs={autoDmLogs}
                icon={<Heart size={32} />}
                emptyMessage="No auto DMs sent yet."
                logRenderer={(log) => (
                  <div key={log.id || Math.random()} style={{
                    padding: '0.85rem 1rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                          background: log.platform?.toLowerCase() === 'facebook' ? 'rgba(24,119,242,0.15)' : 'rgba(228,64,95,0.15)',
                          color: log.platform?.toLowerCase() === 'facebook' ? '#1877F2' : '#E4405F'
                        }}>
                          {log.platform?.toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{log.recipient_name || 'Unknown'}</span>
                        {log.status === 'sent' ? (
                          <CheckCircle2 size={14} color="#10b981" />
                        ) : (
                          <XCircle size={14} color="#ef4444" />
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(log.created_at)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      {log.trigger_type === 'comment' ? (
                        <MessageSquareReply size={12} color="#3b82f6" />
                      ) : (
                        <Heart size={12} color="#ef4444" fill="#ef4444" />
                      )}
                      
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {log.trigger_type === 'comment' ? (log.comment_text ? <RenderComment text={log.comment_text} /> : 'Commented on your post') : 'Liked your post'}
                      </div>
                      
                      {log.trigger_type && (
                        <span style={{ 
                          padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem',
                          background: log.trigger_type === 'comment' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', 
                          color: log.trigger_type === 'comment' ? '#3b82f6' : '#ef4444', 
                          fontWeight: 500
                        }}>
                          {log.trigger_type}
                        </span>
                      )}
                      
                      {log.post_id && (
                        <span style={{ 
                          fontSize: '0.7rem', color: 'var(--color-text-muted)', opacity: 0.7, 
                          marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', 
                          padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' 
                        }}>
                          Post ID: {log.post_id}
                        </span>
                      )}
                    </div>
                    
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Send size={12} /> {log.dm_text}
                    </p>
                    {log.status === 'failed' && log.error_message && (
                      <div style={{
                        marginTop: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '6px',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                        fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <AlertCircle size={12} />
                        {log.error_message}
                      </div>
                    )}
                  </div>
                )}
              />
            )}
          </div>
        )}

      </div>
    </SidebarLayout>
  );
};

export default AutoReply;
