import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';

export default function AboutScreen() {
  const router = useRouter();
  const { darkMode, fontSize } = useSettings();
  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>About</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.appName, { color: colors.text, fontSize: 28 * fontMultiplier }]}>GreenCheck</Text>
          <Text style={[styles.version, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>Version 1.0.0</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>About This App</Text>
          <Text style={[styles.description, { color: colors.text, fontSize: 16 * fontMultiplier }]}>GreenCheck is an AI-powered mobile application designed to help farmers and agricultural professionals identify plant diseases quickly and accurately. Using advanced machine learning algorithms, the app can analyze images of crops and provide instant disease detection with confidence ratings.</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>Contact & Support</Text>
          <Text style={[styles.description, { color: colors.text, fontSize: 16 * fontMultiplier }]}>For technical support, feature requests, or general inquiries, please contact our support team at dugboryeleprince@gmail.com</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.copyright, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>© 2025 GreenCheck. All rights reserved.</Text>
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
  backButton: {
    marginRight: 16,
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
  section: {
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
  appName: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    lineHeight: 24,
  },
  featureItem: {
    lineHeight: 24,
    marginBottom: 4,
  },
  copyright: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});