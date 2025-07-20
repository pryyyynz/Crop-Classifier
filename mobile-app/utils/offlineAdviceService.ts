import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { connectivityService } from './connectivityService';

export interface OfflineAdviceData {
    [cropType: string]: {
        [disease: string]: {
            description: string;
            symptoms: string;
            causes: string;
            treatment: string;
            prevention: string;
        };
    };
}

export interface CachedAdviceResponse {
    timestamp: number;
    data: OfflineAdviceData;
    version: string;
}

export class OfflineAdviceService {
    private adviceData: OfflineAdviceData = {};
    private isInitialized = false;
    private adviceDirectory: string;
    private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    private readonly API_BASE_URL = 'https://iumqtt2ins.eu-west-1.awsapprunner.com';

    constructor() {
        this.adviceDirectory = `${FileSystem.documentDirectory}advice/`;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Ensure advice directory exists
            const dirInfo = await FileSystem.getInfoAsync(this.adviceDirectory);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.adviceDirectory, { intermediates: true });
            }

            // Load cached advice data
            await this.loadCachedAdvice();

            // Update advice data if online and cache is old
            await this.updateAdviceIfNeeded();

            this.isInitialized = true;
            console.log('Offline advice service initialized with basic disease information');
        } catch (error) {
            console.error('Failed to initialize offline advice service:', error);
            // Fall back to minimal offline functionality
            this.loadFallbackAdvice();
            this.isInitialized = true;
        }
    }

    private async loadCachedAdvice(): Promise<void> {
        try {
            const cacheFile = `${this.adviceDirectory}advice_cache.json`;
            const fileInfo = await FileSystem.getInfoAsync(cacheFile);

            if (fileInfo.exists) {
                const cacheContent = await FileSystem.readAsStringAsync(cacheFile);
                const cached: CachedAdviceResponse = JSON.parse(cacheContent);

                if (cached.data && cached.timestamp) {
                    this.adviceData = cached.data;
                    console.log(`Loaded cached disease data (version: ${cached.version})`);
                }
            }
        } catch (error) {
            console.error('Failed to load cached advice:', error);
        }
    }

    private async updateAdviceIfNeeded(): Promise<void> {
        try {
            const connectivityState = connectivityService.getState();
            if (!connectivityState.canUseOnlineFeatures) {
                console.log('Skipping disease data update - offline mode or no connection');
                return;
            }

            const cacheFile = `${this.adviceDirectory}advice_cache.json`;
            const fileInfo = await FileSystem.getInfoAsync(cacheFile);

            let shouldUpdate = true;
            if (fileInfo.exists) {
                const cacheContent = await FileSystem.readAsStringAsync(cacheFile);
                const cached: CachedAdviceResponse = JSON.parse(cacheContent);

                // Check if cache is still valid
                const cacheAge = Date.now() - cached.timestamp;
                shouldUpdate = cacheAge > this.CACHE_DURATION;
            }

            if (shouldUpdate) {
                console.log('Updating disease data from backend...');
                await this.downloadAdviceFromBackend();
            }
        } catch (error) {
            console.error('Failed to update disease data:', error);
        }
    }

    private async downloadAdviceFromBackend(): Promise<void> {
        try {
            // Download basic disease information from backend
            const response = await fetch(`${this.API_BASE_URL}/api/diseases/basic`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Crop-Classifier-Mobile/1.0'
                },
                timeout: 30000
            });

            if (!response.ok) {
                throw new Error(`Backend request failed: ${response.status}`);
            }

            const adviceData: OfflineAdviceData = await response.json();

            // Validate the structure
            if (!this.validateAdviceData(adviceData)) {
                throw new Error('Invalid disease data structure from backend');
            }

            // Cache the data
            const cacheData: CachedAdviceResponse = {
                timestamp: Date.now(),
                data: adviceData,
                version: '1.0'
            };

            const cacheFile = `${this.adviceDirectory}advice_cache.json`;
            await FileSystem.writeAsStringAsync(cacheFile, JSON.stringify(cacheData));

            this.adviceData = adviceData;
            console.log('Successfully updated disease data from backend');

        } catch (error) {
            console.error('Failed to download disease data from backend:', error);

            // If we have no cached data, load fallback
            if (Object.keys(this.adviceData).length === 0) {
                this.loadFallbackAdvice();
            }
        }
    }

    private validateAdviceData(data: any): boolean {
        if (!data || typeof data !== 'object') return false;

        const requiredCrops = ['cashew', 'cassava', 'maize', 'tomato'];
        const requiredFields = ['description', 'symptoms', 'causes', 'treatment', 'prevention'];

        for (const crop of requiredCrops) {
            if (!data[crop] || typeof data[crop] !== 'object') return false;

            for (const disease of Object.keys(data[crop])) {
                const diseaseData = data[crop][disease];
                if (!diseaseData || typeof diseaseData !== 'object') return false;

                for (const field of requiredFields) {
                    if (!diseaseData[field] || typeof diseaseData[field] !== 'string') return false;
                }
            }
        }

        return true;
    }

    private loadFallbackAdvice(): void {
        // Basic disease information when backend is unavailable
        console.log('Loading fallback disease data');

        this.adviceData = {
            cashew: {
                'healthy': this.createFallbackAdvice('healthy', 'cashew'),
                'anthracnose': this.createFallbackAdvice('anthracnose', 'cashew'),
                'gumosis': this.createFallbackAdvice('gumosis', 'cashew'),
                'leaf_miner': this.createFallbackAdvice('leaf_miner', 'cashew'),
                'red_rust': this.createFallbackAdvice('red_rust', 'cashew')
            },
            cassava: {
                'healthy': this.createFallbackAdvice('healthy', 'cassava'),
                'bacterial_blight': this.createFallbackAdvice('bacterial_blight', 'cassava'),
                'brown_spot': this.createFallbackAdvice('brown_spot', 'cassava'),
                'green_mite': this.createFallbackAdvice('green_mite', 'cassava'),
                'mosaic': this.createFallbackAdvice('mosaic', 'cassava')
            },
            maize: {
                'healthy': this.createFallbackAdvice('healthy', 'maize'),
                'fall_armyworm': this.createFallbackAdvice('fall_armyworm', 'maize'),
                'grasshoper': this.createFallbackAdvice('grasshoper', 'maize'),
                'leaf_beetle': this.createFallbackAdvice('leaf_beetle', 'maize'),
                'leaf_blight': this.createFallbackAdvice('leaf_blight', 'maize'),
                'leaf_spot': this.createFallbackAdvice('leaf_spot', 'maize'),
                'streak_virus': this.createFallbackAdvice('streak_virus', 'maize')
            },
            tomato: {
                'healthy': this.createFallbackAdvice('healthy', 'tomato'),
                'leaf_blight': this.createFallbackAdvice('leaf_blight', 'tomato'),
                'leaf_curl': this.createFallbackAdvice('leaf_curl', 'tomato'),
                'septoria_leaf_spot': this.createFallbackAdvice('septoria_leaf_spot', 'tomato'),
                'verticulium_wilt': this.createFallbackAdvice('verticulium_wilt', 'tomato')
            }
        };
    }

    private createFallbackAdvice(disease: string, crop: string): {
        description: string;
        symptoms: string;
        causes: string;
        treatment: string;
        prevention: string;
    } {
        if (disease === 'healthy') {
            return {
                description: `Your ${crop} plant appears healthy with no visible disease symptoms.`,
                symptoms: 'No disease symptoms observed. Plant shows normal growth patterns.',
                causes: 'Good growing conditions, proper nutrition, and effective disease prevention practices.',
                treatment: 'No treatment needed. Continue preventive measures and good agricultural practices.',
                prevention: 'Maintain proper nutrition, adequate spacing, and regular field sanitation.'
            };
        }

        const diseaseName = disease.replace(/[_-]/g, ' ').toLowerCase();
        return {
            description: `${diseaseName} detected in ${crop}. For detailed information, please connect to internet or consult agricultural extension services.`,
            symptoms: `Symptoms may vary. Connect to internet for detailed symptom information.`,
            causes: `Multiple factors can cause ${diseaseName}. Detailed information available when online.`,
            treatment: `Treatment recommendations available when connected to internet. Consult local agricultural experts.`,
            prevention: `General prevention includes good plant hygiene, proper spacing, and regular monitoring.`
        };
    }

    async getBasicDiseaseInfo(
        cropType: string,
        disease: string
    ): Promise<{
        description: string;
        symptoms: string;
        causes: string;
        treatment: string;
        prevention: string;
    } | null> {
        try {
            const crop = cropType.toLowerCase();
            const diseaseKey = disease.replace(/\s+/g, '_').toLowerCase();

            const diseaseInfo = this.adviceData[crop]?.[diseaseKey];

            if (!diseaseInfo) {
                return null;
            }

            return diseaseInfo;
        } catch (error) {
            console.error('Failed to get basic disease info:', error);
            return null;
        }
    }

    async refreshAdviceData(): Promise<void> {
        console.log('Forcing disease data refresh...');
        await this.downloadAdviceFromBackend();
    }

    async clearCache(): Promise<void> {
        try {
            const cacheFile = `${this.adviceDirectory}advice_cache.json`;
            const fileInfo = await FileSystem.getInfoAsync(cacheFile);

            if (fileInfo.exists) {
                await FileSystem.deleteAsync(cacheFile);
                console.log('Disease data cache cleared');
            }

            // Reset to fallback data
            this.loadFallbackAdvice();
        } catch (error) {
            console.error('Failed to clear disease data cache:', error);
        }
    }

    getCacheInfo(): { hasCache: boolean; cacheAge?: number; version?: string } {
        try {
            return { hasCache: Object.keys(this.adviceData).length > 0 };
        } catch {
            return { hasCache: false };
        }
    }

    isInitialized(): boolean {
        return this.isInitialized;
    }

    getSupportedCrops(): string[] {
        return Object.keys(this.adviceData);
    }

    getSupportedDiseases(cropType: string): string[] {
        const crop = cropType.toLowerCase();
        return Object.keys(this.adviceData[crop] || {});
    }
}

export const offlineAdviceService = new OfflineAdviceService();