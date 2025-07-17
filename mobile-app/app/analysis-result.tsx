import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';
import { ClassificationResult } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AnalysisResultScreen() {
  const { darkMode, fontSize } = useSettings();
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const storedResult = await AsyncStorage.getItem('classificationResult');
      const storedImage = await AsyncStorage.getItem('analysisImage');

      if (storedResult) {
        setResult(JSON.parse(storedResult));
      }
      if (storedImage) {
        setImageUri(storedImage);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDiseaseName = (name: string) => {
    return name.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getHealthStatusColor = () => {
    if (!result) return colors.text;
    return result.is_healthy ? '#22c55e' : '#ef4444';
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleTakeAnother = () => {
    router.push('/(tabs)');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={[styles.loadingText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
            Loading results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text, fontSize: 24 * fontMultiplier }]}>
            No Results Found
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>
            Please analyze an image first.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleTakeAnother}
          >
            <Text style={[styles.buttonText, { fontSize: 16 * fontMultiplier }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>Analysis Result</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Disease Image */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.diseaseImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                No image available
              </Text>
            </View>
          )}
        </View>

        {/* Disease Information */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.diseaseTitle, { color: colors.text, fontSize: 24 * fontMultiplier }]}>
            Disease: {formatDiseaseName(result.predicted_disease)}
          </Text>

          <Text style={[styles.confidence, { color: getHealthStatusColor(), fontSize: 18 * fontMultiplier }]}>
            Confidence: {result.confidence}%
          </Text>

          <Text style={[styles.healthStatus, { color: getHealthStatusColor(), fontSize: 16 * fontMultiplier }]}>
            Status: {result.is_healthy ? 'Healthy' : 'Diseased'}
          </Text>
        </View>

        {/* Top Predictions */}
        {result.top_predictions && result.top_predictions.length > 1 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * fontMultiplier }]}>
              Top Predictions
            </Text>
            {result.top_predictions.slice(0, 3).map((prediction, index) => (
              <View key={index} style={[styles.predictionItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.predictionName, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
                  {formatDiseaseName(prediction.disease)}
                </Text>
                <Text style={[styles.predictionConfidence, { fontSize: 16 * fontMultiplier }]}>
                  {prediction.confidence}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Analysis Results */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * fontMultiplier }]}>
            Analysis Results
          </Text>

          <View style={styles.resultItem}>
            <Text style={[styles.resultLabel, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
              Crop Type:
            </Text>
            <Text style={[styles.resultValue, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>
              {result.crop_type.charAt(0).toUpperCase() + result.crop_type.slice(1)}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={[styles.resultLabel, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
              Disease:
            </Text>
            <Text style={[styles.resultValue, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>
              {formatDiseaseName(result.predicted_disease)}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={[styles.resultLabel, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
              Health Status:
            </Text>
            <Text style={[styles.resultValue, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>
              {result.is_healthy ? 'Plant appears healthy' : 'Disease detected'}
            </Text>
          </View>

          <View style={styles.resultItem}>
            <Text style={[styles.resultLabel, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
              Description:
            </Text>
            <Text style={[styles.resultDescription, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>
              {result.description}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTakeAnother}>
            <Text style={[styles.buttonText, { fontSize: 16 * fontMultiplier }]}>Analyze Another Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: '#22c55e' }]}
            onPress={handleGoBack}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText, { fontSize: 16 * fontMultiplier }]}>
              Back to Home
            </Text>
          </TouchableOpacity>
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
    marginRight: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  diseaseImage: {
    width: 300,
    height: 200,
    borderRadius: 12,
  },
  placeholderImage: {
    width: 300,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  diseaseTitle: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  confidence: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  healthStatus: {
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  predictionName: {
    flex: 1,
  },
  predictionConfidence: {
    fontWeight: '600',
    color: '#22c55e',
  },
  resultItem: {
    marginBottom: 12,
  },
  resultLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  resultValue: {
    lineHeight: 20,
  },
  resultDescription: {
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  secondaryButtonText: {
    color: '#22c55e',
  },
});