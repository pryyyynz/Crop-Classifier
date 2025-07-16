import React, { createContext, useContext, useState, ReactNode } from 'react';

export type FontSize = 'Small' | 'Medium' | 'Large' | 'Very Large';

interface SettingsContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  fontSize: FontSize;
  setFontSize: (value: FontSize) => void;
  offlineMode: boolean;
  setOfflineMode: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>('Medium');
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <SettingsContext.Provider
      value={{
        darkMode,
        setDarkMode,
        fontSize,
        setFontSize,
        offlineMode,
        setOfflineMode,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};