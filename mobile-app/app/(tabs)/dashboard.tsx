import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';

export default function DashboardScreen() {
  const { darkMode, fontSize } = useSettings();
  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>Detect Crop Disease</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.dashboardTitle, { color: colors.text, fontSize: 32 * fontMultiplier }]}>Dashboard</Text>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>Total Scans</Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: 48 * fontMultiplier }]}>124</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>Diseased Plants</Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: 48 * fontMultiplier }]}>23.4%</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>Healthy Plants</Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: 48 * fontMultiplier }]}>76.4%</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>Last Scan Date</Text>
            <Text style={[styles.statValue, { color: colors.text, fontSize: 48 * fontMultiplier }]}>20th March 2025</Text>
          </View>
        </View>
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
    paddingTop: 32,
  },
  dashboardTitle: {
    fontWeight: '700',
    marginBottom: 32,
  },
  statsContainer: {
    gap: 16,
  },
  statCard: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    marginBottom: 8,
  },
  statValue: {
    fontWeight: '700',
  },
});