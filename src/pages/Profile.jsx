import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { User, Building, Mail, Hash, Globe } from 'lucide-react';
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
        
        if (data.page_id) {
          const pagesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/meta/pages/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
          });
          if (pagesRes.ok) {
            const pagesData = await pagesRes.json();
            const pagesArray = Array.isArray(pagesData) ? pagesData : (pagesData.pages || pagesData.data || []);
            const connectedPage = pagesArray.find(p => p.id === data.page_id);
            if (connectedPage) pageName = connectedPage.name;
          }
        }
        
        setMetaInfo({ isConnected: data.is_connected, pageId: data.page_id, pageName });
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <Globe size={18} color="var(--color-text-muted)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Connected Facebook Page</p>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {metaInfo.pageName 
                    ? `${metaInfo.pageName} (${metaInfo.pageId})` 
                    : metaInfo.pageId || (metaInfo.isConnected ? 'Account linked, but no page selected' : 'Not Connected')}
                </p>
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

