import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Sparkles, CheckSquare, Square, ThumbsUp, ThumbsDown, Edit3, Send, Hash, RefreshCw, Copy, Search, Filter, Eye, X } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { useLocation } from 'react-router-dom';
import Skeleton from '../components/Skeleton';

const History = () => {
  const { showLoader, hideLoader } = useLoader();
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
  const [filterStatus, setFilterStatus] = useState('PUBLISHED');

  useEffect(() => {
    if (location.state?.topic) {
      setTopic(location.state.topic);
    }
  }, [location.state]);

  const fetchPosts = async () => {
    setIsFetchingPosts(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/?${params.toString()}`, {
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
    const delayDebounceFn = setTimeout(() => {
      fetchPosts();
    }, 500); // debounce search
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filterStatus]);

  const handleGenerate = async () => {
    if (!topic.trim()) { showToast('Please enter a topic.', 'info'); return; }
    showLoader('Generating with AI...');
    try {
      // Assuming backend might take tone in future or already does
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ topic })
      });
      if (response.ok) {
        hideLoader(); showToast('Post generated!', 'success'); setTopic(''); fetchPosts();
      } else {
        hideLoader(); showToast('Failed to generate.', 'error');
      }
    } catch (error) { hideLoader(); showToast('Network error.', 'error'); }
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


  return (
    <>
      <SidebarLayout title="Post History">

      <div>

        {/* Right: Results */}
        <div style={{ minWidth: 0 }}>
          <div className="studio-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px', paddingRight: '12px', width: '200px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-glass-border)' }}
                />
              </div>

              <button className="btn btn-secondary" onClick={fetchPosts} title="Refresh" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-glass-border)' }}>
                <RefreshCw size={14} color="var(--color-text-muted)" />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isFetchingPosts ? (
              // Skeletons
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass-panel" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', alignItems: 'center' }}>
                      <Skeleton type="circle" width="24px" height="24px" />
                      <div style={{ flex: 1 }}>
                        <Skeleton type="text" width="40%" height="0.8rem" />
                        <Skeleton type="text" width="20%" height="0.6rem" />
                      </div>
                    </div>
                    <Skeleton type="text" width="100%" height="0.8rem" />
                    <Skeleton type="text" width="90%" height="0.8rem" />
                    <Skeleton type="text" width="95%" height="0.8rem" />
                  </div>
                ))}
              </>
            ) : posts.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '2rem' }}>
                No posts found.
              </div>
            ) : posts.map(post => {
              const statusColors = {
                'DRAFT': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
                'REVIEW': { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
                'PUBLISHED': { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
                'FAILED': { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
              };
              const sc = statusColors[post.status] || statusColors['DRAFT'];
              const timeAgo = post.created_at ? new Date(post.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div
                  key={post.id}
                  style={{
                    background: post.selected ? 'rgba(59,130,246,0.04)' : 'var(--color-glass)',
                    border: `1px solid ${post.selected ? 'rgba(59,130,246,0.25)' : 'var(--color-glass-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    transition: 'all var(--transition-fast)',
                    boxShadow: post.selected ? '0 0 0 1px rgba(59,130,246,0.15)' : '0 1px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Post Header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', borderBottom: '1px solid var(--color-glass-border)',
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {post.topic || 'Published Post'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          {timeAgo}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: '0.15rem 0.5rem', background: sc.bg, color: sc.text,
                        borderRadius: '10px', border: `1px solid ${sc.border}`
                      }}>
                        {post.status}
                      </span>
                    </div>
                  </div>
                  {/* Minimal Post Actions */}
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                      {post.generated_content ? post.generated_content.substring(0, 90) + '...' : 'No content generated'}
                    </p>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setViewingPost(post)}
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', borderRadius: '20px', background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: 'none' }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      </SidebarLayout>
      {/* View Post Modal */}
      {viewingPost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
            background: 'var(--color-bg-secondary)', padding: 0,
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--color-border)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {/* Platform Icon Based on Backend Data or Dropdown */}
                {(() => {
                  const displayPlatform = (viewingPost.status === 'PUBLISHED' && viewingPost.published_platform) 
                    ? viewingPost.published_platform.toLowerCase() 
                    : publishPlatform;
                    
                  if (displayPlatform === 'instagram') {
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
                    {viewingPost.status === 'PUBLISHED' && viewingPost.published_platform 
                      ? `Published to ${viewingPost.published_platform}` 
                      : `Ready for ${publishPlatform}`}
                  </div>
                </div>
              </div>
              <button onClick={() => { setViewingPost(null); setEditingId(null); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
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
                  <p style={{ margin: 0, lineHeight: '1.7', fontSize: '0.95rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1.5rem' }}>
                    {viewingPost.generated_content}
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
