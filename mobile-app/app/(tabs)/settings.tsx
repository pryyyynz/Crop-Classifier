import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Leaf, ChevronRight, ChevronDown, Download, HardDrive, WifiOff, Wifi, RefreshCw } from 'lucide-react-native';
import { useSettings } from '../../contexts/SettingsContext';
import { getFontSizeMultiplier, getColors } from '../../utils/theme';
import { apiService } from '../../utils/api';
import { useConnectivity } from '../../utils/connectivityService';

export default function SettingsScreen() {
  const { darkMode, setDarkMode, fontSize, setFontSize, offlineMode, setOfflineMode } = useSettings();
  const connectivity = useConnectivity();
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showOfflineOptions, setShowOfflineOptions] = useState(false);
  const [modelInfo, setModelInfo] = useState<{
    totalModels: number;
    availableModels: string[];
    storageUsed: number;
  } | null>(null);
  const [downloadingModels, setDownloadingModels] = useState<string[]>([]);
  const [refreshingData, setRefreshingData] = useState(false);
  const [connectivityTest, setConnectivityTest] = useState<{
    testing: boolean;
    result?: { online: boolean; backendAvailable: boolean; latency?: number };
  }>({ testing: false });
  const router = useRouter();

  const fontMultiplier = getFontSizeMultiplier(fontSize);
  const colors = getColors(darkMode);

  const fontSizes = ['Small', 'Medium', 'Large', 'Very Large'];
  const crops = ['Cashew', 'Cassava', 'Maize', 'Tomato'];

  useEffect(() => {
    loadModelInfo();
    loadOfflineDataInfo();
  }, []);

  const loadModelInfo = async () => {
    try {
      const info = await apiService.getOfflineModelInfo();
      setModelInfo(info);
    } catch (error) {
      console.error('Failed to load model info:', error);
    }
  };

  const loadOfflineDataInfo = async () => {
    try {
      const dataInfo = await apiService.getOfflineDataInfo();
      console.log('Offline data info:', dataInfo);
    } catch (error) {
      console.error('Failed to load offline data info:', error);
    }
  };

  const handleAbout = () => {
    router.push('/about');
  };

  const handleDownloadModel = async (cropType: string) => {
    if (downloadingModels.includes(cropType)) return;

    if (!connectivity.isOnline) {
      Alert.alert('No Internet Connection', 'Internet connection is required to download models. Please check your connection and try again.');
      return;
    }

    setDownloadingModels(prev => [...prev, cropType]);

    try {
      const success = await apiService.downloadOfflineModel(cropType);
      if (success) {
        Alert.alert('Success', `${cropType} model downloaded successfully and ready for offline use.`);
        await loadModelInfo();
      } else {
        Alert.alert('Download Failed', `Failed to download ${cropType} model. Please try again.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Download Error', `Failed to download ${cropType} model: ${errorMessage}`);
    } finally {
      setDownloadingModels(prev => prev.filter(crop => crop !== cropType));
    }
  };

  const handleDeleteModel = async (cropType: string) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete the ${cropType} model? You'll need to download it again to use offline mode for this crop.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await apiService.deleteOfflineModel(cropType);
              if (success) {
                Alert.alert('Success', `${cropType} model deleted successfully.`);
                await loadModelInfo();
              }
            } catch (error) {
              Alert.alert('Error', `Failed to delete ${cropType} model.`);
            }
          }
        }
      ]
    );
  };

  const handleRefreshOfflineData = async () => {
    if (!connectivity.canUseOnlineFeatures) {
      Alert.alert(
        'Internet Required',
        'Internet connection is required to refresh offline data. Please connect to internet and try again.'
      );
      return;
    }

    setRefreshingData(true);
    try {
      await apiService.refreshOfflineData();
      Alert.alert('Success', 'Offline data refreshed successfully. Latest advice and information downloaded.');
      await loadOfflineDataInfo();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh offline data';
      Alert.alert('Refresh Failed', errorMessage);
    } finally {
      setRefreshingData(false);
    }
  };

  const handleTestConnection = async () => {
    setConnectivityTest({ testing: true });

    try {
      const result = await apiService.testConnection();
      setConnectivityTest({ testing: false, result });

      let message = '';
      if (result.online && result.backendAvailable) {
        message = `Connected successfully! Server response time: ${result.latency}ms`;
      } else if (result.online && !result.backendAvailable) {
        message = 'Internet connection available but server is unreachable.';
      } else {
        message = 'No internet connection detected.';
      }

      Alert.alert('Connection Test', message);
    } catch (error) {
      setConnectivityTest({ testing: false });
      Alert.alert('Connection Test Failed', 'Unable to test connection. Please try again.');
    }
  };

  const handleOfflineModeToggle = async (value: boolean) => {
    if (value && modelInfo && modelInfo.availableModels.length === 0) {
      Alert.alert(
        'No Offline Models',
        'You need to download at least one crop model to use offline mode. Would you like to download models now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download Models', onPress: () => setShowOfflineOptions(true) }
        ]
      );
      return;
    }

    await setOfflineMode(value);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConnectionStatusIndicator = () => {
    if (connectivity.isOfflineMode) {
      return (
        <View style={[styles.statusIndicator, { backgroundColor: '#f59e0b' }]}>
          <WifiOff size={16} color="white" />
          <Text style={[styles.statusText, { fontSize: 12 * fontMultiplier }]}>Offline Mode</Text>
        </View>
      );
    }

    if (!connectivity.isOnline) {
      return (
        <View style={[styles.statusIndicator, { backgroundColor: '#ef4444' }]}>
          <WifiOff size={16} color="white" />
          <Text style={[styles.statusText, { fontSize: 12 * fontMultiplier }]}>No Connection</Text>
        </View>
      );
    }

    const qualityColor = connectivity.connectionQuality === 'excellent' ? '#22c55e' :
      connectivity.connectionQuality === 'good' ? '#f59e0b' : '#ef4444';

    return (
      <View style={[styles.statusIndicator, { backgroundColor: qualityColor }]}>
        <Wifi size={16} color="white" />
        <Text style={[styles.statusText, { fontSize: 12 * fontMultiplier }]}>
          {connectivity.connectionType} ({connectivity.connectionQuality})
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
        <Leaf size={24} color="#22c55e" />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: 20 * fontMultiplier }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.connectionInfo}>
            <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>Connection Status</Text>
            {getConnectionStatusIndicator()}
          </View>
          <TouchableOpacity
            style={[styles.testButton, { opacity: connectivityTest.testing ? 0.6 : 1 }]}
            onPress={handleTestConnection}
            disabled={connectivityTest.testing}
          >
            {connectivityTest.testing ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <RefreshCw size={16} color="#3b82f6" />
            )}
            <Text style={[styles.testButtonText, { fontSize: 14 * fontMultiplier }]}>
              {connectivityTest.testing ? 'Testing...' : 'Test'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connection Details */}
        {connectivity.networkStats && (
          <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.settingText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>Network Statistics</Text>
            <Text style={[styles.networkStatText, { color: colors.textSecondary, fontSize: 12 * fontMultiplier }]}>
              Online time: {Math.round(connectivity.networkStats.totalOnlineTime / 60000)}min
            </Text>
            <Text style={[styles.networkStatText, { color: colors.textSecondary, fontSize: 12 * fontMultiplier }]}>
              Connection switches: {connectivity.networkStats.connectionSwitches}
            </Text>
          </View>
        )}

        {/* Appearance Settings */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#d1d5db', true: '#22c55e' }}
            thumbColor={darkMode ? '#ffffff' : '#ffffff'}
          />
        </View>

        {/* Font Size Setting */}
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}
          onPress={() => setShowFontSizePicker(!showFontSizePicker)}
        >
          <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>Font Size</Text>
          <View style={styles.fontSizeContainer}>
            <Text style={[styles.currentValue, { color: colors.textSecondary, fontSize: 16 * fontMultiplier }]}>{fontSize}</Text>
            <ChevronDown
              size={20}
              color={colors.textSecondary}
              style={{ transform: [{ rotate: showFontSizePicker ? '180deg' : '0deg' }] }}
            />
          </View>
        </TouchableOpacity>

        {showFontSizePicker && (
          <View style={[styles.pickerContainer, { backgroundColor: colors.cardBackground }]}>
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
            onValueChange={handleOfflineModeToggle}
            trackColor={{ false: '#d1d5db', true: '#22c55e' }}
            thumbColor={offlineMode ? '#ffffff' : '#ffffff'}
          />
        </View>

        {/* Offline Model Management */}
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.cardBackground }]}
          onPress={() => setShowOfflineOptions(!showOfflineOptions)}
        >
          <View style={styles.modelManagementHeader}>
            <HardDrive size={20} color={colors.textSecondary} />
            <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier, marginLeft: 8 }]}>
              Offline Models
            </Text>
          </View>
          <ChevronDown
            size={20}
            color={colors.textSecondary}
            style={{ transform: [{ rotate: showOfflineOptions ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {showOfflineOptions && (
          <View style={[styles.offlineSection, { backgroundColor: colors.cardBackground }]}>
            {/* Model Status */}
            <View style={styles.modelStatus}>
              <Text style={[styles.modelStatusText, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
                Available Models: {modelInfo?.availableModels.length || 0}/{modelInfo?.totalModels || 4}
              </Text>
              <Text style={[styles.modelStatusText, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                Storage Used: {modelInfo ? formatBytes(modelInfo.storageUsed) : '0 Bytes'}
              </Text>
            </View>

            {/* Refresh Data Button */}
            <TouchableOpacity
              style={[styles.refreshButton, { opacity: refreshingData || !connectivity.canUseOnlineFeatures ? 0.6 : 1 }]}
              onPress={handleRefreshOfflineData}
              disabled={refreshingData || !connectivity.canUseOnlineFeatures}
            >
              {refreshingData ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <RefreshCw size={16} color="white" />
              )}
              <Text style={[styles.refreshButtonText, { fontSize: 14 * fontMultiplier }]}>
                {refreshingData ? 'Refreshing...' : 'Refresh Offline Data'}
              </Text>
            </TouchableOpacity>

            {/* Model Download Options */}
            <View style={styles.modelList}>
              {crops.map((crop) => {
                const isAvailable = modelInfo?.availableModels.includes(crop.toLowerCase());
                const isDownloading = downloadingModels.includes(crop);

                return (
                  <View key={crop} style={[styles.modelItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.modelInfo}>
                      <Text style={[styles.modelName, { color: colors.text, fontSize: 16 * fontMultiplier }]}>
                        {crop} Model
                      </Text>
                      <Text style={[styles.modelSize, { color: colors.textSecondary, fontSize: 12 * fontMultiplier }]}>
                        ~28 MB
                      </Text>
                    </View>

                    {isAvailable ? (
                      <View style={styles.modelActions}>
                        <Text style={[styles.availableText, { color: '#22c55e', fontSize: 14 * fontMultiplier }]}>
                          Available
                        </Text>
                        <TouchableOpacity
                          style={[styles.deleteButton]}
                          onPress={() => handleDeleteModel(crop)}
                        >
                          <Text style={[styles.deleteButtonText, { fontSize: 12 * fontMultiplier }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.downloadButton, {
                          backgroundColor: isDownloading ? '#9ca3af' : '#3b82f6',
                          opacity: isDownloading || !connectivity.isOnline ? 0.7 : 1
                        }]}
                        onPress={() => handleDownloadModel(crop)}
                        disabled={isDownloading || !connectivity.isOnline}
                      >
                        {isDownloading ? (
                          <ActivityIndicator size={16} color="white" />
                        ) : (
                          <Download size={16} color="white" />
                        )}
                        <Text style={[styles.downloadText, { fontSize: 12 * fontMultiplier }]}>
                          {isDownloading ? 'Downloading...' : 'Download'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Offline Mode Info */}
            <View style={styles.offlineInfo}>
              <Text style={[styles.offlineInfoText, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                • Offline mode uses AI models stored locally on your device
              </Text>
              <Text style={[styles.offlineInfoText, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                • Advice in offline mode uses comprehensive cached data from backend
              </Text>
              <Text style={[styles.offlineInfoText, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                • Models work without internet after download
              </Text>
              <Text style={[styles.offlineInfoText, { color: colors.textSecondary, fontSize: 14 * fontMultiplier }]}>
                • Requires {connectivity.isOnline ? 'internet connection' : 'internet (currently offline)'} to download
              </Text>
            </View>
          </View>
        )}

        {/* About */}
        <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground }]} onPress={handleAbout}>
          <Text style={[styles.settingText, { color: colors.text, fontSize: 18 * fontMultiplier }]}>About</Text>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  connectionInfo: {
    flex: 1,
    flexDirection: 'column' as const,
  },
  statusIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start' as const,
  },
  statusText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  testButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  testButtonText: {
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  networkStatText: {
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center' as const,
  },
  refreshButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500' as const,
  },
  modelActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '500' as const,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    marginLeft: 8,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingText: {
    fontWeight: '500' as const,
  },
  fontSizeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  currentValue: {
    marginRight: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerText: {},
  modelManagementHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  offlineSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modelStatus: {
    marginBottom: 16,
  },
  modelStatusText: {
    marginBottom: 4,
  },
  modelList: {},
  modelItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modelInfo: {},
  modelName: {
    fontWeight: '500' as const,
  },
  modelSize: {
    marginTop: 2,
  },
  availableText: {
    fontWeight: '600' as const,
  },
  downloadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  offlineInfo: {
    marginTop: 8,
  },
  offlineInfoText: {
    marginBottom: 4,
    lineHeight: 18,
  },
};