import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Type, Users, Save, Upload, ChevronRight, ChevronLeft, Check, X, Building, Globe, FileText } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';

const BrandSetup = () => {
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [assets, setAssets] = useState([]);
  const fileInputRef = React.useRef(null);
  
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();

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
        setTone(data.tone_of_voice || '');
        setAudience(data.target_audience || '');
        setGuidelines(data.brand_guidelines || '');
        setWebsiteUrl(data.website_url || '');
        setCompanyDescription(data.company_description || '');
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
          tone_of_voice: tone,
          target_audience: audience,
          brand_guidelines: guidelines,
          website_url: websiteUrl,
          company_description: companyDescription
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
          
          let assetType = 'DOCUMENT';
          if (file.type.startsWith('image/')) {
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
      showToast('Brand Knowledge Base updated!', 'success');
    } catch (error) {
      console.error(error);
      hideLoader();
      showToast('Network error.', 'error');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        isNew: true, fileObj: f, name: f.name, type: f.type
      }));
      setAssets(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({
        isNew: true, fileObj: f, name: f.name, type: f.type
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
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={14} /> Website URL
              </label>
              <input 
                type="url" className="input-field" 
                placeholder="https://www.jms-technova.com" 
                value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Company Description
              </label>
              <textarea 
                className="input-field" rows="6" 
                placeholder="e.g., JMS TechNova Delivers AI-powered Business Solutions..."
                value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)}
                style={{ resize: 'vertical', flex: 1 }}
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
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Target Audience
              </label>
              <textarea 
                className="input-field" rows="3" 
                placeholder="e.g., B2B SaaS founders, tech enthusiasts..." 
                value={audience} onChange={(e) => setAudience(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Type size={14} /> Tone & Personality
              </label>
              <textarea 
                className="input-field" rows="6" 
                placeholder="e.g., Professional, innovative, and authoritative..."
                value={tone} onChange={(e) => setTone(e.target.value)}
                style={{ resize: 'vertical', flex: 1 }}
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
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Rules & Taglines
              </label>
              <textarea 
                className="input-field" 
                placeholder="e.g., Never use slang. Always mention our #Tagline at the end. Avoid mentioning competitors."
                value={guidelines} onChange={(e) => setGuidelines(e.target.value)}
                style={{ resize: 'vertical', flex: 1, minHeight: '140px' }}
              />
            </div>
          </div>

          {/* Card 4: Assets (Takes full width if needed via grid auto-flow, but fits nicely as a card too) */}
          <div className="glass-panel hover-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: '#10b981' }}>
                <Upload size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Brand Assets</h3>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div 
                style={{ 
                  border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', 
                  padding: '2rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--transition-fast)', flex: 1, minHeight: '140px'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input 
                  type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} 
                />
                <Upload size={24} color="var(--color-text-muted)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Drag & Drop files</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Upload logos, PDFs, or images</p>
              </div>

              {assets.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {assets.map((asset, idx) => {
                    const isImage = asset.isNew ? asset.type.startsWith('image/') : (asset.asset_type === 'IMAGE' || asset.asset_type === 'LOGO');
                    const isPdf = asset.isNew ? asset.type === 'application/pdf' : asset.asset_type === 'DOCUMENT';
                    
                    const previewUrl = asset.isNew 
                      ? (isImage ? URL.createObjectURL(asset.fileObj) : null) 
                      : (isImage ? (asset.url.startsWith('http') ? asset.url : `${import.meta.env.VITE_API_URL}${asset.url}`) : null);
                    
                    return (
                      <div key={idx} style={{ 
                        position: 'relative', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                        overflow: 'hidden', width: '80px', height: '80px', display: 'flex', flexDirection: 'column', 
                        alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)'
                      }}>
                        {isImage ? (
                          <img src={previewUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : isPdf ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#e11d48', width: '100%' }}>
                            <FileText size={24} />
                            <span style={{ fontSize: '0.55rem', marginTop: '0.4rem', textAlign: 'center', width: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
                              {asset.name}
                            </span>
                          </div>
                        ) : (
                          <div style={{ padding: '0.25rem', textAlign: 'center', fontSize: '0.6rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                            {asset.name}
                          </div>
                        )}
                        <button 
                          onClick={(e) => handleDeleteAsset(e, idx, asset)}
                          title="Remove file"
                          style={{
                            position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', 
                            border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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
