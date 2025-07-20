import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Leaf, Trash2, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSettings } from '@/contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '@/utils/theme';
import { historyService, HistoryItem } from '@/utils/historyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const { darkMode, fontSize } = useSettings();
  const router = useRouter();
  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const history = await historyService.getHistory();
      setHistoryData(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  // Reload history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  useEffect(() => {
    loadHistory();
  }, []);

  const handleHistoryItemPress = async (item: HistoryItem) => {
    try {
      // Store the selected result and image for the analysis result screen
      await AsyncStorage.setItem('classificationResult', JSON.stringify(item.result));
      await AsyncStorage.setItem('analysisImage', item.imageUri);

      // Navigate to result page
      router.push('/analysis-result');
    } catch (error) {
      console.error('Error opening history item:', error);
    }
  };

  const formatDiseaseName = (disease: string) => {
    return disease.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getHealthStatusColor = (isHealthy: boolean) => {
    return isHealthy ? '#22c55e' : '#ef4444';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
          <Leaf size={24} color="#22c55e" />
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={[styles.loadingText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
            Loading history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>History</Text>
      </View>

      {historyData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>
            No Analysis History
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>
            Start analyzing crop diseases to see your history here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#22c55e']}
              tintColor="#22c55e"
            />
          }
        >
          {historyData.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.historyItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => handleHistoryItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.historyImageContainer}>
                <Image source={{ uri: item.imageUri }} style={styles.historyImage} />
                {/* Health status indicator */}
                <View
                  style={[
                    styles.healthIndicator,
                    { backgroundColor: getHealthStatusColor(item.result.is_healthy) }
                  ]}
                />
              </View>

              <View style={styles.historyTextContainer}>
                <Text style={[styles.historyDisease, { color: colors.text, fontSize: 18 * fontMultiplier }]}>
                  {formatDiseaseName(item.result.predicted_disease)}
                </Text>

                <Text style={[styles.historyCrop, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                  {item.result.crop_type.charAt(0).toUpperCase() + item.result.crop_type.slice(1)} • {item.result.confidence}% confidence
                </Text>

                <Text style={[styles.historyDate, { color: colors.textSecondary, fontSize: 12 * fontMultiplier }]}>
                  {item.date}
                </Text>
              </View>

              <View style={styles.historyActions}>
                <View style={[styles.statusBadge, { backgroundColor: getHealthStatusColor(item.result.is_healthy) }]}>
                  <Text style={styles.statusText}>
                    {item.result.is_healthy ? 'Healthy' : 'Disease'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
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
  historyImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  historyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  healthIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  historyTextContainer: {
    flex: 1,
  },
  historyDisease: {
    fontWeight: '600',
    marginBottom: 4,
  },
  historyCrop: {
    marginBottom: 4,
  },
  historyDate: {
    fontStyle: 'italic',
  },
  historyActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});