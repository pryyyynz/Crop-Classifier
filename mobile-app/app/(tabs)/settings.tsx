import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Leaf, ChevronRight, ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';

export default function SettingsScreen() {
  const { darkMode, setDarkMode, fontSize, setFontSize, offlineMode, setOfflineMode } = useSettings();
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const router = useRouter();

  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  const fontSizes = ['Small', 'Medium', 'Large', 'Very Large'];

  const handleAbout = () => {
    router.push('/about');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dark Mode Toggle */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#d1d5db', true: '#22c55e' }}
            thumbColor={darkMode ? '#ffffff' : '#ffffff'}
          />
        </View>

        {/* Font Size Selection */}
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}
          onPress={() => setShowFontSizePicker(!showFontSizePicker)}
        >
          <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>Font Size</Text>
          <View style={styles.fontSizeContainer}>
            <Text style={[styles.fontSizeValue, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>{fontSize}</Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {showFontSizePicker && (
          <View style={[styles.picker, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {fontSizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setFontSize(size as any);
                  setShowFontSizePicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Offline Mode Toggle */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>Offline Mode</Text>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: '#d1d5db', true: '#22c55e' }}
            thumbColor={offlineMode ? '#ffffff' : '#ffffff'}
          />
        </View>

        {/* About */}
        <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground }]} onPress={handleAbout}>
          <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>About</Text>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '600',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingText: {
    fontWeight: '500',
  },
  fontSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontSizeValue: {
    marginRight: 8,
  },
  picker: {
    borderRadius: 8,
    marginTop: -16,
    marginBottom: 16,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  pickerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerText: {
  },
});