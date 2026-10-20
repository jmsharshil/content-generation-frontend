import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Sparkles, Calendar as CalendarIcon, Check, Clock, Copy, X, Edit2, Image as ImageIcon, Video as VideoIcon, List, Send } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';

const ContentStudio = () => {
  const { showLoader, hideLoader, updateLoader } = useLoader();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(location.state?.topic || '');
  const [generatedOptions, setGeneratedOptions] = useState(() => {
    const saved = sessionStorage.getItem('cs_generatedOptions');
    return saved ? JSON.parse(saved) : [];
  });
  const [mediaUrls, setMediaUrls] = useState(() => {
    const saved = sessionStorage.getItem('cs_mediaUrls');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  // Scheduling State
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [schedulePlatform, setSchedulePlatform] = useState('both');
  
  // Calendar View State
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDatePosts, setSelectedDatePosts] = useState(null);

  // Edit Schedule State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editScheduleDate, setEditScheduleDate] = useState('');
  const [editScheduleTime, setEditScheduleTime] = useState('');

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/?status=APPROVED`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const results = data.results || data;
        setScheduledPosts(results);
      }
    } catch (error) {
      console.error('Failed to fetch scheduled posts', error);
    }
  };

  const handleGenerate = async () => {
    showLoader('Generating options with AI...', 10, 'Analyzing brand context & tone...');
    
    let currentProgress = 10;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 8 + 3;
      if (currentProgress > 92) {
        currentProgress = 92;
      }
      
      let stepText = 'Synthesizing creative angles...';
      if (currentProgress > 72) {
        stepText = 'Generating visual creatives & headlines...';
      } else if (currentProgress > 45) {
        stepText = 'Crafting 5 tailored post captions...';
      } else if (currentProgress > 25) {
        stepText = 'Structuring engagement hooks & hashtags...';
      }
      
      updateLoader({ progress: currentProgress, subText: stepText });
    }, 400);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({})
      });

      clearInterval(progressInterval);

      if (response.ok) {
        updateLoader({ progress: 100, subText: 'Ready!' });
        const data = await response.json();
        const rawOptions = data.options || [];
        const formattedOpts = rawOptions.map(opt => formatContentLineByLine(opt));
        if (data.topic) {
          setTopic(data.topic);
        }
        setGeneratedOptions(formattedOpts);
        sessionStorage.setItem('cs_generatedOptions', JSON.stringify(formattedOpts));
        setMediaUrls(data.media_urls || []);
        sessionStorage.setItem('cs_mediaUrls', JSON.stringify(data.media_urls || []));
        setSelectedOptionIdx(null);
        setTimeout(() => {
          hideLoader();
          showToast('Generated 5 options!', 'success');
        }, 300);
      } else {
        hideLoader(); showToast('Failed to generate.', 'error');
      }
    } catch (error) { 
      clearInterval(progressInterval);
      hideLoader(); 
      showToast('Network error.', 'error'); 
    }
  };

  const handleApproveAndSchedule = async () => {
    if (selectedOptionIdx === null) { showToast('Select an option first.', 'info'); return; }
    if (!scheduleDate || !scheduleTime) { showToast('Please select a date and time.', 'info'); return; }
    
    showLoader('Approving & Scheduling...');
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const contentToSend = formatContentLineByLine(generatedOptions[selectedOptionIdx]);
      const payload = {
        topic,
        content: contentToSend,
        media_url: mediaUrls[selectedOptionIdx] || null,
        scheduled_at: scheduledAt,
        published_platform: schedulePlatform
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/approve-schedule/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        hideLoader(); 
        showToast('Post scheduled! AI learned your preference.', 'success');
        
        // Remove only the scheduled option so the user can schedule remaining options
        const remainingOpts = generatedOptions.filter((_, idx) => idx !== selectedOptionIdx);
        const remainingMedia = mediaUrls.filter((_, idx) => idx !== selectedOptionIdx);
        
        setGeneratedOptions(remainingOpts);
        sessionStorage.setItem('cs_generatedOptions', JSON.stringify(remainingOpts));
        setMediaUrls(remainingMedia);
        sessionStorage.setItem('cs_mediaUrls', JSON.stringify(remainingMedia));
        setSelectedOptionIdx(null);
        setScheduleDate('');
        setScheduleTime('');
        fetchScheduledPosts();
      } else {
        hideLoader(); showToast('Failed to schedule.', 'error');
      }
    } catch (error) { hideLoader(); showToast('Network error.', 'error'); }
  };

  const handlePublishNow = async () => {
    if (selectedOptionIdx === null) { showToast('Select an option first.', 'info'); return; }

    const targetName = schedulePlatform === 'both' ? 'Facebook & Instagram' : (schedulePlatform === 'instagram' ? 'Instagram' : 'Facebook');
    showLoader(`Publishing directly to ${targetName}...`, 15, 'Preparing media assets & captions...');

    let currentProgress = 15;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 10 + 5;
      if (currentProgress > 90) currentProgress = 90;

      let sub = 'Connecting to Meta Graph API...';
      if (currentProgress > 70) {
        sub = `Uploading media and publishing to ${targetName}...`;
      } else if (currentProgress > 45) {
        sub = 'Validating page permissions & tokens...';
      } else if (currentProgress > 25) {
        sub = 'Structuring post format & hashtags...';
      }

      updateLoader({ progress: currentProgress, subText: sub });
    }, 380);

    try {
      const contentToSend = formatContentLineByLine(generatedOptions[selectedOptionIdx]);
      // 1. Approve post first
      const approvePayload = {
        topic,
        content: contentToSend,
        media_url: mediaUrls[selectedOptionIdx] || null,
        scheduled_at: new Date().toISOString(),
        published_platform: schedulePlatform
      };

      const approveRes = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/approve-schedule/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(approvePayload)
      });

      if (!approveRes.ok) {
        const err = await approveRes.json();
        throw new Error(err.error || 'Failed to approve post.');
      }

      const createdPost = await approveRes.json();

      // 2. Publish post immediately to social platform
      const publishRes = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${createdPost.id}/publish/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ platform: schedulePlatform })
      });

      clearInterval(progressInterval);

      if (publishRes.ok) {
        updateLoader({ progress: 100, subText: 'Published successfully!' });
        setTimeout(() => {
          hideLoader();
          showToast('Published successfully to social media!', 'success');
          
          // Remove only the published option so user can schedule/publish the others
          const remainingOpts = generatedOptions.filter((_, idx) => idx !== selectedOptionIdx);
          const remainingMedia = mediaUrls.filter((_, idx) => idx !== selectedOptionIdx);

          setGeneratedOptions(remainingOpts);
          sessionStorage.setItem('cs_generatedOptions', JSON.stringify(remainingOpts));
          setMediaUrls(remainingMedia);
          sessionStorage.setItem('cs_mediaUrls', JSON.stringify(remainingMedia));
          setSelectedOptionIdx(null);
          setScheduleDate('');
          setScheduleTime('');
          fetchScheduledPosts();
        }, 350);
      } else {
        const pubErr = await publishRes.json();
        hideLoader();
        showToast(pubErr.error || 'Failed to publish directly.', 'error');
      }
    } catch (error) {
      clearInterval(progressInterval);
      hideLoader();
      showToast(error.message || 'Error publishing post.', 'error');
    }
  };

  const handleUpdateSchedule = async (postId) => {
    if (!editScheduleDate || !editScheduleTime) { showToast('Please select a date and time.', 'info'); return; }
    showLoader('Updating Schedule...');
    try {
      const scheduledAt = new Date(`${editScheduleDate}T${editScheduleTime}`).toISOString();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/${postId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ scheduled_at: scheduledAt })
      });
      if (response.ok) {
        hideLoader();
        showToast('Schedule updated!', 'success');
        setEditingPostId(null);
        fetchScheduledPosts();
        
        // update local state so the modal reflects the change immediately
        if (selectedDatePosts) {
          const updatedPosts = selectedDatePosts.posts.map(p => 
            p.id === postId ? { ...p, scheduled_at: scheduledAt } : p
          );
          setSelectedDatePosts({ ...selectedDatePosts, posts: updatedPosts });
        }
      } else {
        hideLoader(); showToast('Failed to update schedule.', 'error');
      }
    } catch (error) { hideLoader(); showToast('Network error.', 'error'); }
  };

  // Calendar Helper Functions
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" style={{ minHeight: '34px', background: 'transparent', border: 'none' }}></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = isCurrentMonth && day === todayDate;
      const dayPosts = scheduledPosts.filter(p => {
        const dateString = p.scheduled_at || p.created_at;
        if (!dateString) return false;
        const postDate = new Date(dateString);
        return postDate.getFullYear() === year && 
               postDate.getMonth() === month && 
               postDate.getDate() === day;
      });
      
      const hasPosts = dayPosts.length > 0;

      days.push(
        <div 
          key={`day-${day}`} 
          className="calendar-day" 
          style={{
            border: isToday ? '1.5px solid var(--color-primary)' : '1px solid var(--color-glass-border)',
            minHeight: '34px',
            maxHeight: '38px',
            padding: '0.2rem 0.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: isToday ? 'rgba(59, 130, 246, 0.12)' : hasPosts ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-bg-tertiary)',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
            cursor: hasPosts ? 'pointer' : 'default',
            position: 'relative'
          }} 
          onClick={() => hasPosts && setSelectedDatePosts({ date: currentDate, posts: dayPosts })}
          title={hasPosts ? `${dayPosts.length} scheduled post(s)` : undefined}
        >
          <span style={{ 
            fontWeight: isToday ? 700 : 500, 
            fontSize: '0.8rem', 
            color: isToday ? 'var(--color-primary)' : hasPosts ? 'var(--color-text)' : 'var(--color-text-muted)',
            lineHeight: 1
          }}>
            {day}
          </span>
          
          {hasPosts && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              marginTop: '2px'
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                boxShadow: '0 0 4px var(--color-primary)'
              }} />
              {dayPosts.length > 1 && (
                <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: 700, lineHeight: 1 }}>
                  {dayPosts.length}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          padding: '0.25rem 0.5rem'
        }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          >
            &larr; Prev
          </button>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.05rem', 
            fontWeight: 600,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          >
            Next &rarr;
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ 
              textAlign: 'center', 
              fontSize: '0.72rem', 
              fontWeight: 600, 
              color: 'var(--color-text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px', 
              paddingBottom: '0.35rem' 
            }}>
              {d}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };


  const formatContentLineByLine = (text) => {
    if (!text) return '';
    // If it already has multiple paragraphs, assume it's formatted
    if (text.split('\n\n').length > 2) return text;
    
    let formatted = text
      // Newline after punctuation followed by a space and a capital letter
      .replace(/([.?!])\s+(?=[A-Z])/g, "$1\n\n")
      // Newline after punctuation followed by a space and an emoji
      .replace(/([.?!])\s+(?=[\uD83C-\uDBFF\u2700-\u27BF])/g, "$1\n\n")
      // Newline after emoji followed by a space and a capital letter
      .replace(/([\uD83C-\uDBFF\u2700-\u27BF]+)\s+(?=[A-Z])/g, "$1\n\n")
      // Newline before hashtags
      .replace(/\s+(?=#)/g, "\n\n")
      // Collapse multiple newlines
      .replace(/\n{3,}/g, "\n\n");
      
    return formatted;
  };

  return (

    <SidebarLayout title="Content Studio">
      <div className="studio-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Universal Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', paddingRight: '1rem', borderRight: '1px solid var(--color-glass-border)' }}>
              <button className="btn btn-secondary" onClick={() => setShowCalendarModal(true)} style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem' }}>
                <CalendarIcon size={14} /> Calendar
              </button>
            </div>
            {generatedOptions.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', paddingRight: '1rem', borderRight: '1px solid var(--color-glass-border)' }}>
                <button className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('all')} style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem' }}><List size={14} /> All</button>
                <button className={`btn ${activeTab === 'image' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('image')} style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem' }}><ImageIcon size={14} /> Images</button>
                <button className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('video')} style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem' }}><VideoIcon size={14} /> Videos</button>
                  <button className="btn btn-secondary" onClick={() => { setGeneratedOptions([]); sessionStorage.removeItem('cs_generatedOptions'); setMediaUrls([]); }} style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', color: '#ef4444' }}><X size={14} /> Clear</button>
              </div>
            )}
            <button className="btn btn-primary" onClick={handleGenerate} style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Sparkles size={18} /> Generate 5 Options
            </button>
          </div>
        </div>

        {/* Right: Options or Calendar */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {generatedOptions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
              
              {/* Options List (Horizontal Scroll) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', overflow: 'hidden' }}>
                <style>{`
                  .hide-scrollbar::-webkit-scrollbar { display: none !important; }
                  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none !important; }
                `}</style>
                <div className="hide-scrollbar" style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  overflowX: 'auto', 
                  paddingBottom: '1rem',
                  paddingTop: '0.5rem',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  {generatedOptions.map((opt, idx) => {
                    const mediaUrl = mediaUrls[idx] || '';
                    const isVideo = mediaUrl.match(/\.(mp4|webm|ogg)$/i);
                    const isImage = mediaUrl && !isVideo;
                    
                    if (activeTab === 'image' && !isImage) return null;
                    if (activeTab === 'video' && !isVideo) return null;

                  
  const formatContentLineByLine = (text) => {
    if (!text) return '';
    // If it already has multiple paragraphs, assume it's formatted
    if (text.split('\n\n').length > 2) return text;
    
    let formatted = text
      // Newline after punctuation followed by a space and a capital letter
      .replace(/([.?!])\s+(?=[A-Z])/g, "$1\n\n")
      // Newline after punctuation followed by a space and an emoji
      .replace(/([.?!])\s+(?=[\uD83C-\uDBFF\u2700-\u27BF])/g, "$1\n\n")
      // Newline after emoji followed by a space and a capital letter
      .replace(/([\uD83C-\uDBFF\u2700-\u27BF]+)\s+(?=[A-Z])/g, "$1\n\n")
      // Newline before hashtags
      .replace(/\s+(?=#)/g, "\n\n")
      // Collapse multiple newlines
      .replace(/\n{3,}/g, "\n\n");
      
    return formatted;
  };

  return (

                    <div key={idx} className="glass-panel hover-card animate-slide-up" style={{ 
                      minWidth: '180px',
                      flex: '1 1 0',
                      padding: '1.25rem', 
                      border: selectedOptionIdx === idx ? '2px solid var(--color-primary)' : '1px solid var(--color-glass-border)',
                      boxShadow: selectedOptionIdx === idx ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: selectedOptionIdx === idx ? 'scale(1.02) translateY(-4px)' : 'scale(1)',
                      animationDelay: `${idx * 100}ms`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      height: 'auto'
                    }} onClick={() => {
                      setSelectedOptionIdx(idx);
                      setIsEditingContent(false);
                    }}>
                      
                      {mediaUrls[idx] && (
                        <div style={{ width: '100%', aspectRatio: '1 / 1', flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-glass-border)', background: 'var(--color-bg-tertiary)' }}>
                          {mediaUrls[idx].match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={mediaUrls[idx].startsWith('http') ? mediaUrls[idx] : `${import.meta.env.VITE_API_URL}${mediaUrls[idx]}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted loop autoPlay playsInline />
                          ) : (
                            <img src={mediaUrls[idx].startsWith('http') ? mediaUrls[idx] : `${import.meta.env.VITE_API_URL}${mediaUrls[idx]}`} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          )}
                        </div>
                      )}
                      
                      <div className="hide-scrollbar" style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--color-text)', overflowY: 'auto', overflowX: 'hidden', paddingRight: '0.5rem' }}>
                        {formatContentLineByLine(opt)}
                      </div>

                    </div>
                  )})}
                </div>
              </div>

              {/* Bottom Sticky Panel has been replaced with a Modal below */}
            </div>
          ) : (
            <div className="glass-panel animate-fade-in" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.5rem', minHeight: '400px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '50%' }}>
                <Sparkles size={40} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: 'var(--color-text)' }}>Ready to Create?</h3>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', maxWidth: '400px', lineHeight: '1.5' }}>
                  Click "Generate 5 Options" to use the AI Prompt Engine and create perfectly tailored content for your brand.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Schedule Selected Post Modal */}
      {selectedOptionIdx !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1100,
          padding: '3rem 1rem 1.5rem',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }} onClick={() => setSelectedOptionIdx(null)}>
          <div className="glass-panel hide-scrollbar animate-slide-up" style={{
            width: '100%', maxWidth: '680px', maxHeight: '86vh',
            background: 'var(--color-bg-secondary)', padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--color-glass-border)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-primary)' }}>
                <Send size={20} /> Publish or Schedule Post
              </h2>
              <button className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '8px' }} onClick={() => setSelectedOptionIdx(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
              {/* Left Column: Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {mediaUrls[selectedOptionIdx] && (
                  <div style={{ width: '130px', height: '130px', alignSelf: 'center', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-glass-border)', background: 'var(--color-bg-tertiary)', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {mediaUrls[selectedOptionIdx].match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={mediaUrls[selectedOptionIdx].startsWith('http') ? mediaUrls[selectedOptionIdx] : `${import.meta.env.VITE_API_URL}${mediaUrls[selectedOptionIdx]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop autoPlay playsInline controls />
                    ) : (
                      <img src={mediaUrls[selectedOptionIdx].startsWith('http') ? mediaUrls[selectedOptionIdx] : `${import.meta.env.VITE_API_URL}${mediaUrls[selectedOptionIdx]}`} alt="Selected Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                )}
                
                <div style={{ padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: '10px', border: '1px solid var(--color-glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>Caption</span>
                    <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }} onClick={() => setIsEditingContent(!isEditingContent)}>
                      <Edit2 size={12} /> {isEditingContent ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  {isEditingContent ? (
                    <textarea 
                      className="input-field hide-scrollbar" 
                      value={formatContentLineByLine(generatedOptions[selectedOptionIdx])} 
                      onChange={(e) => {
                        const newOpts = [...generatedOptions];
                        newOpts[selectedOptionIdx] = e.target.value;
                        setGeneratedOptions(newOpts);
                        sessionStorage.setItem('cs_generatedOptions', JSON.stringify(newOpts));
                      }}
                      style={{ minHeight: '100px', fontSize: '0.85rem', width: '100%', resize: 'vertical', padding: '0.5rem' }}
                    />
                  ) : (
                    <div className="hide-scrollbar" style={{ overflowY: 'auto', maxHeight: '120px' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {formatContentLineByLine(generatedOptions[selectedOptionIdx])}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="label" style={{ fontSize: '0.78rem', marginBottom: '0.25rem', display: 'block' }}>Target Platform</label>
                  <select className="input-field" value={schedulePlatform} onChange={e => setSchedulePlatform(e.target.value)} style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                    <option value="both">Both (Facebook & Instagram)</option>
                    <option value="facebook">Facebook Only</option>
                    <option value="instagram">Instagram Only</option>
                  </select>
                </div>

                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid var(--color-glass-border)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Schedule Options (Optional)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem', display: 'block' }}>Date</label>
                      <input type="date" className="input-field" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem', display: 'block' }}>Time</label>
                      <input type="time" className="input-field" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} />
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Option 1: Direct Post Now */}
                  <button 
                    className="btn btn-primary" 
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }} 
                    onClick={() => handlePublishNow()}
                  >
                    <Send size={16} /> Direct Post Now
                  </button>

                  {/* Option 2: Schedule Later */}
                  <button 
                    className="btn" 
                    style={{
                      padding: '0.6rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem',
                      borderRadius: '10px',
                      background: 'rgba(59,130,246,0.15)',
                      color: 'var(--color-primary)',
                      border: '1px solid rgba(59,130,246,0.3)'
                    }} 
                    onClick={() => handleApproveAndSchedule()}
                  >
                    <CalendarIcon size={16} /> Schedule for Later
                  </button>

                  <button className="btn btn-secondary" style={{ padding: '0.45rem', fontSize: '0.8rem', width: '100%', borderRadius: '10px' }} onClick={() => setSelectedOptionIdx(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Posts Modal */}
      {selectedDatePosts && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1100,
          padding: '3rem 1rem 1.5rem',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }} onClick={() => setSelectedDatePosts(null)}>
          <div className="glass-panel hide-scrollbar animate-slide-up" style={{
            width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
            background: 'var(--color-bg-secondary)', padding: '1.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--color-glass-border)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--color-primary-glow)', padding: '0.5rem', borderRadius: '50%' }}>
                  <CalendarIcon size={20} color="var(--color-primary)" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {selectedDatePosts.date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
              </div>
              <button onClick={() => setSelectedDatePosts(null)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.2rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {selectedDatePosts.posts.map(post => {
                const displayTitle = post.topic || (post.generated_content ? post.generated_content.split(' ').slice(0, 5).join(' ') + '...' : 'Scheduled Post');
                
              
  const formatContentLineByLine = (text) => {
    if (!text) return '';
    // If it already has multiple paragraphs, assume it's formatted
    if (text.split('\n\n').length > 2) return text;
    
    let formatted = text
      // Newline after punctuation followed by a space and a capital letter
      .replace(/([.?!])\s+(?=[A-Z])/g, "$1\n\n")
      // Newline after punctuation followed by a space and an emoji
      .replace(/([.?!])\s+(?=[\uD83C-\uDBFF\u2700-\u27BF])/g, "$1\n\n")
      // Newline after emoji followed by a space and a capital letter
      .replace(/([\uD83C-\uDBFF\u2700-\u27BF]+)\s+(?=[A-Z])/g, "$1\n\n")
      // Newline before hashtags
      .replace(/\s+(?=#)/g, "\n\n")
      // Collapse multiple newlines
      .replace(/\n{3,}/g, "\n\n");
      
    return formatted;
  };

  return (

                <div key={post.id} style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--color-primary)' }}>
                      {displayTitle}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <Clock size={12} />
                      {new Date(post.scheduled_at || post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {post.published_platform && (
                        <span style={{ padding: '0.15rem 0.5rem', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', borderRadius: '12px', textTransform: 'capitalize', fontWeight: 600 }}>
                          {post.published_platform}
                        </span>
                      )}
                      <button 
                        onClick={() => {
                          const dateObj = new Date(post.scheduled_at || post.created_at);
                          // Adjust for local timezone offset when setting input values
                          const tzOffset = dateObj.getTimezoneOffset() * 60000;
                          const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, -1);
                          setEditScheduleDate(localISOTime.split('T')[0]);
                          setEditScheduleTime(localISOTime.split('T')[1].slice(0, 5));
                          setEditingPostId(post.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '0.2rem', marginLeft: '0.5rem' }}
                        title="Edit Schedule"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {editingPostId === post.id && (
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="date" className="input-field" value={editScheduleDate} onChange={e => setEditScheduleDate(e.target.value)} style={{ padding: '0.5rem' }} />
                      <input type="time" className="input-field" value={editScheduleTime} onChange={e => setEditScheduleTime(e.target.value)} style={{ padding: '0.5rem' }} />
                      <button className="btn btn-primary" onClick={() => handleUpdateSchedule(post.id)} style={{ padding: '0.5rem 1rem' }}>Save</button>
                      <button className="btn" onClick={() => setEditingPostId(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-glass-border)' }}>Cancel</button>
                    </div>
                  )}
                  
                  {post.media_url && (
                    <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-glass-border)' }}>
                      {post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video 
                          src={post.media_url.startsWith('http') ? post.media_url : `${import.meta.env.VITE_API_URL}${post.media_url}`} 
                          controls
                          style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', background: 'rgba(0,0,0,0.2)' }} 
                        />
                      ) : (
                        <img 
                          src={post.media_url.startsWith('http') ? post.media_url : `${import.meta.env.VITE_API_URL}${post.media_url}`} 
                          alt="Post Image" 
                          style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', background: 'rgba(0,0,0,0.2)' }} 
                        />
                      )}
                    </div>
                  )}
                  
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {formatContentLineByLine(post.generated_content)}
                  </p>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .calendar-day:hover {
          background: var(--color-bg-tertiary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .hover-card:hover {
          background: var(--color-bg-tertiary);
          border-color: rgba(59, 130, 246, 0.4);
        }
        @media (max-width: 900px) {
          .studio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    
      {/* Calendar Modal */}
      {showCalendarModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
          padding: '3.5rem 1rem 1.5rem',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }} onClick={() => setShowCalendarModal(false)}>
          <div className="glass-panel hide-scrollbar animate-slide-up" style={{
            width: '100%', maxWidth: '440px',
            background: 'var(--color-bg-secondary)', padding: '1.25rem',
            border: '1px solid var(--color-glass-border)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                <CalendarIcon size={18} /> Content Calendar
              </h2>
              <button className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} onClick={() => setShowCalendarModal(false)}>
                <X size={16} />
              </button>
            </div>
            {renderCalendar()}
          </div>
        </div>
      )}

    </SidebarLayout>
  );
};

export default ContentStudio;

