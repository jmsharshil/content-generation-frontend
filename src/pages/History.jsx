import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Sparkles, CheckSquare, Square, ThumbsUp, ThumbsDown, Edit3, Send, Hash, RefreshCw, Copy, Search, Filter, Eye, X, Clock } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { useLocation } from 'react-router-dom';
import Skeleton from '../components/Skeleton';

const History = () => {
  const { showLoader, hideLoader, updateLoader } = useLoader();
  const { showToast } = useToast();
  const location = useLocation();

  // Prompt Engine State
  const [topic, setTopic] = useState('');





  // Posts State
  const [posts, setPosts] = useState([]);
  const [isFetchingPosts, setIsFetchingPosts] = useState(true);
  const [viewingPost, setViewingPost] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMediaUrls, setEditMediaUrls] = useState('');

  // Publish & Ad Settings
  const [publishPlatform, setPublishPlatform] = useState('facebook');
  const [promoteAsAd, setPromoteAsAd] = useState(false);
  const [adBudget, setAdBudget] = useState(10.00);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (location.state?.topic) {
      setTopic(location.state.topic);
    }
  }, [location.state]);

  const fetchPosts = async () => {
    setIsFetchingPosts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        const postsData = data.results || data; // Handle pagination or flat array
        setPosts(postsData.map(post => ({ ...post, selected: false })));
      }
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setIsFetchingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Real-time client-side search filter across topic, caption content, and platform
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const topicMatch = post.topic && post.topic.toLowerCase().includes(query);
    const contentMatch = post.generated_content && post.generated_content.toLowerCase().includes(query);
    const platformMatch = post.published_platform && post.published_platform.toLowerCase().includes(query);
    const statusMatch = post.status && post.status.toLowerCase().includes(query);
    return topicMatch || contentMatch || platformMatch || statusMatch;
  });

  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please enter a topic.', 'info'); return; }
    showLoader('Generating with AI...', 10, 'Analyzing topic & drafting content...');
    
    let currentProgress = 10;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 8 + 3;
      if (currentProgress > 92) currentProgress = 92;
      
      let step = 'Synthesizing creative angles...';
      if (currentProgress > 65) step = 'Crafting captions and hashtags...';
      else if (currentProgress > 35) step = 'Tailoring brand tone...';
      
      updateLoader({ progress: currentProgress, subText: step });
    }, 400);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ topic })
      });
      clearInterval(progressInterval);
      if (response.ok) {
        updateLoader({ progress: 100, subText: 'Done!' });
        setTimeout(() => {
          hideLoader(); showToast('Post generated!', 'success'); setTopic(''); fetchPosts();
        }, 300);
      } else {
        hideLoader(); showToast('Failed to generate.', 'error');
      }
    } catch (error) { 
      clearInterval(progressInterval);
      hideLoader(); showToast('Network error.', 'error'); 
    }
  };

  const handlePublish = async () => {
    const selected = posts.filter(p => p.selected);
    if (selected.length === 0) { showToast('Select at least one post.', 'info'); return; }
    showLoader(`Publishing to ${publishPlatform}...`);
    try {
      for (const post of selected) {
        // 1. Publish Post
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post.id}/publish/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: publishPlatform })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to publish');
        }

        // 2. Create Ad if toggled
        if (promoteAsAd) {
          showLoader('Creating Ad Campaign...');
          const adRes = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post.id}/create-ad/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ budget: adBudget })
          });
          if (!adRes.ok) {
            const adErrData = await adRes.json();
            throw new Error(adErrData.error || 'Failed to create ad');
          }
        }
      }
      hideLoader(); showToast(`Success! ${promoteAsAd ? 'Published and Ad created.' : 'Published.'}`, 'success'); fetchPosts();
    } catch (error) { hideLoader(); showToast(error.message || 'Error processing request.', 'error'); }
  };

  const handleEditSave = async (id) => {
    try {
      const urlsArray = editMediaUrls.split(',').map(u => u.trim()).filter(Boolean);
      const payload = { generated_content: editContent, status: 'REVIEW' };

      if (urlsArray.length > 1) {
        payload.media_urls = urlsArray;
      } else if (urlsArray.length === 1) {
        payload.media_url = urlsArray[0];
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) { showToast('Updated.', 'success'); setEditingId(null); fetchPosts(); }
      else { showToast('Failed.', 'error'); }
    } catch (error) { showToast('Network error.', 'error'); }
  };

  const toggleSelect = (id) => {
    setPosts(posts.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!', 'success');
  };


  const formatContentLineByLine = (text) => {
    if (!text) return '';
    if (text.split('\n\n').length > 2) return text;
    return text
      .replace(/([.?!])\s+(?=[A-Z])/g, "$1\n\n")
      .replace(/([.?!])\s+(?=[\uD83C-\uDBFF\u2700-\u27BF])/g, "$1\n\n")
      .replace(/([\uD83C-\uDBFF\u2700-\u27BF]+)\s+(?=[A-Z])/g, "$1\n\n")
      .replace(/\s+(?=#)/g, "\n\n")
      .replace(/\n{3,}/g, "\n\n");
  };

  // Stats calculation
  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter(p => p.status === 'DRAFT' || p.status === 'REVIEW').length;

  return (
    <>
      <SidebarLayout title="Post History">

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Top Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--color-bg-secondary)',
          padding: '0.85rem 1.25rem',
          borderRadius: '14px',
          border: '1px solid var(--color-glass-border)'
        }}>
          {/* Full Search Bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: '450px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by topic, caption text, or platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', paddingRight: searchQuery ? '32px' : '14px', width: '100%', fontSize: '0.85rem', height: '38px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex'
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {filteredPosts.length} post{filteredPosts.length === 1 ? '' : 's'}
            </span>
            <button className="btn btn-secondary" onClick={fetchPosts} title="Refresh posts" style={{ padding: '0.45rem', height: '38px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
              <RefreshCw size={15} color="var(--color-text-muted)" />
            </button>
          </div>
        </div>

        {/* Posts Feed Grid / Flow */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1rem'
        }}>
          {isFetchingPosts ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel" style={{ padding: '1rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton type="circle" width="32px" height="32px" />
                  <Skeleton type="text" width="60px" height="18px" />
                </div>
                <Skeleton type="rect" width="100%" height="160px" style={{ borderRadius: '10px' }} />
                <Skeleton type="text" width="90%" height="0.8rem" />
                <Skeleton type="text" width="60%" height="0.8rem" />
              </div>
            ))
          ) : filteredPosts.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', padding: '3.5rem 1.5rem', gridColumn: '1 / -1', borderRadius: '16px' }}>
              <Sparkles size={32} color="var(--color-primary)" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>
                {searchQuery ? `No posts matching "${searchQuery}"` : 'No posts found.'}
              </p>
            </div>
          ) : filteredPosts.map(post => {
            const statusColors = {
              'DRAFT': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
              'REVIEW': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
              'APPROVED': { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.4)' },
              'PUBLISHED': { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.35)' },
              'FAILED': { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
            };
            const sc = statusColors[post.status] || statusColors['DRAFT'];
            const timeAgo = post.created_at ? new Date(post.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
            
            const isApproved = post.status === 'APPROVED';
            const isPublished = post.status === 'PUBLISHED';
            const scheduledTimeStr = post.scheduled_at 
              ? new Date(post.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
              : null;
            const publishedTimeStr = post.published_at 
              ? new Date(post.published_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
              : null;

            // When a post is scheduled and published, prioritize showing its scheduled time
            const displayTime = isApproved
              ? (scheduledTimeStr || timeAgo)
              : (isPublished && (scheduledTimeStr || publishedTimeStr)
                  ? (scheduledTimeStr || publishedTimeStr)
                  : timeAgo);
            
            const mediaSrc = post.media_url 
              ? (post.media_url.startsWith('http') ? post.media_url : `${import.meta.env.VITE_API_URL}${post.media_url}`)
              : (post.media_urls && post.media_urls.length > 0 ? (post.media_urls[0].startsWith('http') ? post.media_urls[0] : `${import.meta.env.VITE_API_URL}${post.media_urls[0]}`) : null);

            const isVideo = mediaSrc && mediaSrc.match(/\.(mp4|webm|ogg)$/i);
            const platformName = post.published_platform ? post.published_platform.toLowerCase() : 'social';

            return (
              <div
                key={post.id}
                className="hover-card animate-fade-in"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: isApproved ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--color-glass-border)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isApproved ? '0 4px 18px rgba(59, 130, 246, 0.12)' : '0 4px 16px rgba(0,0,0,0.06)'
                }}
              >
                {/* Post Card Header */}
                <div style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--color-glass-border)',
                  background: isApproved ? 'rgba(59, 130, 246, 0.04)' : 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {platformName === 'both' ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#1877F2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          zIndex: 2
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </div>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          marginLeft: '-8px',
                          zIndex: 1,
                          border: '2px solid var(--color-bg-secondary)'
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </div>
                      </div>
                    ) : platformName === 'instagram' ? (
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                      </div>
                    ) : (
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#1877F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>
                        {post.topic || 'Social Post'}
                      </h4>
                      {(isApproved || (isPublished && (post.scheduled_at || post.published_at))) ? (
                        <span style={{ 
                          fontSize: '0.68rem', 
                          color: isApproved ? '#60a5fa' : 'var(--color-text-muted)', 
                          fontWeight: isApproved ? 500 : 400, 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '3px', 
                          marginTop: '2px' 
                        }}>
                          {isApproved && <Clock size={11} />}
                          {displayTime}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                          {timeAgo}
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    padding: '0.18rem 0.55rem',
                    background: sc.bg,
                    color: sc.text,
                    borderRadius: '20px',
                    border: `1px solid ${sc.border}`
                  }}>
                    {post.status}
                  </span>
                </div>

                {/* Media Preview if exists - Proper Full Aspect Ratio */}
                {mediaSrc && (
                  <div 
                    onClick={() => setViewingPost(post)}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      background: 'rgba(0, 0, 0, 0.25)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid var(--color-glass-border)'
                    }}
                  >
                    {isVideo ? (
                      <video src={mediaSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted />
                    ) : (
                      <img src={mediaSrc} alt="Post Media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                  </div>
                )}

                {/* Caption / Content preview */}
                <div 
                  onClick={() => setViewingPost(post)}
                  style={{
                    padding: '0.85rem 1rem',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer'
                  }}
                >
                  <p style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    color: 'var(--color-text)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: mediaSrc ? 3 : 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {post.generated_content || 'No content generated'}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div style={{
                  padding: '0.65rem 1rem',
                  borderTop: '1px solid var(--color-glass-border)',
                  background: 'rgba(0,0,0,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => handleCopy(post.generated_content)}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: '6px' }}
                    title="Copy text"
                  >
                    <Copy size={12} /> Copy
                  </button>

                  <button
                    onClick={() => setViewingPost(post)}
                    className="btn btn-primary"
                    style={{
                      padding: '0.3rem 0.85rem',
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Eye size={13} /> View Post
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      </SidebarLayout>
      {/* View Post Modal */}
      {viewingPost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
          padding: '3rem 1rem 1.5rem',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }} onClick={() => { setViewingPost(null); setEditingId(null); }}>
          <div className="glass-panel animate-slide-up hide-scrollbar" style={{
            width: '100%', maxWidth: '580px', maxHeight: '86vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: 'var(--color-bg-secondary)', padding: 0,
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)', border: '1px solid var(--color-glass-border)'
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {/* Platform Icon Based on Backend Data or Dropdown */}
                {(() => {
                  const displayPlatform = (viewingPost.status === 'PUBLISHED' && viewingPost.published_platform) 
                    ? viewingPost.published_platform.toLowerCase() 
                    : publishPlatform;
                    
                  if (displayPlatform === 'both') {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(24, 119, 242, 0.4)', zIndex: 2 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </div>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(220, 39, 67, 0.4)', marginLeft: '-10px', zIndex: 1, border: '2px solid var(--color-bg-secondary)' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </div>
                      </div>
                    );
                  } else if (displayPlatform === 'instagram') {
                    return (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(220, 39, 67, 0.4)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                      </div>
                    );
                  } else {
                    return (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1877F2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(24, 119, 242, 0.4)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                      </div>
                    );
                  }
                })()}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>{viewingPost.topic || 'Review Post'}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                    {viewingPost.status === 'PUBLISHED'
                      ? (viewingPost.scheduled_at 
                          ? `Published (${viewingPost.published_platform || 'Social'}) • Scheduled: ${new Date(viewingPost.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                          : (viewingPost.published_at 
                              ? `Published (${viewingPost.published_platform || 'Social'}) • ${new Date(viewingPost.published_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                              : `Published to ${viewingPost.published_platform || 'Social'}`))
                      : (viewingPost.status === 'APPROVED' && viewingPost.scheduled_at)
                        ? `Scheduled for: ${new Date(viewingPost.scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        : `Ready for ${publishPlatform}`}
                  </div>
                </div>
              </div>
              <button onClick={() => { setViewingPost(null); setEditingId(null); }} style={{ background: 'var(--color-bg-tertiary)', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="hide-scrollbar" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {editingId === viewingPost.id ? (
                <div>
                  <label className="label">Post Content</label>
                  <textarea className="input-field" rows="8" value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ width: '100%', resize: 'vertical', marginBottom: '0.2rem' }} />
                  <div style={{ fontSize: '0.65rem', color: editContent.length > 2000 ? 'var(--color-danger)' : 'var(--color-text-muted)', textAlign: 'right', marginBottom: '1rem' }}>{editContent.length} chars</div>
                  
                  <label className="label">Image URLs</label>
                  <textarea className="input-field" rows="2" placeholder="Image/Media URLs (comma separated for carousel)" value={editMediaUrls} onChange={(e) => setEditMediaUrls(e.target.value)} style={{ width: '100%', resize: 'vertical', marginBottom: '1.5rem', fontSize: '0.75rem' }} />
                  
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={async () => { 
                      await handleEditSave(viewingPost.id); 
                      setViewingPost({...viewingPost, generated_content: editContent, media_urls: editMediaUrls.split(',').map(u=>u.trim()).filter(Boolean)}); 
                    }}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Metadata Tags */}
                  {(viewingPost.category || viewingPost.fb_objective || viewingPost.insta_objective) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem' }}>
                      {viewingPost.category && (
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', fontWeight: 500 }}>
                          Category: {viewingPost.category}
                        </span>
                      )}
                      {viewingPost.fb_objective && (
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(24,119,242,0.12)', color: '#38bdf8', border: '1px solid rgba(24,119,242,0.25)', fontWeight: 500 }}>
                          FB: {viewingPost.fb_objective}
                        </span>
                      )}
                      {viewingPost.insta_objective && (
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(220,39,67,0.12)', color: '#f472b6', border: '1px solid rgba(220,39,67,0.25)', fontWeight: 500 }}>
                          IG: {viewingPost.insta_objective}
                        </span>
                      )}
                    </div>
                  )}

                  <p style={{ margin: 0, lineHeight: '1.7', fontSize: '0.95rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1.5rem' }}>
                    {formatContentLineByLine(viewingPost.generated_content)}
                  </p>
                  
                  {viewingPost.media_url && (
                    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-glass-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                      {viewingPost.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={viewingPost.media_url.startsWith('http') ? viewingPost.media_url : `${import.meta.env.VITE_API_URL}${viewingPost.media_url}`}
                          controls
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      ) : (
                        <img
                          src={viewingPost.media_url.startsWith('http') ? viewingPost.media_url : `${import.meta.env.VITE_API_URL}${viewingPost.media_url}`}
                          alt="AI Generated"
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!editingId && (
              <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.15)', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: 'none' }} onClick={() => { 
                    setEditingId(viewingPost.id); 
                    setEditContent(viewingPost.generated_content);
                    const urls = viewingPost.media_urls ? viewingPost.media_urls.join(',\n') : (viewingPost.media_url || '');
                    setEditMediaUrls(urls);
                  }}>
                    <Edit3 size={14} /> Edit Content
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleCopy(viewingPost.generated_content)}>
                    <Copy size={14} /> Copy Text
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {viewingPost.generated_content?.length || 0} chars
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      

    
    </>

  );
};

export default History;

