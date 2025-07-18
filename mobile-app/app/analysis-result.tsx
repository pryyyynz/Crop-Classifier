import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, ArrowLeft, Brain, AlertTriangle, CheckCircle, MessageCircle, Eye, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';
import { ClassificationResult } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormattedText } from '@/components/FormattedText';

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

  const getHealthStatusIcon = () => {
    if (!result) return null;
    return result.is_healthy ?
      <CheckCircle size={20} color="#22c55e" /> :
      <AlertTriangle size={20} color="#ef4444" />;
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleTakeAnother = () => {
    router.push('/(tabs)');
  };

  // Check if AI advice was requested but not yet available
  const aiAdviceRequested = result?.user_question || result?.notes;
  const shouldShowAiLoading = aiAdviceRequested && !result?.ai_advice && !result?.ai_advice_error;

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
          <TouchableOpacity style={styles.button} onPress={handleTakeAnother}>
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
          <View style={styles.diseaseHeader}>
            {getHealthStatusIcon()}
            <Text style={[styles.diseaseTitle, { color: colors.text, fontSize: 22 * fontMultiplier }]}>
              {formatDiseaseName(result.predicted_disease)}
            </Text>
          </View>

          <Text style={[styles.confidence, { color: getHealthStatusColor(), fontSize: 18 * fontMultiplier }]}>
            Confidence: {result.confidence}%
          </Text>

          <Text style={[styles.healthStatus, { color: getHealthStatusColor(), fontSize: 16 * fontMultiplier }]}>
            Status: {result.is_healthy ? 'Healthy Plant' : 'Disease Detected'}
          </Text>

          <View style={styles.cropTypeContainer}>
            <Text style={[styles.cropTypeLabel, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
              Crop Type:
            </Text>
            <View style={styles.cropTypeBadge}>
              <Text style={[styles.cropTypeText, { fontSize: 14 * fontMultiplier }]}>
                {result.crop_type.charAt(0).toUpperCase() + result.crop_type.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Predictions */}
        {result.top_predictions && result.top_predictions.length > 1 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * fontMultiplier }]}>
              Top Predictions
            </Text>
            {result.top_predictions.slice(0, 3).map((prediction, index) => (
              <View key={index} style={[styles.predictionItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.predictionName, { color: colors.text, fontSize: 14 * fontMultiplier }]}>
                  {formatDiseaseName(prediction.disease)}
                </Text>
                <Text style={[styles.predictionConfidence, { fontSize: 14 * fontMultiplier }]}>
                  {prediction.confidence}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Basic Description */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 18 * fontMultiplier }]}>
            Basic Description
          </Text>
          <Text style={[styles.resultDescription, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
            {result.description}
          </Text>
        </View>

        {/* User Question Display */}
        {result.user_question && (
          <View style={[
            styles.card,
            styles.questionCard,
            {
              backgroundColor: darkMode ? '#1e3a8a' : '#eff6ff',
              borderColor: darkMode ? '#3b82f6' : '#3b82f6'
            }
          ]}>
            <View style={styles.questionHeader}>
              <MessageCircle size={16} color="#3b82f6" />
              <Text style={[styles.questionTitle, { fontSize: 16 * fontMultiplier }]}>
                Your Question
              </Text>
            </View>
            <Text style={[styles.questionText, { color: darkMode ? '#e5e7eb' : '#374151', fontSize: 16 * fontMultiplier }]}>
              {result.user_question}
            </Text>
          </View>
        )}

        {/* AI Advice Section */}
        {result.ai_advice ? (
          <>
            {/* AI Header */}
            <View style={[
              styles.card,
              styles.aiHeader,
              {
                backgroundColor: darkMode ? '#581c87' : '#faf5ff',
                borderColor: '#8b5cf6'
              }
            ]}>
              <View style={styles.aiTitleContainer}>
                <Brain size={20} color="#8b5cf6" />
                <Text style={[styles.aiTitle, { fontSize: 18 * fontMultiplier }]}>
                  AI Agricultural Advisor
                </Text>
              </View>
              <Text style={[styles.aiSubtitle, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                Personalized farming advice powered by AI
              </Text>
            </View>

            {/* Answer to User Question - Show FIRST if exists */}
            {result.ai_advice.question_answer && result.user_question && (
              <View style={[
                styles.card,
                styles.answerCard,
                {
                  backgroundColor: darkMode ? '#1e3a8a' : '#eff6ff',
                  borderColor: '#3b82f6'
                }
              ]}>
                <View style={styles.answerHeader}>
                  <MessageCircle size={16} color="#3b82f6" />
                  <Text style={[styles.answerTitle, { fontSize: 16 * fontMultiplier }]}>
                    Answer to Your Question
                  </Text>
                </View>
                <FormattedText
                  text={result.ai_advice.question_answer}
                  style={[styles.answerText, { color: darkMode ? '#e5e7eb' : '#374151', fontSize: 16 * fontMultiplier }]}
                />
              </View>
            )}

            {/* Causes */}
            {result.ai_advice.causes && (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.aiSectionTitle, { color: '#f97316', fontSize: 16 * fontMultiplier }]}>
                  🔍 What Causes This?
                </Text>
                <FormattedText
                  text={result.ai_advice.causes}
                  style={[styles.aiSectionText, { color: colors.text, fontSize: 14 * fontMultiplier }]}
                />
              </View>
            )}

            {/* Immediate Actions */}
            {result.ai_advice.immediate_actions && (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.aiSectionTitle, { color: '#ef4444', fontSize: 16 * fontMultiplier }]}>
                  ⚡ Immediate Actions
                </Text>
                <FormattedText
                  text={result.ai_advice.immediate_actions}
                  style={[styles.aiSectionText, { color: colors.text, fontSize: 14 * fontMultiplier }]}
                />
              </View>
            )}

            {/* Treatment */}
            {result.ai_advice.treatment && (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.aiSectionTitle, { color: '#3b82f6', fontSize: 16 * fontMultiplier }]}>
                  💊 Treatment Options
                </Text>
                <FormattedText
                  text={result.ai_advice.treatment}
                  style={[styles.aiSectionText, { color: colors.text, fontSize: 14 * fontMultiplier }]}
                />
              </View>
            )}

            {/* Prevention */}
            {result.ai_advice.prevention && (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.aiSectionTitle, { color: '#22c55e', fontSize: 16 * fontMultiplier }]}>
                  🛡️ Prevention Strategies
                </Text>
                <FormattedText
                  text={result.ai_advice.prevention}
                  style={[styles.aiSectionText, { color: colors.text, fontSize: 14 * fontMultiplier }]}
                />
              </View>
            )}

            {/* Monitoring */}
            {result.ai_advice.monitoring && (
              <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.monitoringHeader}>
                  <Eye size={16} color="#8b5cf6" />
                  <Text style={[styles.aiSectionTitle, { color: '#8b5cf6', fontSize: 16 * fontMultiplier }]}>
                    Monitoring Guide
                  </Text>
                </View>
                <FormattedText
                  text={result.ai_advice.monitoring}
                  style={[styles.aiSectionText, { color: colors.text, fontSize: 14 * fontMultiplier }]}
                />
              </View>
            )}
          </>
        ) : shouldShowAiLoading ? (
          <>
            {/* AI Loading State */}
            <View style={[
              styles.card,
              styles.loadingCard,
              {
                backgroundColor: darkMode ? '#581c87' : '#faf5ff',
                borderColor: '#8b5cf6'
              }
            ]}>
              <View style={styles.loadingHeader}>
                <Brain size={20} color="#8b5cf6" />
                <Text style={[styles.aiTitle, { fontSize: 18 * fontMultiplier }]}>
                  AI Agricultural Advisor
                </Text>
              </View>
              <Text style={[styles.aiSubtitle, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                Generating personalized farming advice...
              </Text>
            </View>

            {/* Question Answer Loading Placeholder */}
            {result.user_question && (
              <View style={[
                styles.card,
                styles.answerCard,
                {
                  backgroundColor: darkMode ? '#1e3a8a' : '#eff6ff',
                  borderColor: '#3b82f6'
                }
              ]}>
                <View style={styles.answerHeader}>
                  <MessageCircle size={16} color="#3b82f6" />
                  <Text style={[styles.answerTitle, { fontSize: 16 * fontMultiplier }]}>
                    Answer to Your Question
                  </Text>
                </View>
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={[styles.loadingIndicatorText, { fontSize: 14 * fontMultiplier }]}>
                    Preparing your personalized answer...
                  </Text>
                </View>
              </View>
            )}

            {/* AI Loading Placeholder */}
            <View style={[
              styles.card,
              styles.aiLoadingCard,
              {
                backgroundColor: darkMode ? '#581c87' : '#faf5ff',
                borderColor: '#8b5cf6'
              }
            ]}>
              <View style={styles.aiLoadingContent}>
                <View style={styles.aiLoadingIcons}>
                  <ActivityIndicator size="small" color="#8b5cf6" />
                  <Brain size={20} color="#8b5cf6" />
                </View>
                <Text style={[styles.aiLoadingTitle, { fontSize: 16 * fontMultiplier }]}>
                  Generating AI Advice...
                </Text>
                <Text style={[styles.aiLoadingDesc, { color: colors.textSecondary, fontSize: 12 * fontMultiplier }]}>
                  Our AI agricultural expert is analyzing your crop and preparing personalized recommendations.
                </Text>
              </View>
            </View>
          </>
        ) : aiAdviceRequested ? (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.errorContainer}>
              <Brain size={48} color={colors.textSecondary} />
              <Text style={[styles.errorTitle, { color: colors.text, fontSize: 18 * fontMultiplier }]}>
                AI Advice Not Available
              </Text>
              <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                {result.ai_advice_error || "AI advice generation failed. Please try again."}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.errorContainer}>
              <Brain size={48} color={colors.textSecondary} />
              <Text style={[styles.errorTitle, { color: colors.text, fontSize: 18 * fontMultiplier }]}>
                AI Advice Not Requested
              </Text>
              <Text style={[styles.errorText, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                Enable AI advice on the analysis page to get personalized farming recommendations.
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTakeAnother}>
            <Text style={[styles.buttonText, { fontSize: 16 * fontMultiplier }]}>Analyze Another Image</Text>
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
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  diseaseTitle: {
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
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
  cropTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cropTypeLabel: {
    fontWeight: '500',
    marginRight: 8,
  },
  cropTypeBadge: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  cropTypeText: {
    fontWeight: '600',
    color: '#0369a1',
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
  resultDescription: {
    lineHeight: 22,
  },
  questionCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionTitle: {
    fontWeight: '600',
    marginLeft: 8,
    color: '#3b82f6',
  },
  questionText: {
    lineHeight: 22,
  },
  aiHeader: {
    backgroundColor: '#faf5ff',
    borderColor: '#8b5cf6',
    borderWidth: 1,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiTitle: {
    fontWeight: '600',
    marginLeft: 8,
    color: '#8b5cf6',
  },
  aiSubtitle: {
    marginTop: 4,
  },
  answerCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerTitle: {
    fontWeight: '600',
    marginLeft: 8,
    color: '#3b82f6',
  },
  answerText: {
    lineHeight: 22,
  },
  aiSectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  aiSectionText: {
    lineHeight: 20,
  },
  monitoringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#8b5cf6',
    borderWidth: 1,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingIndicatorText: {
    marginLeft: 8,
    color: '#3b82f6',
  },
  aiLoadingCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#8b5cf6',
    borderWidth: 1,
    alignItems: 'center',
  },
  aiLoadingContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  aiLoadingIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  aiLoadingTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#8b5cf6',
    textAlign: 'center',
  },
  aiLoadingDesc: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
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