import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Type, Users, Save, Upload, ChevronRight, ChevronLeft, Check, X, Building, Globe, FileText } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const MultiTagInput = ({ options, value, onChange }) => {
  const [inputValue, setInputValue] = React.useState('');
  const selectedTags = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggleTag = (tag) => {
    let newTags;
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag);
    } else {
      newTags = [...selectedTags, tag];
    }
    onChange(newTags.join(', '));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !selectedTags.includes(val)) {
        onChange([...selectedTags, val].join(', '));
      }
      setInputValue('');
    }
  };

  const allTags = Array.from(new Set([...options, ...selectedTags]));

  return (
    <div style={{ marginTop: '0.4rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {allTags.map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <span 
              key={tag} 
              onClick={() => toggleTag(tag)}
              style={{
                fontSize: '0.75rem', padding: '0.3rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                background: isSelected ? 'rgba(59,130,246,0.15)' : 'var(--color-bg-tertiary)',
                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: '1.5rem', cursor: 'pointer', transition: 'all 0.15s',
                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isSelected ? 600 : 400
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }
              }}
            >
              {isSelected ? <Check size={12}/> : '+' } {tag}
            </span>
          );
        })}
      </div>
      <input 
        type="text" 
        className="input-field"
        placeholder="Type custom option & press Enter..." 
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem', width: '100%', background: 'var(--color-bg-tertiary)' }}
      />
    </div>
  );
};

const BrandSetup = () => {
  const [tone, setTone] = useState(() => sessionStorage.getItem('bs_tone') || '');
  const [audience, setAudience] = useState(() => sessionStorage.getItem('bs_audience') || '');
  const [guidelines, setGuidelines] = useState(() => sessionStorage.getItem('bs_guidelines') || '');
  const [websiteUrl, setWebsiteUrl] = useState(() => sessionStorage.getItem('bs_websiteUrl') || '');
  const [companyDescription, setCompanyDescription] = useState(() => sessionStorage.getItem('bs_companyDescription') || '');
  const [category, setCategory] = useState(() => sessionStorage.getItem('bs_category') || 'Product');
  const [fbObjective, setFbObjective] = useState(() => sessionStorage.getItem('bs_fbObjective') || 'Awareness');
  const [instaObjective, setInstaObjective] = useState(() => sessionStorage.getItem('bs_instaObjective') || 'Brand Awareness');
  const [topic, setTopic] = useState(() => sessionStorage.getItem('bs_topic') || '');
  const [assets, setAssets] = useState([]);
  const logoInputRef = React.useRef(null);
  const docInputRef = React.useRef(null);
  
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleCheckboxChange = (setter, key, currentValue, optionValue) => {
    let array = currentValue ? currentValue.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (array.includes(optionValue)) {
      array = array.filter(v => v !== optionValue);
    } else {
      array.push(optionValue);
    }
    const newValue = array.join(', ');
    setter(newValue);
    sessionStorage.setItem(key, newValue);
    sessionStorage.setItem('bs_has_edits', 'true');
  };

  const handleTagChange = (setter, key) => (newValue) => {
    setter(newValue);
    sessionStorage.setItem(key, newValue);
    sessionStorage.setItem('bs_has_edits', 'true');
  };

  const handleChange = (setter, key) => (e) => {
    setter(e.target.value);
    sessionStorage.setItem(key, e.target.value);
    sessionStorage.setItem('bs_has_edits', 'true');
  };

  const handleIndividualSave = async (field, value) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/knowledge-base/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ [field]: value })
      });
      if (response.ok) {
        showToast('Saved!', 'success');
      } else {
        showToast('Failed to save', 'error');
      }
    } catch (error) {
      showToast('Network error.', 'error');
    }
  };

  const handleIndividualAssetSave = async (targetType) => {
    const newAssets = assets.filter(a => a.isNew && (a.explicit_type === targetType || (!a.explicit_type && a.asset_type === targetType)));
    if (newAssets.length === 0) {
      showToast('No new files to save', 'info');
      return;
    }
    
    showLoader(`Uploading ${targetType === 'LOGO' ? 'Logo' : 'Documents'}...`);
    try {
      const uploadPromises = newAssets.map((asset) => {
        const file = asset.fileObj;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        
        let assetType = asset.explicit_type || 'DOCUMENT';
        if (!asset.explicit_type && file.type.startsWith('image/')) {
          assetType = file.name.toLowerCase().includes('logo') ? 'LOGO' : 'IMAGE';
        }
        formData.append('asset_type', assetType);

        return fetch(`${import.meta.env.VITE_API_URL}/api/assets/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: formData
        });
      });

      await Promise.all(uploadPromises);
      showToast('Files uploaded successfully!', 'success');
      fetchAssets();
    } catch (error) {
      showToast('Upload failed.', 'error');
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assets/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const results = data.results || data;
        const existingAssets = results.map(item => ({
          isNew: false,
          id: item.id,
          name: item.name || 'Uploaded File',
          url: item.file,
          asset_type: item.asset_type || 'DOCUMENT'
        }));
        setAssets(prev => {
          const newFiles = prev.filter(a => a.isNew);
          return [...existingAssets, ...newFiles];
        });
      }
    } catch (error) {
      console.error('Failed to load assets', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/knowledge-base/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTone(sessionStorage.getItem('bs_tone') ?? data.tone_of_voice ?? '');
        setAudience(sessionStorage.getItem('bs_audience') ?? data.target_audience ?? '');
        setGuidelines(sessionStorage.getItem('bs_guidelines') ?? data.brand_guidelines ?? '');
        setWebsiteUrl(sessionStorage.getItem('bs_websiteUrl') ?? data.website_url ?? '');
        setCompanyDescription(sessionStorage.getItem('bs_companyDescription') ?? data.company_description ?? '');
        setTopic(sessionStorage.getItem('bs_topic') ?? data.topics ?? '');
        setCategory(sessionStorage.getItem('bs_category') ?? data.default_category ?? 'Product');
        setFbObjective(sessionStorage.getItem('bs_fbObjective') ?? data.default_fb_objective ?? 'Awareness');
        setInstaObjective(sessionStorage.getItem('bs_instaObjective') ?? data.default_insta_objective ?? 'Brand Awareness');
      }
    } catch (error) {
      console.error('Failed to load brand profile', error);
    }
  };

  const handleSave = async () => {
    showLoader('Saving Brand Profile...');
    try {
      // 1. Save Knowledge Base texts
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/knowledge-base/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          topics: topic,
          tone_of_voice: tone,
          target_audience: audience,
          brand_guidelines: guidelines,
          website_url: websiteUrl,
          company_description: companyDescription,
          default_category: category,
          default_fb_objective: fbObjective,
          default_insta_objective: instaObjective
        })
      });

      if (!response.ok) {
        hideLoader();
        showToast('Failed to save profile.', 'error');
        return;
      }

      // 2. Upload brand assets
      const newAssets = assets.filter(a => a.isNew);
      if (newAssets.length > 0) {
        showLoader('Uploading assets...');
        const uploadPromises = newAssets.map((asset) => {
          const file = asset.fileObj;
          const formData = new FormData();
          formData.append('file', file);
          formData.append('name', file.name);
          
          let assetType = asset.explicit_type || 'DOCUMENT';
          if (!asset.explicit_type && file.type.startsWith('image/')) {
            assetType = file.name.toLowerCase().includes('logo') ? 'LOGO' : 'IMAGE';
          }
          formData.append('asset_type', assetType);

          return fetch(`${import.meta.env.VITE_API_URL}/api/assets/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: formData
          });
        });

        await Promise.all(uploadPromises);
        setAssets(prev => prev.filter(a => !a.isNew));
        // Refresh assets from backend to get IDs and proper URLs
        fetchAssets();
      }

      hideLoader();
      sessionStorage.removeItem('bs_has_edits');
      showToast('Brand Knowledge Base updated!', 'success');
    } catch (error) {
      console.error(error);
      hideLoader();
      showToast('Network error.', 'error');
    }
  };

  const handleFileChange = (e, targetType) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        isNew: true, fileObj: f, name: f.name, type: f.type, explicit_type: targetType
      }));
      setAssets(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e, targetType) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({
        isNew: true, fileObj: f, name: f.name, type: f.type, explicit_type: targetType
      }));
      setAssets(prev => [...prev, ...newFiles]);
    }
  };

  const handleDeleteAsset = async (e, idx, asset) => {
    e.stopPropagation();
    if (asset.isNew) {
      setAssets(prev => prev.filter((_, i) => i !== idx));
    } else {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assets/${asset.id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        });
        if (res.ok) {
          setAssets(prev => prev.filter((_, i) => i !== idx));
          showToast('Asset removed', 'success');
        } else {
          showToast('Failed to remove asset', 'error');
        }
      } catch (err) {
        showToast('Network error', 'error');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  return (
    <SidebarLayout title="Brand Knowledge Base">
      <div className="fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Top Header & Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
            Configure your brand identity all in one place. Fill in as much detail as possible to help the AI generate perfectly tailored content for you.
          </p>
          <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            <Save size={16} /> Save Profile
          </button>
        </div>

        {/* Topic Input Area for Generation */}
        <div className="glass-panel hover-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <Type size={20} /> AI Prompt Engine - Topic Selection
          </h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Select a quick prompt or type your topic below. When ready, click "Start Generating" to proceed to Content Studio.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <MultiTagInput 
              options={['Product Launch', 'Hiring Post', 'Tips & Tricks', 'MSME', 'AI Agents', 'Client Testimonial', 'Behind the Scenes', 'Holiday Greetings', 'Industry News', 'Special Offer', 'Company Milestone', 'Event Announcement', 'Educational Post']}
              value={topic} 
              onChange={(val) => { setTopic(val); sessionStorage.setItem('bs_has_edits', 'true'); }} 
            />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={() => navigate('/studio')}
            
          >
            Start Generating in Content Studio &rarr;
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', 
          gap: '1.5rem',
          alignItems: 'stretch'
        }}>
          
          {/* Card 1: Company Details */}
          <div className="glass-panel hover-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)' }}>
                <Building size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Company Details</h3>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Globe size={14} /> Website URL
                </label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('website_url', websiteUrl)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <input 
                type="url" className="input-field" 
                placeholder="https://www.jms-technova.com" 
                value={websiteUrl} onChange={handleChange(setWebsiteUrl, 'bs_websiteUrl')}
                style={{ marginTop: '0.4rem' }}
              />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  Company Description
                </label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('company_description', companyDescription)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <textarea 
                className="input-field" rows="6" 
                placeholder="e.g., JMS TechNova Delivers AI-powered Business Solutions..."
                value={companyDescription} onChange={handleChange(setCompanyDescription, 'bs_companyDescription')}
                style={{ resize: 'vertical', flex: 1, marginTop: '0.4rem' }}
              />
            </div>
          </div>

          {/* Card 2: Voice & Audience */}
          <div className="glass-panel hover-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-secondary)' }}>
                <Users size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Voice & Audience</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  Target Audience
                </label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('target_audience', audience)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <textarea 
                className="input-field" rows="3" 
                placeholder="e.g., B2B SaaS founders, tech enthusiasts..." 
                value={audience} onChange={handleChange(setAudience, 'bs_audience')}
                style={{ resize: 'vertical', marginTop: '0.4rem' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Type size={14} /> Tone & Personality
                </label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('tone_of_voice', tone)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <textarea 
                className="input-field" rows="6" 
                placeholder="e.g., Professional, innovative, and authoritative..."
                value={tone} onChange={handleChange(setTone, 'bs_tone')}
                style={{ resize: 'vertical', flex: 1, marginTop: '0.4rem' }}
              />
            </div>
          </div>

          {/* Card 3: Guidelines */}
          <div className="glass-panel hover-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: '#f59e0b' }}>
                <Check size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Brand Guidelines</h3>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  Rules & Taglines
                </label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('brand_guidelines', guidelines)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <textarea 
                className="input-field" 
                placeholder="e.g., Never use slang. Always mention our #Tagline at the end. Avoid mentioning competitors."
                value={guidelines} onChange={handleChange(setGuidelines, 'bs_guidelines')}
                style={{ resize: 'vertical', flex: 1, minHeight: '140px', marginTop: '0.4rem' }}
              />
            </div>
          </div>

          {/* Card 4: Company Logo Upload */}
          <div className="glass-panel hover-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: '#10b981' }}>
                  <Upload size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Company Logo</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualAssetSave('LOGO')}>
                <Save size={12} /> Save
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div 
                style={{ 
                  border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', 
                  padding: '2rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--transition-fast)', flex: 1, minHeight: '100px'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                onClick={() => logoInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'LOGO')}
              >
                <input 
                  type="file" accept="image/*" ref={logoInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'LOGO')} 
                />
                <Upload size={24} color="var(--color-text-muted)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Upload Logo</p>
              </div>

              {assets.filter(a => a.explicit_type === 'LOGO' || a.asset_type === 'LOGO').length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {assets.filter(a => a.explicit_type === 'LOGO' || a.asset_type === 'LOGO').map((asset, idx) => {
                    const isImage = true;
                    const previewUrl = asset.isNew ? URL.createObjectURL(asset.fileObj) : (asset.url.startsWith('http') ? asset.url : `${import.meta.env.VITE_API_URL}${asset.url}`);
                    return (
                      <div key={idx} style={{ 
                        position: 'relative', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                        overflow: 'hidden', width: '80px', height: '80px', display: 'flex', flexDirection: 'column', 
                        alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)'
                      }}>
                        <img src={previewUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={(e) => handleDeleteAsset(e, assets.indexOf(asset), asset)}
                          style={{
                            position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#ffffff', 
                            border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                          }}
                        ><X size={10} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Brand Documents Upload */}
          <div className="glass-panel hover-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: '#ef4444' }}>
                  <FileText size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Brand Documents</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualAssetSave('DOCUMENT')}>
                <Save size={12} /> Save
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div 
                style={{ 
                  border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', 
                  padding: '2rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--transition-fast)', flex: 1, minHeight: '100px'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                onClick={() => docInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'DOCUMENT')}
              >
                <input 
                  type="file" multiple accept=".pdf,.doc,.docx,.txt" ref={docInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'DOCUMENT')} 
                />
                <Upload size={24} color="var(--color-text-muted)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Upload Knowledge Base Documents</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>PDF, DOCX, TXT</p>
              </div>

              {assets.filter(a => a.explicit_type === 'DOCUMENT' || a.asset_type === 'DOCUMENT').length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {assets.filter(a => a.explicit_type === 'DOCUMENT' || a.asset_type === 'DOCUMENT').map((asset, idx) => {
                    return (
                      <div key={idx} style={{ 
                        position: 'relative', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                        overflow: 'hidden', width: '80px', height: '80px', display: 'flex', flexDirection: 'column', 
                        alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#e11d48', width: '100%' }}>
                          <FileText size={24} />
                          <span style={{ fontSize: '0.55rem', marginTop: '0.4rem', textAlign: 'center', width: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
                            {asset.name}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteAsset(e, assets.indexOf(asset), asset)}
                          style={{
                            position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#ffffff', 
                            border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                          }}
                        ><X size={10} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {/* Card 6: Post Default Settings */}
          <div className="glass-panel hover-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)' }}>
                <Check size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Global Post Settings</h3>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ margin: 0 }}>Default Category</label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('default_category', category)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <MultiTagInput 
                options={['Product', 'Service', 'Event', 'Offer', 'Educational']} 
                value={category} 
                onChange={handleTagChange(setCategory, 'bs_category')} 
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ margin: 0 }}>Facebook Default Objective</label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('default_fb_objective', fbObjective)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <MultiTagInput 
                options={['Awareness', 'Engagement', 'Traffic', 'Leads', 'Sales']} 
                value={fbObjective} 
                onChange={handleTagChange(setFbObjective, 'bs_fbObjective')} 
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ margin: 0 }}>Instagram Default Objective</label>
                <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleIndividualSave('default_insta_objective', instaObjective)}>
                  <Save size={12} /> Save
                </button>
              </div>
              <MultiTagInput 
                options={['Brand Awareness', 'Reach', 'Engagement', 'Conversions']} 
                value={instaObjective} 
                onChange={handleTagChange(setInstaObjective, 'bs_instaObjective')} 
              />
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        [data-theme="dark"] .hover-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
      `}</style>
      
    </SidebarLayout>
  );
};

export default BrandSetup;

