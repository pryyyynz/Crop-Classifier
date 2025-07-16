import { FontSize } from '@/contexts/SettingsContext';

export const getFontSizeMultiplier = (fontSize: FontSize): number => {
  switch (fontSize) {
    case 'Small':
      return 0.85;
    case 'Medium':
      return 1;
    case 'Large':
      return 1.15;
    case 'Very Large':
      return 1.35;
    default:
      return 1;
  }
};

export const getColors = (darkMode: boolean) => ({
  background: darkMode ? '#111827' : '#f9fafb',
  cardBackground: darkMode ? '#1f2937' : '#ffffff',
  text: darkMode ? '#f9fafb' : '#111827',
  textSecondary: darkMode ? '#9ca3af' : '#6b7280',
  border: darkMode ? '#374151' : '#e5e7eb',
  primary: '#22c55e',
  headerBackground: darkMode ? '#1f2937' : '#ffffff',
});