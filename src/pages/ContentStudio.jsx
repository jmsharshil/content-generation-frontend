import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Sparkles, Calendar as CalendarIcon, Check, Clock, Copy, X } from 'lucide-react';
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
  
  // Scheduling State
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [schedulePlatform, setSchedulePlatform] = useState('both');
  
  // Calendar View State
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
        setScheduledPosts(results.filter(p => p.scheduled_at));
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
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPosts = scheduledPosts.filter(p => p.scheduled_at && p.scheduled_at.startsWith(dateStr));
      
      days.push(
        <div key={`day-${day}`} className={`calendar-day ${dayPosts.length > 0 ? 'has-posts' : ''}`} style={{
          border: '1px solid var(--color-border)',
          minHeight: '80px',
          padding: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          background: dayPosts.length > 0 ? 'rgba(59,130,246,0.05)' : 'var(--color-bg)',
          borderRadius: '4px'
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{day}</span>
          {dayPosts.length > 0 && (
            <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: 'var(--color-primary)', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.4rem', borderRadius: '10px', textAlign: 'center' }}>
              {dayPosts.length} Post{dayPosts.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>Prev</button>
          <h3 style={{ margin: 0 }}>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>Next</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <SidebarLayout title="Content Studio">
      <div className="studio-grid" style={{ display: 'grid', gridTemplateColumns: generatedOptions.length > 0 ? '280px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left: Generate Action */}
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem 1.5rem', position: 'sticky', top: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <Sparkles size={32} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Ready to Generate</h3>
          
          {topic ? (
            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>SELECTED TOPIC</span>
              <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontStyle: 'italic' }}>
                "{topic}"
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              No topic selected. Please go back to <span style={{ color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/brand-setup')}>Brand Setup</span> to choose a topic.
            </p>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} 
            onClick={handleGenerate}
            
          >
            <Sparkles size={16} /> Generate 5 Options
          </button>
        </div>

        {/* Right: Options or Calendar */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {generatedOptions.length > 0 ? (
            <>
              {/* Large Image Preview for Selected Option */}
              {selectedOptionIdx !== null && mediaUrls[selectedOptionIdx] && (
                <div style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
                  <img src={mediaUrls[selectedOptionIdx].startsWith('http') ? mediaUrls[selectedOptionIdx] : `${import.meta.env.VITE_API_URL}${mediaUrls[selectedOptionIdx]}`} alt="Selected Preview" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid var(--color-border)' }} />
                </div>
              )}
              
              {/* Approval & Scheduling Panel */}
              {selectedOptionIdx !== null && (
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(59,130,246,0.03)', border: '1px solid var(--color-primary)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                    <CalendarIcon size={18} /> Schedule Selected Post
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                      <label className="label">Date</label>
                      <input type="date" className="input-field" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Time</label>
                      <input type="time" className="input-field" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Platform</label>
                      <select className="input-field" value={schedulePlatform} onChange={e => setSchedulePlatform(e.target.value)} style={{ padding: '0.65rem', minWidth: '130px' }}>
                        <option value="both">Both</option>
                        <option value="facebook">Facebook Only</option>
                        <option value="instagram">Instagram Only</option>
                      </select>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', background: 'var(--gradient-primary)', border: 'none' }} onClick={handleApproveAndSchedule}>
                      <Check size={16} /> Approve & Schedule
                    </button>
                  </div>
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Approving this post will teach the AI to generate future posts in this exact style.
                  </p>
                </div>
              )}

              {/* Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Select an Option</h2>
                {generatedOptions.map((opt, idx) => (
                  <div key={idx} className="glass-panel hover-card" style={{ 
                    padding: '1.5rem', 
                    border: selectedOptionIdx === idx ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }} onClick={() => setSelectedOptionIdx(idx)}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                      <div style={{ flex: 1, whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
                        {opt}
                      </div>
                      {mediaUrls[idx] && (
                          <div style={{ flexShrink: 0, width: '120px' }}>
                            <img src={mediaUrls[idx].startsWith('http') ? mediaUrls[idx] : `${import.meta.env.VITE_API_URL}${mediaUrls[idx]}`} alt="Generated" style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                          </div>
                        )}
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className={`btn ${selectedOptionIdx === idx ? 'btn-primary' : 'btn-secondary'}`}>
                        {selectedOptionIdx === idx ? 'Selected' : 'Select Option'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <CalendarIcon size={24} color="var(--color-primary)" />
                <h2 style={{ margin: 0 }}>Content Calendar</h2>
              </div>
              {renderCalendar()}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .studio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </SidebarLayout>
  );
};

export default ContentStudio;
