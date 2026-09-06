import React, { createContext, useContext, useState } from 'react';
import GlobalLoader from '../components/GlobalLoader';

const LoaderContext = createContext();

export const useLoader = () => {
  return useContext(LoaderContext);
};

export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoader = (text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      {isLoading && <GlobalLoader text={loadingText} />}
    </LoaderContext.Provider>
  );
};
