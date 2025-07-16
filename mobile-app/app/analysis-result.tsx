import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';

export default function AnalysisResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { darkMode, fontSize } = useSettings();
  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  // Use params if available, otherwise fallback to default values
  const disease = params.disease as string || 'Bacterial Blight';
  const confidence = params.confidence as string || '96.4%';
  const image = params.image as string || 'https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=1';
  const description = params.description as string || 'Bacterial blight is a common plant disease caused by various bacterial pathogens. It typically appears as water-soaked lesions on leaves that eventually turn brown or black. The disease can spread rapidly in warm, humid conditions and may cause significant damage to crops if left untreated.\n\nEarly detection and proper management are crucial for preventing the spread of this disease. Treatment options include copper-based fungicides, improved air circulation, and removal of infected plant material.';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>Analysis Result</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: image }}
          style={styles.plantImage}
        />

        <View style={styles.resultContainer}>
          <Text style={[styles.diseaseLabel, { color: colors.textSecondary, fontSize: 18 * fontMultiplier }]}>Disease:</Text>
          <Text style={[styles.diseaseName, { color: colors.text, fontSize: 32 * fontMultiplier }]}>{disease}</Text>
          <Text style={[styles.confidence, { fontSize: 16 * fontMultiplier }]}>Confidence: {confidence}</Text>
        </View>

        <View style={[styles.descriptionContainer, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.descriptionTitle, { color: colors.text, fontSize: 18 * fontMultiplier }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
            {description}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { fontSize: 16 * fontMultiplier }]}>Back</Text>
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
    paddingTop: 32,
  },
  scrollContent: {
    alignItems: 'center',
  },
  plantImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 32,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  diseaseLabel: {
    marginBottom: 8,
  },
  diseaseName: {
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  confidence: {
    color: '#22c55e',
    fontWeight: '600',
  },
  descriptionContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  descriptionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionText: {
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});