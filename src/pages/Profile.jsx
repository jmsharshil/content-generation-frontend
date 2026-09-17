import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { User, Building, Mail, Hash, Globe, Edit3, Save, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLoader } from '../context/LoaderContext';

const Profile = () => {
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoader();
  const [profile, setProfile] = useState(() => {
    const id = localStorage.getItem('user_id');
    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('business_name');
    return (id || email || name) ? { id, email, business_name: name } : null;
  });
  
  const [metaInfo, setMetaInfo] = useState(() => {
    return { 
      isConnected: localStorage.getItem('meta_is_connected') === 'true', 
      pageId: localStorage.getItem('meta_page_id'), 
      pageName: localStorage.getItem('meta_page_name') 
    };
  });

  const [pages, setPages] = useState([]);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [selectedPage, setSelectedPage] = useState('');

  const [adAccounts, setAdAccounts] = useState([]);
  const [isEditingAdAccount, setIsEditingAdAccount] = useState(false);
  const [selectedAdAccount, setSelectedAdAccount] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchMetaStatus();
  }, []);

  const fetchMetaStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/status/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        let pageName = null;
        
        if (data.is_connected) {
          const pagesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/pages/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
          });
          if (pagesRes.ok) {
            const pagesData = await pagesRes.json();
            const pagesArray = Array.isArray(pagesData) ? pagesData : (pagesData.pages || pagesData.data || []);
            setPages(pagesArray);
            
            if (data.page_id) {
              const connectedPage = pagesArray.find(p => p.id === data.page_id);
              if (connectedPage) pageName = connectedPage.name;
            }
          }

          // Fetch Ad Accounts
          const adRes = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/ad-accounts/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
          });
          if (adRes.ok) {
            const adData = await adRes.json();
            const adArray = Array.isArray(adData) ? adData : (adData.ad_accounts || adData.data || []);
            setAdAccounts(adArray);
          }
        }
        
        setMetaInfo({ isConnected: data.is_connected, pageId: data.page_id, pageName, adAccountId: data.ad_account_id });
        setSelectedPage(data.page_id || '');
        setSelectedAdAccount(data.ad_account_id || '');
        if (data.ad_account_id) localStorage.setItem('meta_ad_account_id', data.ad_account_id);
        localStorage.setItem('meta_is_connected', data.is_connected);
        if (data.page_id) localStorage.setItem('meta_page_id', data.page_id);
        if (pageName) localStorage.setItem('meta_page_name', pageName);
      }
    } catch (error) {
      console.error('Failed to load meta status', error);
    }
  };

  const fetchProfile = async () => {
    showLoader('Loading Profile...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        if (data.id) localStorage.setItem('user_id', data.id);
        if (data.email) localStorage.setItem('user_email', data.email);
        if (data.business_name) localStorage.setItem('business_name', data.business_name);
      } else {
        showToast('Failed to load profile data', 'error');
      }
    } catch (error) {
      showToast('Could not load profile.', 'error');
    } finally {
      hideLoader();
    }
  };

  const handleSavePage = async () => {
    if (!selectedPage) {
      showToast('Please select a page first', 'info');
      return;
    }
    
    showLoader('Saving page selection...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/pages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ page_id: selectedPage })
      });
      
      if (res.ok) {
        showToast('Facebook page updated successfully!', 'success');
        setIsEditingPage(false);
        fetchMetaStatus(); // Refresh to get updated names
      } else {
        showToast('Failed to update page', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      hideLoader();
    }
  };

  const handleSaveAdAccount = async () => {
    if (!selectedAdAccount) {
      showToast('Please select an Ad Account first', 'info');
      return;
    }
    
    showLoader('Saving ad account...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/ad-accounts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ ad_account_id: selectedAdAccount })
      });
      
      if (res.ok) {
        showToast('Ad Account linked successfully!', 'success');
        setIsEditingAdAccount(false);
        fetchMetaStatus();
      } else {
        const errorData = await res.json();
        showToast(`Failed to link Ad Account: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast('Network error while saving Ad Account', 'error');
    } finally {
      hideLoader();
    }
  };

  return (
    <SidebarLayout title="Profile">
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={32} color="var(--color-primary)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{profile?.business_name || 'Business Name'}</h2>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Manage your account details</p>
          </div>
        </div>

        {profile ? (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <Hash size={18} color="var(--color-text-muted)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>User ID</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{profile.id || 'N/A'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <Mail size={18} color="var(--color-text-muted)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{profile.email || 'No email provided'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <Building size={18} color="var(--color-text-muted)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Business Name</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{profile.business_name || 'N/A'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', marginTop: '4px' }}>
                <Globe size={18} color="var(--color-text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Connected Facebook Page</p>
                
                {!isEditingPage ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {metaInfo.pageName 
                        ? `${metaInfo.pageName}` 
                        : metaInfo.pageId || (metaInfo.isConnected ? 'Account linked, but no page selected' : 'Not Connected')}
                    </p>
                    {metaInfo.isConnected && (
                      <button 
                        onClick={() => setIsEditingPage(true)} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <Edit3 size={12} /> Change Page
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <select 
                      className="input-field" 
                      value={selectedPage} 
                      onChange={(e) => setSelectedPage(e.target.value)}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Select a Facebook Page --</option>
                      {pages.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary" onClick={handleSavePage} style={{ padding: '0.4rem 0.6rem' }}>
                      <Save size={14} />
                    </button>
                    <button className="btn btn-secondary" onClick={() => {setIsEditingPage(false); setSelectedPage(metaInfo.pageId || '');}} style={{ padding: '0.4rem 0.6rem' }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
                
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', marginTop: '4px' }}>
                <Globe size={18} color="var(--color-text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Ads Manager Account</p>
                
                {!isEditingAdAccount ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      {metaInfo.adAccountId 
                        ? (() => {
                            const acc = adAccounts.find(a => a.id === metaInfo.adAccountId || a.account_id === metaInfo.adAccountId.replace('act_', ''));
                            return acc ? `${acc.name || 'Ad Account'} (${metaInfo.adAccountId})` : metaInfo.adAccountId;
                          })()
                        : (metaInfo.isConnected ? 'Account linked, but no Ad Account selected' : 'Not Connected')}
                    </p>
                    {metaInfo.isConnected && (
                      <button 
                        onClick={() => setIsEditingAdAccount(true)} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <Edit3 size={12} /> Change Ad Account
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <select 
                      className="input-field" 
                      value={selectedAdAccount} 
                      onChange={(e) => setSelectedAdAccount(e.target.value)}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Select an Ad Account --</option>
                      {adAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name || a.id}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary" onClick={handleSaveAdAccount} style={{ padding: '0.4rem 0.6rem' }}>
                      <Save size={14} />
                    </button>
                    <button className="btn btn-secondary" onClick={() => {setIsEditingAdAccount(false); setSelectedAdAccount(metaInfo.adAccountId || '');}} style={{ padding: '0.4rem 0.6rem' }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading profile information...
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Profile;
