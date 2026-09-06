import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius, type = 'text', style = {} }) => {
  const inlineStyles = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius: borderRadius || (type === 'circle' ? '50%' : '4px'),
    ...style,
  };

  return <div className={`skeleton ${type}`} style={inlineStyles}></div>;
};

export default Skeleton;
