import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Sparkles, CheckSquare, Square, ThumbsUp, ThumbsDown, Edit3, Send, Hash, RefreshCw, Copy, Search, Filter } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const ContentStudio = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();
  
  // Prompt Engine State
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  
  // Posts State
  const [posts, setPosts] = useState([]);
  const [isFetchingPosts, setIsFetchingPosts] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMediaUrls, setEditMediaUrls] = useState('');
  
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

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
        body: JSON.stringify({ topic, tone }) 
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
    showLoader('Publishing to Meta...');
    try {
      for (const post of selected) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${post.id}/publish/`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (!res.ok) throw new Error('Failed');
      }
      hideLoader(); showToast('Published!', 'success'); fetchPosts();
    } catch (error) { hideLoader(); showToast('Error publishing.', 'error'); }
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
    <SidebarLayout title="Content Studio">
      
      <div className="studio-grid" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem' }}>
        
        {/* Left: Prompt Engine */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={15} color="var(--color-primary)" />
            <h3 style={{ margin: 0 }}>AI Prompt Engine</h3>
          </div>
          
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem', lineHeight: '1.5' }}>
            Describe the topic. AI will use your <b>Brand Knowledge Base</b> to match your tone.
          </p>

          <label className="label">Topic</label>
          <div style={{ position: 'relative' }}>
            <textarea 
              className="input-field" rows="4" 
              placeholder="e.g., A promotional series for our new AI feature..."
              value={topic} onChange={(e) => setTopic(e.target.value)}
              style={{ resize: 'vertical', marginBottom: '0.2rem', width: '100%' }}
            />
            <div style={{ fontSize: '0.65rem', color: topic.length > 500 ? 'var(--color-danger)' : 'var(--color-text-muted)', textAlign: 'right', marginBottom: '0.5rem' }}>
              {topic.length} / 500
            </div>
          </div>
          
          <label className="label">Tone</label>
          <select 
            className="input-field"
            value={tone} onChange={(e) => setTone(e.target.value)}
            style={{ marginBottom: '0.75rem', width: '100%' }}
          >
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Witty">Witty</option>
            <option value="Bold">Bold</option>
          </select>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label">Quick Prompts</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {['Product Launch', 'Hiring Post', 'Tips & Tricks'].map(tag => (
                <span key={tag} style={{ 
                  fontSize: '0.7rem', padding: '0.2rem 0.55rem', 
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                  borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.15s',
                  color: 'var(--color-text-muted)'
                }}
                onClick={() => setTopic(tag)}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                >+ {tag}</span>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }} onClick={handleGenerate}>
            <Sparkles size={14} /> Generate
          </button>
        </div>

        {/* Right: Results */}
        <div style={{ minWidth: 0 }}>
          <div className="studio-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Review & Approve</h2>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Select posts to publish to Meta.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Search & Filter */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', color: 'var(--color-text-muted)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '28px', padding: '0.4rem 0.4rem 0.4rem 28px', width: '150px', fontSize: '0.75rem' }} 
                />
              </div>
              <select 
                className="input-field" 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '0.4rem', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Drafts</option>
                <option value="REVIEW">Review</option>
                <option value="PUBLISHED">Published</option>
              </select>

              <button className="btn btn-secondary" onClick={fetchPosts} title="Refresh"><RefreshCw size={13} /></button>
              <button className="btn btn-primary" onClick={handlePublish}><Send size={13} /> Publish</button>
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
                    padding: '0.6rem 1rem', borderBottom: '1px solid var(--color-border)',
                    background: 'rgba(0,0,0,0.15)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ cursor: 'pointer', display: 'flex' }} onClick={() => toggleSelect(post.id)}>
                        {post.selected ? <CheckSquare size={15} color="var(--color-primary)" /> : <Square size={15} color="var(--color-text-muted)" />}
                      </div>
                      
                      {/* Facebook icon circle */}
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>f</span>
                      </div>
                      
                      <div>
                        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)' }}>
                          {post.topic || 'Untitled Post'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
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

                  {/* Post Content */}
                  <div style={{ padding: '0.85rem 1rem' }}>
                    {editingId === post.id ? (
                      <div>
                        <textarea className="input-field" rows="4" value={editContent} onChange={(e) => setEditContent(e.target.value)}
                          style={{ width: '100%', resize: 'vertical', marginBottom: '0.2rem' }} />
                        <div style={{ fontSize: '0.65rem', color: editContent.length > 2000 ? 'var(--color-danger)' : 'var(--color-text-muted)', textAlign: 'right', marginBottom: '0.5rem' }}>
                          {editContent.length} chars
                        </div>
                        <textarea className="input-field" rows="2" placeholder="Image/Media URLs (comma separated for carousel)" value={editMediaUrls} onChange={(e) => setEditMediaUrls(e.target.value)}
                          style={{ width: '100%', resize: 'vertical', marginBottom: '0.5rem', fontSize: '0.75rem' }} />
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => handleEditSave(post.id)}>Save</button>
                          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ 
                        margin: 0, lineHeight: '1.6', fontSize: '0.8rem', color: 'var(--color-text)',
                        wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                      }}>
                        {post.generated_content}
                      </p>
                    )}
                  </div>

                  {/* Post Footer */}
                  <div style={{ 
                    display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem',
                    borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.08)',
                    flexWrap: 'wrap', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { 
                          setEditingId(post.id); 
                          setEditContent(post.generated_content);
                          const urls = post.media_urls ? post.media_urls.join(',\n') : (post.media_url || '');
                          setEditMediaUrls(urls);
                        }}
                        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Edit3 size={12} color="var(--color-primary)" /> Edit
                      </button>
                      <button onClick={() => handleCopy(post.generated_content)}
                        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)', transition: 'all 0.15s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Copy size={12} color="var(--color-secondary)" /> Copy
                      </button>
                    </div>
                    
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                      {post.generated_content?.length || 0} chars
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .studio-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </SidebarLayout>
  );
};

export default ContentStudio;
