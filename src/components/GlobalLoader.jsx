import React from 'react';
import { Sparkles } from 'lucide-react';

const GlobalLoader = ({ text }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(11, 15, 25, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      
      {/* Outer animated ring */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: 'var(--color-primary)',
          borderBottomColor: 'var(--color-secondary)',
          animation: 'spinOrbit 1.5s linear infinite',
        }} />
        
        {/* Inner glowing circle with logo */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'var(--color-bg-secondary)',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}>
          <img 
            src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png" 
            alt="JMS" 
            style={{ height: '32px', objectFit: 'contain' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sparkles size={16} color="var(--color-primary)" className="animate-pulse" />
        <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '1px' }}>
          {text}
        </h3>
      </div>
      
    </div>
  );
};

export default GlobalLoader;
