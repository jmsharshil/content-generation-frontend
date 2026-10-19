import React, { createContext, useContext, useState } from 'react';
import GlobalLoader from '../components/GlobalLoader';

const LoaderContext = createContext();

export const useLoader = () => {
  return useContext(LoaderContext);
};

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [progress, setProgress] = useState(null);
  const [subText, setSubText] = useState('');

  const showLoader = (text = 'Loading...', initialProgress = null, initialSubText = '') => {
    setLoadingText(text);
    setProgress(initialProgress);
    setSubText(initialSubText);
    setIsLoading(true);
  };

  const updateLoader = (options = {}) => {
    if (options.text !== undefined) setLoadingText(options.text);
    if (options.progress !== undefined) setProgress(options.progress);
    if (options.subText !== undefined) setSubText(options.subText);
  };

  const hideLoader = () => {
    setIsLoading(false);
    setProgress(null);
    setSubText('');
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader, updateLoader, progress, setProgress, setSubText }}>
      {children}
      {isLoading && <GlobalLoader text={loadingText} progress={progress} subText={subText} />}
    </LoaderContext.Provider>
  );
};
