import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import Stepper from '../components/Stepper';
import { Rocket, RefreshCw, Target, LayoutTemplate, Link as LinkIcon, IndianRupee, CheckCircle2, List, Calendar, UploadCloud, X, Eye, Clock } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const AdCampaigns = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('CREATE'); // 'CREATE' or 'HISTORY'
  
  const [posts, setPosts] = useState([]);
  const [isFetchingPosts, setIsFetchingPosts] = useState(true);
  
  const [history, setHistory] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  
  const [brandWebsite, setBrandWebsite] = useState('https://jmstech.co/');

  // View Modal State
  const [viewCampaign, setViewCampaign] = useState(null);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    campaign_name: '',
    budget: 100.00,
    objective: 'OUTCOME_ENGAGEMENT',
    age_min: 18,
    age_max: 65,
    genders: [], // empty = all
    countries: ['IN'],
    website_url: 'https://jmstech.co/',
    call_to_action: 'LEARN_MORE',
    custom_creative: '',
    custom_media_url: '',
    status: 'PAUSED' // 'PAUSED' or 'ACTIVE'
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAI = async () => {
    if (!formData.campaign_name.trim()) {
      showToast('Please enter a Campaign Name first to use AI.', 'info');
      return;
    }
    
    setIsGeneratingAI(true);
    showToast('Generating AI Content... This may take a minute.', 'info');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ topic: formData.campaign_name })
      });
      
      if (!response.ok) throw new Error('Failed to generate content');
      
      const data = await response.json();
      
      if (data.options && data.options.length > 0) {
        setFormData(prev => ({
          ...prev, 
          custom_creative: data.options[0],
          custom_media_url: data.media_urls?.[0] || prev.custom_media_url
        }));
        showToast('AI Content Generated Successfully!', 'success');
      } else {
        showToast('No content generated.', 'error');
      }
    } catch (error) {
      showToast('Failed to generate AI content.', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showToast('Please upload an image or video file.', 'error');
      return;
    }

    setIsUploadingMedia(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name);
    fd.append('asset_type', file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: fd
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setFormData({...formData, custom_media_url: data.file});
      showToast(`${file.type.startsWith('video/') ? 'Video' : 'Image'} uploaded successfully!`, 'success');
    } catch (error) {
      showToast('Failed to upload media', 'error');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const fetchPosts = async () => {
    setIsFetchingPosts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts/?status=PUBLISHED`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.results || data);
      }
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setIsFetchingPosts(false);
    }
  };

  const fetchHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ads/history/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.results || data);
      }
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const mapMetaObjective = (objectiveStr) => {
    if (!objectiveStr) return 'OUTCOME_ENGAGEMENT';
    const str = objectiveStr.toLowerCase();
    if (str.includes('traffic') || str.includes('website') || str.includes('link')) return 'OUTCOME_TRAFFIC';
    return 'OUTCOME_ENGAGEMENT';
  };

  const fetchBrandProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/knowledge-base/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.website_url) setBrandWebsite(data.website_url);
        
        const topic = data.topics ? data.topics.split(',')[0] : 'Ad Campaign';
        
        setFormData(prev => ({
          ...prev,
          website_url: data.website_url || prev.website_url,
          objective: mapMetaObjective(data.default_fb_objective) || prev.objective,
          campaign_name: data.topics ? `Ad Campaign for ${topic}` : prev.campaign_name,
          custom_creative: prev.custom_creative || 'Generating AI content... Please wait.'
        }));

        // Fetch AI Generation automatically
        fetch(`${import.meta.env.VITE_API_URL}/api/generate/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify({ topic: topic })
        })
        .then(res => res.json())
        .then(genData => {
          if (genData.options && genData.options.length > 0) {
            setFormData(prev => ({
              ...prev,
              custom_creative: (prev.custom_creative === 'Generating AI content... Please wait.' || prev.custom_creative.includes('Generating AI')) ? genData.options[0] : prev.custom_creative
            }));
          }
        })
        .catch(err => {
          console.error('Auto AI failed:', err);
          setFormData(prev => ({
            ...prev,
            custom_creative: (prev.custom_creative === 'Generating AI content... Please wait.' || prev.custom_creative.includes('Generating AI')) ? (data.company_description || '') : prev.custom_creative
          }));
        });
      }

    } catch (error) {
      console.error('Failed to fetch brand profile or assets', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchBrandProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleBoostClick = (post) => {
    setSelectedPost(post);
    const sep = brandWebsite.includes('?') ? '&' : '?';
    setFormData({
      ...formData,
      campaign_name: `Boost: ${post.topic || 'Post'}`,
      website_url: `${brandWebsite}${sep}utm_source=facebook&utm_medium=paid_social&utm_campaign=boost_${post.id}`
    });
    setCurrentStep(1);
    setIsWizardOpen(true);
  };

  const handleCreateFromScratch = () => {
    setSelectedPost(null);
    const sep = brandWebsite.includes('?') ? '&' : '?';
    setFormData({
      ...formData,
      campaign_name: formData.campaign_name && !formData.campaign_name.startsWith('Boost:') 
        ? formData.campaign_name 
        : 'Custom Ad Campaign',
      website_url: `${brandWebsite}${sep}utm_source=facebook&utm_medium=paid_social&utm_campaign=custom_ad`,
      custom_creative: formData.custom_creative,
      custom_media_url: formData.custom_media_url
    });
    setCurrentStep(1);
    setIsWizardOpen(true);
  };

  const handleLaunchCampaign = async () => {
    showLoader('Launching Ad Campaign...');
    try {
      const endpoint = selectedPost 
        ? `${import.meta.env.VITE_API_URL}/api/posts/${selectedPost.id}/create-ad/`
        : `${import.meta.env.VITE_API_URL}/api/ads/create-scratch/`;
        
      const res = await fetch(endpoint, {
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create ad campaign');
      }
      
      hideLoader(); 
      showToast(`Campaign successfully launched! (Status: ${formData.status})`, 'success'); 
      setIsWizardOpen(false);
      setActiveTab('HISTORY');
    } catch (error) { 
      hideLoader(); 
      showToast(error.message, 'error'); 
    }
  };

  const steps = [
    { label: 'Setup' },
    { label: 'Audience' },
    { label: 'Creative & Links' },
    { label: 'Review' }
  ];

  const renderWizardContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label className="label">Campaign Name *</label>
              <input type="text" className="input-field" style={{ width: '100%', padding: '0.6rem' }}
                value={formData.campaign_name} onChange={e => setFormData({...formData, campaign_name: e.target.value})} />
            </div>
            
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={14} color="var(--color-primary)" /> Campaign Objective
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {[
                  { id: 'OUTCOME_ENGAGEMENT', title: 'Engagement', desc: 'Get more messages or post engagement' },
                  { id: 'OUTCOME_TRAFFIC', title: 'Traffic', desc: 'Send people to a destination like your website' }
                ].map(obj => (
                  <div key={obj.id} 
                    onClick={() => setFormData({...formData, objective: obj.id})}
                    style={{ 
                      padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s',
                      background: formData.objective === obj.id ? 'rgba(59,130,246,0.1)' : 'var(--color-bg-tertiary)',
                      border: `1px solid ${formData.objective === obj.id ? 'var(--color-primary)' : 'var(--color-border)'}`
                    }}>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: formData.objective === obj.id ? 'var(--color-primary)' : 'var(--color-text)' }}>{obj.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{obj.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IndianRupee size={14} color="var(--color-success)" /> Daily Budget (INR) *
              </label>
              <input type="number" className="input-field" style={{ width: '100%', padding: '0.6rem' }} min="80"
                value={formData.budget} onChange={e => setFormData({...formData, budget: parseFloat(e.target.value)})} />
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem' }}>
              <div style={{ color: 'var(--color-success)' }}><Rocket size={18} /></div>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Advantage+ Placements Activated</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Meta will automatically allocate your budget across Facebook and Instagram for best results.</p>
              </div>
            </div>

            <div>
              <label className="label">Target Countries *</label>
              <select className="input-field" style={{ width: '100%', padding: '0.6rem' }}
                value={formData.countries[0]} onChange={e => setFormData({...formData, countries: [e.target.value]})}>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="CA">Canada</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Min Age</label>
                <input type="number" className="input-field" style={{ width: '100%', padding: '0.6rem' }} min="18" max="65"
                  value={formData.age_min} onChange={e => setFormData({...formData, age_min: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="label">Max Age</label>
                <input type="number" className="input-field" style={{ width: '100%', padding: '0.6rem' }} min="18" max="65"
                  value={formData.age_max} onChange={e => setFormData({...formData, age_max: parseInt(e.target.value)})} />
              </div>
            </div>

            <div>
              <label className="label">Gender</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{id: '', label: 'All'}, {id: [1], label: 'Male'}, {id: [2], label: 'Female'}].map(g => (
                  <button key={g.label} type="button"
                    onClick={() => setFormData({...formData, genders: g.id ? g.id : []})}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      border: `1px solid ${JSON.stringify(formData.genders) === JSON.stringify(g.id || []) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: JSON.stringify(formData.genders) === JSON.stringify(g.id || []) ? 'rgba(59,130,246,0.1)' : 'var(--color-bg-tertiary)',
                      color: JSON.stringify(formData.genders) === JSON.stringify(g.id || []) ? 'var(--color-primary)' : 'var(--color-text)',
                    }}
                  >{g.label}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LayoutTemplate size={14} /> {selectedPost ? 'Auto-Linked Post Creative' : 'Custom Ad Creative'}
              </label>
              
              {selectedPost ? (
                <>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>The text and media from your generated post will be used automatically.</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-text-muted)' }}>
                    "{selectedPost?.generated_content}"
                  </p>
                </>
              ) : (
                <div style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label className="label" style={{ fontSize: '0.7rem', margin: 0 }}>Ad Text / Caption *</label>
                      <button 
                        type="button" 
                        onClick={handleGenerateAI}
                        disabled={isGeneratingAI}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(59,130,246,0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', cursor: isGeneratingAI ? 'not-allowed' : 'pointer', opacity: isGeneratingAI ? 0.7 : 1, transition: 'all 0.2s' }}
                      >
                        <Rocket size={12} />
                        {isGeneratingAI ? 'Generating...' : 'AI Generate'}
                      </button>
                    </div>
                    <textarea className="input-field" style={{ width: '100%', padding: '0.6rem', fontSize: '0.75rem', minHeight: '80px', resize: 'vertical' }}
                      placeholder="Write your ad copy here..."
                      value={formData.custom_creative} onChange={e => setFormData({...formData, custom_creative: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: '0.7rem' }}>Ad Media (Image/Video) *</label>
                    {formData.custom_media_url ? (
                      <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                        {(formData.custom_media_url.endsWith('.mp4') || formData.custom_media_url.endsWith('.webm') || formData.custom_media_url.endsWith('.mov')) ? (
                          <video src={formData.custom_media_url.startsWith('http') ? formData.custom_media_url : `${import.meta.env.VITE_API_URL}${formData.custom_media_url}`} style={{ width: '100%', display: 'block' }} controls autoPlay muted loop />
                        ) : (
                          <img src={formData.custom_media_url.startsWith('http') ? formData.custom_media_url : `${import.meta.env.VITE_API_URL}${formData.custom_media_url}`} alt="Ad Creative" style={{ width: '100%', display: 'block' }} />
                        )}
                        <button 
                          onClick={(e) => { e.preventDefault(); setFormData({...formData, custom_media_url: ''}); }}
                          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: '#ffffff', border: 'none', borderRadius: '50%', padding: '0.3rem', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleMediaUpload(e); }}
                        style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', background: 'var(--color-bg-tertiary)', cursor: 'pointer', position: 'relative' }}
                      >
                        <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        {isUploadingMedia ? (
                          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Uploading Media...</div>
                        ) : (
                          <>
                            <UploadCloud size={24} color="var(--color-text-muted)" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>Click or Drag & Drop image/video here</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LinkIcon size={14} /> Website URL (with UTM tracking) *
              </label>
              <input type="url" className="input-field" style={{ width: '100%', padding: '0.6rem', fontSize: '0.75rem' }}
                value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} />
            </div>

            <div>
              <label className="label">Call to Action Button</label>
              <select className="input-field" style={{ width: '100%', padding: '0.6rem' }}
                value={formData.call_to_action} onChange={e => setFormData({...formData, call_to_action: e.target.value})}>
                <option value="LEARN_MORE">Get Demo (Learn More)</option>
                <option value="OPEN_LINK">Open Link</option>
                <option value="SIGN_UP">Sign Up</option>
                <option value="SUBSCRIBE">Subscribe</option>
                <option value="APPLY_NOW">Apply Now</option>
                <option value="GET_QUOTE">Get Quote</option>
                <option value="CONTACT_US">Contact Us</option>
                <option value="GET_OFFER">Get Offer</option>
                <option value="SHOP_NOW">Shop Now</option>
                <option value="BOOK_TRAVEL">Book Now</option>
                <option value="ORDER_NOW">Order Now</option>
                <option value="WATCH_MORE">Watch More</option>
                <option value="CALL_NOW">Call Now</option>
                <option value="SEND_MESSAGE">Send Message</option>
                <option value="LISTEN_NOW">Listen Now</option>
              </select>
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle2 size={40} color="var(--color-primary)" style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ margin: 0 }}>Review & Launch</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Final check before launching.
              </p>
            </div>
            
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              {[
                { label: 'Campaign', val: formData.campaign_name },
                { label: 'Objective', val: formData.objective },
                { label: 'Budget', val: `INR ${formData.budget.toFixed(2)} /day` },
                { label: 'Countries', val: formData.countries.join(', ') },
                { label: 'Age', val: `${formData.age_min} - ${formData.age_max}` },
                { label: 'Gender', val: formData.genders.length === 0 ? 'All' : formData.genders[0] === 1 ? 'Male' : 'Female' },
                { label: 'Placements', val: 'Advantage+ (Auto)' },
                { label: 'CTA', val: formData.call_to_action },
              ].map((row, i) => (
                <div key={row.label} style={{ 
                  display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem',
                  borderBottom: i !== 7 ? '1px solid var(--color-border)' : 'none',
                  background: i % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{row.val}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.1)', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input 
                  type="checkbox" 
                  checked={formData.status === 'ACTIVE'}
                  onChange={(e) => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'PAUSED'})}
                  style={{ width: '16px', height: '16px' }}
                />
                Launch Immediately (Set status to ACTIVE)
              </label>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                If unchecked, the ad will be created in a PAUSED state for you to review in Ads Manager.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarLayout title="Ad Campaigns">
      
      {!isWizardOpen && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('CREATE')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'CREATE' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '1rem', fontWeight: 600, padding: '0.5rem 1rem', cursor: 'pointer',
              borderBottom: activeTab === 'CREATE' ? '2px solid var(--color-primary)' : '2px solid transparent'
            }}>
            <Rocket size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Create Campaign
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'HISTORY' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '1rem', fontWeight: 600, padding: '0.5rem 1rem', cursor: 'pointer',
              borderBottom: activeTab === 'HISTORY' ? '2px solid var(--color-primary)' : '2px solid transparent'
            }}>
            <List size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Campaign History
          </button>
        </div>
      )}

      {activeTab === 'HISTORY' && !isWizardOpen ? (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Ad Campaign History</h3>
            <button className="btn btn-secondary" onClick={fetchHistory}><RefreshCw size={14} /> Refresh</button>
          </div>
          
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Campaign Info</th>
                  <th style={{ padding: '1rem' }}>Budget</th>
                  <th style={{ padding: '1rem' }}>Meta IDs</th>
                  <th style={{ padding: '1rem' }}>Date & Time</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetchingHistory ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No campaigns launched yet.</td></tr>
                ) : (
                  history.map(item => {
                    const dateObj = new Date(item.created_at);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.post_topic || 'Custom Ad'}</div>
                            <span style={{ 
                              fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600,
                              background: item.campaign_type === 'SCRATCH' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: item.campaign_type === 'SCRATCH' ? '#8b5cf6' : '#10b981' 
                            }}>
                              {item.campaign_type === 'SCRATCH' ? 'Custom' : 'Boosted'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--color-success)', fontWeight: 500 }}>
                          INR {parseFloat(item.budget).toFixed(2)}/day
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            Camp: {item.meta_campaign_id}<br/>
                            Ad: {item.meta_ad_id}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.2rem' }}>
                            <Calendar size={12} /> {dateObj.toLocaleDateString()}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem' }}>
                            <Clock size={12} /> {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => setViewCampaign(item)}
                          >
                            <Eye size={14} style={{ marginRight: '0.2rem' }} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* View Modal */}
          {viewCampaign && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', animation: 'fadeIn 0.2s ease', margin: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Campaign Details</h3>
                  <button onClick={() => setViewCampaign(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Topic / Name</div>
                  <div style={{ fontWeight: 600 }}>{viewCampaign.post_topic}</div>
                </div>

                {viewCampaign.post_content && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Ad Text / Caption</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', background: 'var(--color-bg-tertiary)', padding: '0.75rem', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                      {viewCampaign.post_content}
                    </div>
                  </div>
                )}

                {viewCampaign.post_media_url && (
                  <div style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <img src={viewCampaign.post_media_url.startsWith('http') ? viewCampaign.post_media_url : `${import.meta.env.VITE_API_URL}${viewCampaign.post_media_url}`} alt="Campaign Media" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }} />
                  </div>
                )}
                
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setViewCampaign(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      ) : !isWizardOpen ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
            <div>
              <h2 style={{ margin: 0 }}>Boost Published Posts</h2>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Turn your successful content into paid Meta Ads.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={handleCreateFromScratch} style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
                <Rocket size={14} /> Create from Scratch
              </button>
              <button className="btn btn-secondary" onClick={fetchPosts}><RefreshCw size={14} /> Refresh</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
            {isFetchingPosts ? (
              [1,2,3].map(i => <div key={i} className="glass-panel" style={{ height: '150px' }}><Skeleton type="text" width="100%" height="100%" /></div>)
            ) : posts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No published posts available to boost. Go to Content Studio to publish a post first!
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>{post.topic || 'Untitled'}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                       {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', margin: '0 0 1rem 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.generated_content}
                  </p>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleBoostClick(post)}>
                    <Rocket size={14} /> Boost Post
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsWizardOpen(false)} style={{ padding: '0.4rem 0.8rem' }}>&larr; Back</button>
            <h2 style={{ margin: 0 }}>Create Campaign</h2>
            <span style={{ background: 'var(--color-border)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>FREE</span>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <Stepper currentStep={currentStep} steps={steps} />
            
            <div style={{ minHeight: '300px', marginBottom: '2rem' }}>
              {renderWizardContent()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setCurrentStep(prev => prev - 1)}
                style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
              >
                &larr; Previous
              </button>
              
              {currentStep < 4 ? (
                <button className="btn btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                  Next &rarr;
                </button>
              ) : (
                <button className="btn btn-primary" style={{ background: 'var(--gradient-primary)' }} onClick={handleLaunchCampaign}>
                  <Rocket size={14} /> Launch Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default AdCampaigns;

