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

// Format AI advice text to handle markdown-like formatting for React Native
export const formatAIText = (text: string): string => {
  if (!text) return text;

  return text
    // Handle bold text: **text** -> remove asterisks and we'll handle styling separately
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Handle numbered lists: add proper spacing
    .replace(/^(\d+\.\s)/gm, '\n$1')
    // Handle bullet points: - or * at start of line
    .replace(/^[-*]\s/gm, '\n• ')
    // Handle line breaks properly
    .replace(/\n\n/g, '\n\n')
    // Clean up any leading newlines
    .replace(/^\n/, '');
};

// Parse text into segments for React Native rendering with bold support
export const parseTextForRN = (text: string): Array<{ text: string; bold: boolean }> => {
  if (!text) return [];

  const segments: Array<{ text: string; bold: boolean }> = [];
  const parts = text.split(/(\*\*.*?\*\*)/g);

  parts.forEach(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      const boldText = part.slice(2, -2);
      if (boldText) {
        segments.push({ text: boldText, bold: true });
      }
    } else if (part) {
      // Regular text
      segments.push({ text: part, bold: false });
    }
  });

  return segments;
};