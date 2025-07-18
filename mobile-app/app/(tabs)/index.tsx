import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, Camera, ChevronDown, X, MessageCircle, Brain } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { apiService, ClassificationResult } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScanScreen() {
  const { darkMode, fontSize } = useSettings();
  const [selectedCrop, setSelectedCrop] = useState('Select Crop');
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enableAiAdvice, setEnableAiAdvice] = useState(true);
  const [userQuestion, setUserQuestion] = useState('');
  const router = useRouter();

  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  const crops = ['Cashew', 'Cassava', 'Maize', 'Tomato'];

  const handleAnalyze = async () => {
    if (selectedCrop === 'Select Crop') {
      Alert.alert('Error', 'Please select a crop first');
      return;
    }
    if (!selectedImage) {
      Alert.alert('Error', 'Please upload or take an image first');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Call the API with enhanced parameters (removed notes)
      const result = await apiService.classifyImage(
        selectedImage,
        selectedCrop,
        undefined, // No notes
        userQuestion.trim() || undefined,
        enableAiAdvice
      );

      // Store the result and image for the result page
      await AsyncStorage.setItem('classificationResult', JSON.stringify(result));
      await AsyncStorage.setItem('analysisImage', selectedImage);

      // Navigate to result page
      router.push('/analysis-result');
    } catch (error) {
      Alert.alert(
        'Analysis Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Photo Library',
          onPress: openImageLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos. Please enable it in your device settings.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openImageLibrary = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required to select images. Please enable it in your device settings.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>Detect Crop Disease</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.text, fontSize: 28 * fontMultiplier }]}>
          Detect crop diseases{'\n'}instantly with AI
        </Text>

        <TouchableOpacity
          style={[
            styles.uploadArea,
            {
              backgroundColor: colors.cardBackground,
              borderColor: selectedImage ? '#22c55e' : colors.border
            }
          ]}
          onPress={handleImageUpload}
          disabled={isAnalyzing}
        >
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeButton} onPress={removeImage} disabled={isAnalyzing}>
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Camera size={48} color={colors.textSecondary} />
              <Text style={[styles.uploadText, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>
                Upload or take{'\n'}an image
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dropdown, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => setShowCropPicker(!showCropPicker)}
          disabled={isAnalyzing}
        >
          <Text style={[styles.dropdownText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>{selectedCrop}</Text>
          <ChevronDown size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {showCropPicker && (
          <View style={[styles.picker, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {crops.map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedCrop(crop);
                  setShowCropPicker(false);
                }}
              >
                <Text style={[styles.pickerText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>{crop}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AI Advice Toggle */}
        <View style={[styles.aiAdviceContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.aiAdviceHeader}>
            <Brain size={20} color="#8b5cf6" />
            <Text style={[styles.aiAdviceTitle, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
              AI-Powered Farming Advice
            </Text>
          </View>
          <Switch
            value={enableAiAdvice}
            onValueChange={(value) => {
              setEnableAiAdvice(value);
              if (!value) {
                setUserQuestion('');
              }
            }}
            trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
            thumbColor={enableAiAdvice ? '#ffffff' : '#ffffff'}
            disabled={isAnalyzing}
          />
        </View>

        <Text style={[styles.aiAdviceDescription, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
          Get detailed recommendations, treatment options, and personalized farming advice
        </Text>

        {/* User Question Input - Only shown when AI advice is enabled */}
        {enableAiAdvice && (
          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <MessageCircle size={16} color={colors.textSecondary} />
              <Text style={[styles.questionLabel, { color: colors.text, fontSize: 14 * fontMultiplier }]}>
                Ask a Question (Optional)
              </Text>
            </View>
            <TextInput
              style={[styles.questionInput, {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                color: colors.text,
                fontSize: 16 * fontMultiplier
              }]}
              placeholder="What should I do? How to prevent this? etc."
              placeholderTextColor={colors.textSecondary}
              value={userQuestion}
              onChangeText={setUserQuestion}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              editable={!isAnalyzing}
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            {
              backgroundColor: isAnalyzing ? '#9ca3af' : '#22c55e',
              opacity: (!selectedImage || selectedCrop === 'Select Crop' || isAnalyzing) ? 0.6 : 1
            }
          ]}
          onPress={handleAnalyze}
          disabled={!selectedImage || selectedCrop === 'Select Crop' || isAnalyzing}
        >
          {isAnalyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              <Text style={[styles.analyzeButtonText, { fontSize: 16 * fontMultiplier }]}>
                {enableAiAdvice ? 'Analyzing & Generating Advice...' : 'Analyzing...'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.analyzeButtonText, { fontSize: 16 * fontMultiplier }]}>Analyze Disease</Text>
          )}
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
  subtitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 36,
  },
  uploadArea: {
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadText: {
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  dropdown: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  dropdownText: {
  },
  picker: {
    borderRadius: 8,
    marginTop: -24,
    marginBottom: 24,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerText: {
  },
  aiAdviceContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiAdviceTitle: {
    fontWeight: '600',
    marginLeft: 8,
  },
  aiAdviceDescription: {
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionLabel: {
    marginLeft: 8,
    fontWeight: '500',
  },
  questionInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 60,
    maxHeight: 100,
  },
  analyzeButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  analyzeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});