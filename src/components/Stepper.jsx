import React from 'react';
import { Check } from 'lucide-react';

const Stepper = ({ currentStep, steps }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
      {/* Background Line */}
      <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'var(--color-border)', zIndex: 0, transform: 'translateY(-50%)' }} />
      
      {/* Active Line Progress */}
      <div style={{ 
        position: 'absolute', top: '50%', left: '0', height: '2px', 
        background: 'var(--color-primary)', zIndex: 0, transform: 'translateY(-50%)',
        width: `${(currentStep - 1) / (steps.length - 1) * 100}%`,
        transition: 'width 0.4s ease-in-out'
      }} />

      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;

        return (
          <div key={stepNum} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 600,
              background: isCompleted ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
              color: isActive || isCompleted ? '#fff' : 'var(--color-text-muted)',
              border: `2px solid ${isActive || isCompleted ? 'transparent' : 'var(--color-border)'}`,
              boxShadow: isActive ? '0 0 15px rgba(59,130,246,0.5)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {isCompleted ? <Check size={16} strokeWidth={3} /> : stepNum}
            </div>
            <span style={{ 
              position: 'absolute', top: '40px',
              fontSize: '0.7rem', fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              whiteSpace: 'nowrap'
            }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
