import React from 'react';
import { Sparkles } from 'lucide-react';

const GlobalLoader = ({ text, progress, subText }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      padding: '1.5rem',
      textAlign: 'center'
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
          width: '82px',
          height: '82px',
          background: 'var(--color-bg-secondary)',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 0 25px rgba(59, 130, 246, 0.45)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }}>
          <img 
            src="https://hrmsknowcraftstorage.blob.core.windows.net/media/JMS.png" 
            alt="JMS" 
            style={{ height: '32px', objectFit: 'contain' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: progress !== null ? '0.75rem' : '0' }}>
        <Sparkles size={18} color="var(--color-primary)" className="animate-pulse" />
        <h3 className="text-gradient" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px' }}>
          {text}
        </h3>
      </div>

      {/* Progress Bar & Percentage when available */}
      {progress !== null && (
        <div style={{ width: '100%', maxWidth: '340px', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            fontWeight: 500,
            padding: '0 2px'
          }}>
            <span>{subText || 'Processing...'}</span>
            <span style={{ 
              fontWeight: 700, 
              color: 'var(--color-primary)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.95rem'
            }}>
              {Math.min(100, Math.round(progress))}%
            </span>
          </div>

          {/* Bar track */}
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '1px solid var(--color-glass-border)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: `${Math.min(100, Math.max(5, progress))}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--color-primary), #a855f7)',
              borderRadius: '999px',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)'
            }} />
          </div>
        </div>
      )}
      
    </div>
  );
};

export default GlobalLoader;
