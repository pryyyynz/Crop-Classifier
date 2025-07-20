import { connectivityService } from './connectivityService';
import { offlineModelService } from './offlineModelService';
import { offlineAdviceService } from './offlineAdviceService';

export interface ClassificationResult {
    predicted_disease: string;
    confidence: number;
    crop_type: string;
    is_healthy: boolean;
    description: string;
    top_predictions: { disease: string; confidence: number }[];
    user_question?: string;
    offline_mode?: boolean;
}

export interface ClassificationError {
    detail: string;
}

class ApiService {
    private baseUrl: string;

    constructor() {
        // Updated to use AWS App Runner URL
        this.baseUrl = 'https://iumqtt2ins.eu-west-1.awsapprunner.com';
        this.initializeOfflineServices();
    }

    private async initializeOfflineServices() {
        try {
            await offlineModelService.initialize();
            await offlineAdviceService.initialize();
            console.log('Offline services initialized successfully');
        } catch (error) {
            console.error('Failed to initialize offline services:', error);
        }
    }

    async classifyImage(
        imageUri: string,
        cropType: string,
        notes?: string,
        userQuestion?: string,
        enableAiAdvice: boolean = true
    ): Promise<ClassificationResult> {
        const connectivityState = connectivityService.getState();

        // Use offline mode if explicitly enabled or if no internet connection
        if (connectivityState.isOfflineMode || !connectivityState.isOnline) {
            return this.classifyImageOffline(imageUri, cropType, notes);
        }

        // Use online mode
        return this.classifyImageOnline(imageUri, cropType, notes, userQuestion, enableAiAdvice);
    }

    private async classifyImageOffline(
        imageUri: string,
        cropType: string,
        notes?: string
    ): Promise<ClassificationResult> {
        try {
            // Check if model is available for the crop type
            const modelAvailable = await offlineModelService.isModelAvailable(cropType.toLowerCase());
            if (!modelAvailable) {
                throw new Error(`Offline model not available for ${cropType}. Please download the model or switch to online mode.`);
            }

            // Classify image using offline model
            const classification = await offlineModelService.classifyImage(imageUri, cropType);

            // Get proper disease name formatting
            const formattedDiseaseName = this.formatDiseaseName(classification.predicted_disease);

            // Get comprehensive description from cached data
            const description = await this.getOfflineDescription(cropType, classification.predicted_disease);

            // Format top predictions with proper names
            const formattedTopPredictions = classification.top_predictions.map(pred => ({
                disease: this.formatDiseaseName(pred.disease),
                confidence: pred.confidence
            }));

            return {
                predicted_disease: formattedDiseaseName,
                confidence: classification.confidence,
                crop_type: cropType,
                is_healthy: classification.predicted_disease.toLowerCase().includes('healthy'),
                description,
                top_predictions: formattedTopPredictions,
                offline_mode: true
            };
        } catch (error) {
            console.error('Offline classification failed:', error);
            throw new Error(error instanceof Error ? error.message : 'Offline classification failed');
        }
    }

    private async classifyImageOnline(
        imageUri: string,
        cropType: string,
        notes?: string,
        userQuestion?: string,
        enableAiAdvice: boolean = true
    ): Promise<ClassificationResult> {
        const formData = new FormData();

        // Create file object from image URI
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'crop_image.jpg',
        } as any);

        formData.append('crop_type', cropType.toLowerCase());

        if (notes) {
            formData.append('notes', notes);
        }

        if (userQuestion) {
            formData.append('user_question', userQuestion);
        }

        formData.append('enable_ai_advice', enableAiAdvice.toString());

        const response = await fetch(`${this.baseUrl}/api/classify`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            const error: ClassificationError = await response.json();
            throw new Error(error.detail || 'Classification failed');
        }

        const result = await response.json();
        return {
            ...result,
            offline_mode: false
        };
    }

    private formatDiseaseName(disease: string): string {
        // Convert disease names to proper format matching online mode
        return disease
            .replace(/[_-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    private async getOfflineDescription(cropType: string, disease: string): Promise<string> {
        try {
            // Get basic disease info from cached data
            const diseaseInfo = await offlineAdviceService.getBasicDiseaseInfo(cropType, disease);

            if (diseaseInfo) {
                return diseaseInfo.description;
            }

            // Fallback description if not found in cache
            return this.getFallbackDescription(disease);
        } catch (error) {
            console.warn('Failed to get offline description:', error);
            return this.getFallbackDescription(disease);
        }
    }

    private getFallbackDescription(disease: string): string {
        if (disease.toLowerCase().includes('healthy')) {
            return 'Your plant appears healthy! Continue with regular care including proper watering, fertilization, and monitoring for any changes in plant health.';
        }

        const formattedName = this.formatDiseaseName(disease);
        return `${formattedName} detected. For comprehensive information and treatment recommendations, please connect to internet or consult local agricultural extension services.`;
    }

    async getSupportedCrops() {
        const connectivityState = connectivityService.getState();

        if (connectivityState.canUseOnlineFeatures) {
            try {
                const response = await fetch(`${this.baseUrl}/api/crops`);
                if (!response.ok) {
                    throw new Error('Failed to fetch supported crops');
                }
                return response.json();
            } catch (error) {
                console.warn('Failed to fetch online crops, falling back to offline:', error);
            }
        }

        // Return offline supported crops
        return offlineAdviceService.getSupportedCrops();
    }

    async getOfflineModelInfo() {
        return offlineModelService.getModelInfo();
    }

    async downloadOfflineModel(cropType: string): Promise<boolean> {
        const connectivityState = connectivityService.getState();

        if (!connectivityState.isOnline) {
            throw new Error('Internet connection required to download models');
        }

        return offlineModelService.downloadModel(cropType);
    }

    async deleteOfflineModel(cropType: string): Promise<boolean> {
        return offlineModelService.deleteModel(cropType);
    }

    async clearAllOfflineModels(): Promise<void> {
        await offlineModelService.clearAllModels();
    }

    async refreshOfflineData(): Promise<void> {
        const connectivityState = connectivityService.getState();

        if (connectivityState.canUseOnlineFeatures) {
            try {
                await offlineAdviceService.refreshAdviceData();
                console.log('Offline disease data refreshed successfully');
            } catch (error) {
                console.error('Failed to refresh offline data:', error);
                throw new Error('Failed to refresh offline data. Please check your internet connection.');
            }
        } else {
            throw new Error('Internet connection required to refresh offline data');
        }
    }

    async getOfflineDataInfo(): Promise<{
        adviceCache: { hasCache: boolean; cacheAge?: number; version?: string };
        modelInfo: { totalModels: number; availableModels: string[]; storageUsed: number };
        totalStorageUsed: number;
    }> {
        const adviceCache = offlineAdviceService.getCacheInfo();
        const modelInfo = await offlineModelService.getModelInfo();

        return {
            adviceCache,
            modelInfo,
            totalStorageUsed: modelInfo.storageUsed
        };
    }

    async clearOfflineCache(): Promise<void> {
        await offlineAdviceService.clearCache();
        console.log('Offline cache cleared');
    }

    getConnectivityState() {
        return connectivityService.getState();
    }

    // Enhanced error handling and user feedback
    async testConnection(): Promise<{ online: boolean; backendAvailable: boolean; latency?: number }> {
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                timeout: 5000
            });

            const latency = Date.now() - startTime;

            return {
                online: true,
                backendAvailable: response.ok,
                latency
            };
        } catch (error) {
            return {
                online: false,
                backendAvailable: false
            };
        }
    }

    // Model management utilities
    async getModelDownloadProgress(cropType: string): Promise<{ progress: number; status: string }> {
        // This would be implemented with actual download progress tracking
        return { progress: 0, status: 'not_started' };
    }

    async pauseModelDownload(cropType: string): Promise<boolean> {
        // Implementation for pausing model downloads
        console.log(`Pausing download for ${cropType}`);
        return true;
    }

    async resumeModelDownload(cropType: string): Promise<boolean> {
        // Implementation for resuming model downloads
        console.log(`Resuming download for ${cropType}`);
        return this.downloadOfflineModel(cropType);
    }

    isOfflineServiceReady(): boolean {
        return offlineModelService.isInitialized() && offlineAdviceService.isInitialized();
    }

    async waitForOfflineServices(timeoutMs: number = 10000): Promise<boolean> {
        const startTime = Date.now();

        while (!this.isOfflineServiceReady()) {
            if (Date.now() - startTime > timeoutMs) {
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return true;
    }
}

export const apiService = new ApiService();