import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';

const historyData = [
  {
    id: 1,
    disease: 'Bacterial Blight',
    date: 'Apr 19, 2024',
    confidence: '96.4%',
    image: 'https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    description: 'Bacterial blight is a common plant disease caused by various bacterial pathogens. It typically appears as water-soaked lesions on leaves that eventually turn brown or black. The disease can spread rapidly in warm, humid conditions and may cause significant damage to crops if left untreated.\n\nEarly detection and proper management are crucial for preventing the spread of this disease. Treatment options include copper-based fungicides, improved air circulation, and removal of infected plant material.',
  },
  {
    id: 2,
    disease: 'Powdery Mildew',
    date: 'Apr 01, 2024',
    confidence: '89.2%',
    image: 'https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    description: 'Powdery mildew is a fungal disease that appears as white or grayish powdery patches on plant surfaces. It thrives in warm, dry climates with high humidity and can affect a wide range of plants. The fungus reduces photosynthesis and can weaken the plant over time.\n\nPrevention includes proper spacing for air circulation, avoiding overhead watering, and applying fungicides when necessary. Remove affected plant parts to prevent spread.',
  },
  {
    id: 3,
    disease: 'Late Blight',
    date: 'Apr 04, 2024',
    confidence: '92.8%',
    image: 'https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    description: 'Late blight is a devastating plant disease caused by Phytophthora infestans. It causes dark, water-soaked lesions on leaves and stems, often with white fuzzy growth on the undersides of leaves. The disease can quickly destroy entire crops in favorable conditions.\n\nManagement includes using resistant varieties, proper crop rotation, avoiding overhead irrigation, and applying preventive fungicides during high-risk periods.',
  },
];

export default function HistoryScreen() {
  const { darkMode, fontSize } = useSettings();
  const router = useRouter();
  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  const handleHistoryItemPress = (item: typeof historyData[0]) => {
    router.push({
      pathname: '/analysis-result',
      params: {
        disease: item.disease,
        confidence: item.confidence,
        image: item.image,
        description: item.description,
        date: item.date,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>History</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {historyData.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.historyItem, { backgroundColor: colors.cardBackground }]}
            onPress={() => handleHistoryItemPress(item)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: item.image }} style={styles.historyImage} />
            <View style={styles.historyTextContainer}>
              <Text style={[styles.historyDisease, { color: colors.text, fontSize: 18 * fontMultiplier }]}>{item.disease}</Text>
              <Text style={[styles.historyDate, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
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
  historyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyDisease: {
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDate: {
  },
});