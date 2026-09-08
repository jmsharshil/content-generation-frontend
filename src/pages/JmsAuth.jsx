import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Building, Eye, EyeOff } from 'lucide-react';
import { useLoader } from '../context/LoaderContext';
import { useToast } from '../context/ToastContext';

const JmsAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', businessName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = React.useRef(null);
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showToast } = useToast();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom Validation
    if (!isLogin && !formData.businessName.trim()) {
      showToast('Please enter your business name.', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    if (!formData.password) {
      showToast('Please enter your password.', 'error');
      return;
    }

    showLoader(isLogin ? 'Authenticating...' : 'Creating Account...');
    try {
      const endpoint = isLogin ? '/api/auth/login/' : '/api/auth/signup/';
      const payload = isLogin 
        ? { username: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, business_name: formData.businessName };

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        if (!isLogin) {
          const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formData.email, password: formData.password })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) {
            localStorage.setItem('jwt_token', loginData.access);
            localStorage.setItem('jwt_refresh', loginData.refresh);
            hideLoader(); showToast('Account created!', 'success'); navigate('/meta-connect');
          } else { throw new Error('Auto-login failed.'); }
        } else {
          localStorage.setItem('jwt_token', data.access);
          localStorage.setItem('jwt_refresh', data.refresh);
          hideLoader(); showToast('Welcome back!', 'success'); navigate('/meta-connect');
        }
      } else {
        hideLoader();
        const msg = data.detail || data.error || Object.values(data)[0]?.[0] || 'Authentication failed.';
        showToast(msg, 'error');
      }
    } catch (error) { hideLoader(); showToast('Network error.', 'error'); }
  };

  return (
    <div className="auth-wrapper" style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center' }}>
      <div className="auth-container" style={{ display: 'flex', width: '100%', maxWidth: '1000px' }}>
        
        {/* Left side — hidden on mobile */}
        <div className="auth-branding" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem' }}>
          <div>
            <img src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png" alt="JMS" style={{ height: '36px', marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>
              Automate your<br/><span className="text-gradient">content engine.</span>
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: '380px', lineHeight: '1.6' }}>
              Connect your Meta accounts, define your brand voice, and let AI generate your social calendar.
            </p>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '1.75rem' }}>
          
          {/* Mobile logo */}
          <div className="auth-mobile-logo" style={{ display: 'none', textAlign: 'center', marginBottom: '1rem' }}>
            <img src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png" alt="JMS" style={{ height: '32px' }} />
          </div>

          <h2 style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {!isLogin && (
              <div>
                <label className="label">Business Name</label>
                <div style={{ position: 'relative' }}>
                  <Building size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" name="businessName" className="input-field" placeholder="Acme Corp" style={{ paddingLeft: '2rem' }} value={formData.businessName} onChange={handleInputChange} required />
                </div>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  name="email" 
                  className="input-field" 
                  placeholder="you@company.com" 
                  style={{ paddingLeft: '2rem' }} 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  required 
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  ref={passwordRef}
                  className="input-field" 
                  placeholder="••••••••" 
                  style={{ paddingLeft: '2rem', paddingRight: '2rem' }} 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                />
                <div 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex', color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', padding: '0.55rem' }}>
              <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: '500' }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </span>
          </div>
        </div>
      </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .auth-wrapper {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh;
          }
          .auth-branding {
            display: none !important;
          }
          .auth-mobile-logo {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default JmsAuth;
