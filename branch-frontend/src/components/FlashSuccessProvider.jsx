import { createContext, useContext, useState, useCallback } from 'react';
import FlashSuccess from './FlashSuccess';

const FlashSuccessContext = createContext(null);

export const useFlashSuccess = () => {
  const context = useContext(FlashSuccessContext);
  if (!context) {
    throw new Error('useFlashSuccess must be used within FlashSuccessProvider');
  }
  return context;
};

export const FlashSuccessProvider = ({ children }) => {
  const [flash, setFlash] = useState({
    show: false,
    message: '',
    icon: 'check',
    onComplete: null,
  });

  const showFlash = useCallback((message, options = {}) => {
    const { icon = 'check', onComplete = null } = options;
    setFlash({
      show: true,
      message,
      icon,
      onComplete,
    });
  }, []);

  const hideFlash = useCallback(() => {
    setFlash((prev) => ({ ...prev, show: false }));
  }, []);

  const handleFlashComplete = useCallback(() => {
    if (flash.onComplete) {
      flash.onComplete();
    }
    hideFlash();
  }, [flash.onComplete, hideFlash]);

  return (
    <FlashSuccessContext.Provider value={{ showFlash, hideFlash }}>
      {children}
      <FlashSuccess
        show={flash.show}
        message={flash.message}
        icon={flash.icon}
        onComplete={handleFlashComplete}
      />
    </FlashSuccessContext.Provider>
  );
};
