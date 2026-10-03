import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Sparkles, Calendar as CalendarIcon, Check, Clock, Copy, X, Edit2, Image as ImageIcon, Video as VideoIcon, List } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';

const ContentStudio = () => {
  const { showLoader, hideLoader } = useLoader();
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
  const [activeTab, setActiveTab] = useState('all');
  
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
    
    showLoader('Generating options with AI...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({})
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedOptions(data.options || []);
        sessionStorage.setItem('cs_generatedOptions', JSON.stringify(data.options || []));
        setMediaUrls(data.media_urls || []);
        sessionStorage.setItem('cs_mediaUrls', JSON.stringify(data.media_urls || []));
        setSelectedOptionIdx(null);
        hideLoader();
        showToast('Generated 5 options!', 'success');
      } else {
        hideLoader(); showToast('Failed to generate.', 'error');
      }
    } catch (error) { hideLoader(); showToast('Network error.', 'error'); }
  };

  const handleApproveAndSchedule = async () => {
    if (selectedOptionIdx === null) { showToast('Select an option first.', 'info'); return; }
    if (!scheduleDate || !scheduleTime) { showToast('Please select a date and time.', 'info'); return; }
    
    showLoader('Approving & Scheduling...');
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const payload = {
        topic,
        content: generatedOptions[selectedOptionIdx],
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
        setGeneratedOptions([]);
        sessionStorage.removeItem('cs_generatedOptions');
        setMediaUrls([]);
        sessionStorage.removeItem('cs_mediaUrls');
        setSelectedOptionIdx(null);
        setScheduleDate('');
        setScheduleTime('');
        fetchScheduledPosts();
      } else {
        hideLoader(); showToast('Failed to schedule.', 'error');
      }
    } catch (error) { hideLoader(); showToast('Network error.', 'error'); }
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
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" style={{ minHeight: '90px' }}></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayPosts = scheduledPosts.filter(p => {
        const dateString = p.scheduled_at || p.created_at;
        if (!dateString) return false;
        const postDate = new Date(dateString);
        return postDate.getFullYear() === year && 
               postDate.getMonth() === month && 
               postDate.getDate() === day;
      });
      
      days.push(
        <div key={`day-${day}`} className="calendar-day animate-fade-in" style={{
          border: '1px solid var(--color-glass-border)',
          minHeight: '100px',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          background: dayPosts.length > 0 ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          boxShadow: dayPosts.length > 0 ? 'inset 0 0 10px rgba(59, 130, 246, 0.1)' : 'none',
          transition: 'all var(--transition-normal)',
          animationDelay: `${day * 10}ms`,
          cursor: dayPosts.length > 0 ? 'pointer' : 'default'
        }} onClick={() => dayPosts.length > 0 && setSelectedDatePosts({ date: currentDate, posts: dayPosts })}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: dayPosts.length > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{day}</span>
          
          {dayPosts.length > 0 && (
            <div style={{ 
              marginTop: 'auto', 
              fontSize: '0.75rem', 
              color: '#fff', 
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', 
              padding: '0.35rem 0.5rem', 
              borderRadius: 'var(--radius-sm)', 
              textAlign: 'center',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              transition: 'transform 0.2s',
            }}>
              <CalendarIcon size={12} /> {dayPosts.length} Post{dayPosts.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="animate-slide-up" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            &larr; Prev
          </button>
          <h3 style={{ margin: 0, fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            Next &rarr;
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '0.5rem' }}>{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <SidebarLayout title="Content Studio">
      <div className="studio-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left: Generate Action */}
        <div className="glass-panel" style={{ 
          textAlign: 'center', 
          padding: '2.5rem 1.5rem', 
          position: 'sticky', 
          top: '2rem',
          background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.95))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1.25rem', 
            background: 'var(--color-primary-glow)', 
            borderRadius: '50%', 
            color: 'var(--color-primary)', 
            marginBottom: '1.5rem',
            animation: 'pulseGlow 3s infinite',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
          }}>
            <Sparkles size={36} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 600 }}>Ready to Generate</h3>
          
          {topic ? (
            <div style={{ marginBottom: '2rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Selected Topic</span>
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--color-glass-border)', 
                fontStyle: 'italic',
                color: 'var(--color-text)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                "{topic}"
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              No topic selected. Please go back to <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/brand-setup')}>Brand Setup</span> to choose a topic.
            </p>
          )}

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              fontSize: '1rem', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }} 
            onClick={handleGenerate}
          >
            <Sparkles size={18} /> Generate 5 Options
          </button>
        </div>

        {/* Right: Options or Calendar */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {generatedOptions.length > 0 ? (
            <>
              {/* Large Image Preview for Selected Option */}
              {selectedOptionIdx !== null && mediaUrls[selectedOptionIdx] && (
                <div className="animate-fade-in" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
                  {mediaUrls[selectedOptionIdx].match(/\.(mp4|webm|ogg)$/i) ? (
                    <video src={mediaUrls[selectedOptionIdx].startsWith('http') ? mediaUrls[selectedOptionIdx] : `${import.meta.env.VITE_API_URL}${mediaUrls[selectedOptionIdx]}`} controls style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', border: '1px solid var(--color-glass-border)', objectFit: 'contain' }} />
                  ) : (
                    <img src={mediaUrls[selectedOptionIdx].startsWith('http') ? mediaUrls[selectedOptionIdx] : `${import.meta.env.VITE_API_URL}${mediaUrls[selectedOptionIdx]}`} alt="Selected Preview" style={{ maxWidth: '100%', maxHeight: '450px', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', border: '1px solid var(--color-glass-border)', objectFit: 'contain' }} />
                  )}
                </div>
              )}
              
              {/* Approval & Scheduling Panel */}
              {selectedOptionIdx !== null && (
                <div className="glass-panel animate-slide-up" style={{ 
                  padding: '2rem', 
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(139,92,246,0.05))', 
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 4px 24px rgba(59, 130, 246, 0.1)'
                }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                    <CalendarIcon size={20} /> Schedule Selected Post
                  </h3>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 150px' }}>
                      <label className="label">Date</label>
                      <input type="date" className="input-field" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <label className="label">Time</label>
                      <input type="time" className="input-field" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                    </div>
                    <div style={{ flex: '1 1 180px' }}>
                      <label className="label">Platform</label>
                      <select className="input-field" value={schedulePlatform} onChange={e => setSchedulePlatform(e.target.value)} style={{ padding: '0.65rem' }}>
                        <option value="both">Both (Facebook & Instagram)</option>
                        <option value="facebook">Facebook Only</option>
                        <option value="instagram">Instagram Only</option>
                      </select>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '0.65rem 1.75rem', fontSize: '0.9rem', fontWeight: 600 }} onClick={handleApproveAndSchedule}>
                      <Check size={18} /> Approve & Schedule
                    </button>
                  </div>
                  <p style={{ margin: '1rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} color="var(--color-secondary)" /> Approving this post will teach the AI to generate future posts in this exact style.
                  </p>
                </div>
              )}

              {/* Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', fontWeight: 600 }}>Select an Option</h2>
                
                {/* Media Type Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button 
                    className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setActiveTab('all')}
                    style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <List size={16} /> All
                  </button>
                  <button 
                    className={`btn ${activeTab === 'image' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setActiveTab('image')}
                    style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <ImageIcon size={16} /> Images
                  </button>
                  <button 
                    className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}`} 
                    onClick={() => setActiveTab('video')}
                    style={{ flex: 1, display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <VideoIcon size={16} /> Videos
                  </button>
                </div>

                {generatedOptions.map((opt, idx) => {
                  const mediaUrl = mediaUrls[idx] || '';
                  const isVideo = mediaUrl.match(/\.(mp4|webm|ogg)$/i);
                  const isImage = mediaUrl && !isVideo;
                  
                  if (activeTab === 'image' && !isImage) return null;
                  if (activeTab === 'video' && !isVideo) return null;

                  return (
                  <div key={idx} className="glass-panel hover-card animate-slide-up" style={{ 
                    padding: '1.75rem', 
                    border: selectedOptionIdx === idx ? '2px solid var(--color-primary)' : '1px solid var(--color-glass-border)',
                    boxShadow: selectedOptionIdx === idx ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: selectedOptionIdx === idx ? 'scale(1.01)' : 'scale(1)',
                    animationDelay: `${idx * 100}ms`
                  }} onClick={() => setSelectedOptionIdx(idx)}>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 300px', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--color-text)' }}>
                        {opt}
                      </div>
                      {mediaUrls[idx] && (
                        <div style={{ flexShrink: 0, width: '140px', height: '140px' }}>
                          {mediaUrls[idx].match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={mediaUrls[idx].startsWith('http') ? mediaUrls[idx] : `${import.meta.env.VITE_API_URL}${mediaUrls[idx]}`} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--color-glass-border)' }} muted loop autoPlay playsInline />
                          ) : (
                            <img src={mediaUrls[idx].startsWith('http') ? mediaUrls[idx] : `${import.meta.env.VITE_API_URL}${mediaUrls[idx]}`} alt="Generated" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--color-glass-border)' }} />
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className={`btn ${selectedOptionIdx === idx ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 1.25rem' }}>
                        {selectedOptionIdx === idx ? 'Selected' : 'Select Option'}
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </>
          ) : (
            <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                  <CalendarIcon size={24} color="var(--color-primary)" />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Content Calendar</h2>
              </div>
              {renderCalendar()}
            </div>
          )}
        </div>
      </div>
      
      {/* Date Posts Modal */}
      {selectedDatePosts && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setSelectedDatePosts(null)}>
          <div className="glass-panel animate-slide-up" style={{
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
                    {post.generated_content}
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
    </SidebarLayout>
  );
};

export default ContentStudio;

