import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Type, Users, Save, Upload, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';

const BrandSetup = () => {
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [assets, setAssets] = useState([]);
  const fileInputRef = React.useRef(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to load brand profile', error);
    }
  };

  const handleSave = async () => {
    showLoader('Saving Brand Profile...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/knowledge-base/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          tone_of_voice: tone,
          target_audience: audience,
          brand_guidelines: guidelines
        })
      });
      if (response.ok) {
        hideLoader();
        showToast('Brand Knowledge Base updated!', 'success');
      } else {
        hideLoader();
        showToast('Failed to save.', 'error');
      }
    } catch (error) {
      hideLoader();
      showToast('Network error.', 'error');
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAssets(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAssets(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  return (
    <SidebarLayout title="Brand Knowledge Base">
      
      <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        
        {/* Stepper Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: 'var(--color-border)', zIndex: 0 }}>
            <div style={{ height: '100%', background: 'var(--color-primary)', width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
          
          {[
            { step: 1, label: 'Tone', icon: <Type size={14} /> },
            { step: 2, label: 'Audience', icon: <Users size={14} /> },
            { step: 3, label: 'Guidelines', icon: <Type size={14} /> },
            { step: 4, label: 'Assets', icon: <Upload size={14} /> },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '0.5rem' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: currentStep >= s.step ? 'var(--color-primary)' : 'var(--color-glass)',
                color: currentStep >= s.step ? 'white' : 'var(--color-text-muted)',
                border: `2px solid ${currentStep >= s.step ? 'var(--color-primary)' : 'var(--color-border)'}`,
                transition: 'all 0.3s ease'
              }}>
                {currentStep > s.step ? <Check size={16} /> : s.icon}
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: currentStep >= s.step ? '600' : '400', color: currentStep >= s.step ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-panel" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            
            {currentStep === 1 && (
              <div className="fade-in">
                <h2 style={{ marginTop: 0 }}>Tone & Personality</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Define how your brand should sound in posts. Is it formal, playful, or inspiring?</p>
                
                <textarea 
                  className="input-field" rows="5" 
                  placeholder="e.g., Professional yet approachable. We use emojis occasionally but remain informative."
                  value={tone} onChange={(e) => setTone(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="fade-in">
                <h2 style={{ marginTop: 0 }}>Target Audience</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Who are you trying to reach? Being specific helps the AI craft better messages.</p>
                
                <input 
                  type="text" className="input-field" 
                  placeholder="e.g., B2B SaaS founders, tech enthusiasts, marketers..." 
                  value={audience} onChange={(e) => setAudience(e.target.value)}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="fade-in">
                <h2 style={{ marginTop: 0 }}>Brand Guidelines</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Are there strict rules? Words to avoid? Taglines to include?</p>
                
                <textarea 
                  className="input-field" rows="5" 
                  placeholder="e.g., Never use slang. Always mention our #Tagline at the end. Avoid mentioning competitors."
                  value={guidelines} onChange={(e) => setGuidelines(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="fade-in">
                <h2 style={{ marginTop: 0 }}>Brand Assets</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Upload logos or other visual assets.</p>
                
                <div 
                  style={{ 
                    border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', 
                    padding: '3rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange} 
                  />
                  <Upload size={24} color="var(--color-text-muted)" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Drag & Drop files</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>or click to browse</p>
                </div>

                {assets.length > 0 && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {assets.map((file, idx) => {
                      const isImage = file.type.startsWith('image/');
                      const previewUrl = isImage ? URL.createObjectURL(file) : null;
                      
                      return (
                        <div key={idx} style={{ 
                          position: 'relative',
                          border: '1px solid var(--color-border)', 
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          width: '100px', height: '100px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--color-bg)'
                        }}>
                          {isImage ? (
                            <img src={previewUrl} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                              {file.name}
                            </div>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssets(prev => prev.filter((_, i) => i !== idx));
                              if (previewUrl) URL.revokeObjectURL(previewUrl);
                            }}
                            title="Remove file"
                            style={{
                              position: 'absolute', top: '4px', right: '4px',
                              background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                              borderRadius: '50%', width: '20px', height: '20px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', padding: 0
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
          </div>
          
          {/* Stepper Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <button 
              className="btn btn-secondary" 
              onClick={prevStep} 
              disabled={currentStep === 1}
              style={{ opacity: currentStep === 1 ? 0 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ChevronLeft size={14} /> Back
            </button>
            
            {currentStep < totalSteps ? (
              <button className="btn btn-primary" onClick={nextStep} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success)', color: 'white', borderColor: 'var(--color-success)' }}>
                <Save size={14} /> Save Profile
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
    </SidebarLayout>
  );
};

export default BrandSetup;
