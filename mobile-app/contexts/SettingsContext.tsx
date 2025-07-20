import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConnectivity } from '../utils/connectivityService';

type FontSize = 'Small' | 'Medium' | 'Large' | 'Very Large';

interface SettingsContextType {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  offlineMode: boolean;
  setOfflineMode: (value: boolean) => Promise<void>;
  // Connectivity properties from the enhanced service
  isOnline: boolean;
  canUseOnlineFeatures: boolean;
  connectionQuality?: 'poor' | 'good' | 'excellent';
  connectionType?: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>('Medium');
  const connectivity = useConnectivity();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      const savedFontSize = await AsyncStorage.getItem('fontSize');

      if (savedDarkMode !== null) {
        setDarkModeState(savedDarkMode === 'true');
      }

      if (savedFontSize !== null) {
        setFontSizeState(savedFontSize as FontSize);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const setDarkMode = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('darkMode', value.toString());
      setDarkModeState(value);
    } catch (error) {
      console.error('Failed to save dark mode setting:', error);
    }
  };

  const setFontSize = async (size: FontSize) => {
    try {
      await AsyncStorage.setItem('fontSize', size);
      setFontSizeState(size);
    } catch (error) {
      console.error('Failed to save font size setting:', error);
    }
  };

  const setOfflineMode = async (value: boolean) => {
    try {
      await connectivity.setOfflineMode(value);
    } catch (error) {
      console.error('Failed to set offline mode:', error);
      throw error;
    }
  };

  const contextValue: SettingsContextType = {
    darkMode,
    setDarkMode,
    fontSize,
    setFontSize,
    offlineMode: connectivity.isOfflineMode,
    setOfflineMode,
    isOnline: connectivity.isOnline,
    canUseOnlineFeatures: connectivity.canUseOnlineFeatures,
    connectionQuality: connectivity.connectionQuality,
    connectionType: connectivity.connectionType,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}