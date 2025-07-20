import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onnxInferenceService } from './onnxInferenceService';

export interface ModelClassification {
    predicted_disease: string;
    confidence: number;
    top_predictions: { disease: string; confidence: number }[];
}

export interface ModelInfo {
    totalModels: number;
    availableModels: string[];
    storageUsed: number;
}

export class OfflineModelService {
    private modelLabels: { [key: string]: string[] } = {};
    private initialized = false;
    private modelsDirectory: string;

    // AWS S3 Configuration
    private readonly AWS_CONFIG = {
        accessKeyId: 'AKIA4P7NVGLNTVI2UBX3',
        secretAccessKey: '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',
        region: 'eu-west-1',
        bucket: 'ghana-ai-hackathon',
        modelPrefix: 'models/'
    };

    constructor() {
        this.modelsDirectory = `${FileSystem.documentDirectory}models/`;
        this.initializeModelLabels();
    }

    private initializeModelLabels() {
        // Define class labels for each crop model (exactly matching backend)
        this.modelLabels = {
            cashew: ['anthracnose', 'gumosis', 'healthy', 'leaf_miner', 'red_rust'],
            cassava: ['bacterial_blight', 'brown_spot', 'green_mite', 'healthy', 'mosaic'],
            maize: ['fall_armyworm', 'grasshoper', 'healthy', 'leaf_beetle', 'leaf_blight', 'leaf_spot', 'streak_virus'],
            tomato: ['healthy', 'leaf_blight', 'leaf_curl', 'septoria_leaf_spot', 'verticulium_wilt']
        };
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Ensure models directory exists
            const dirInfo = await FileSystem.getInfoAsync(this.modelsDirectory);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.modelsDirectory, { intermediates: true });
            }

            // Initialize ONNX inference service
            await onnxInferenceService.initialize();

            // Load any existing models
            await this.loadExistingModels();

            this.initialized = true;
            console.log('Offline model service initialized with S3 integration and ONNX runtime');
        } catch (error) {
            console.error('Failed to initialize offline model service:', error);
        }
    }

    private async loadExistingModels(): Promise<void> {
        try {
            const modelInfo = await this.getModelInfo();

            for (const cropType of modelInfo.availableModels) {
                const modelPath = this.getModelPath(cropType);
                const fileInfo = await FileSystem.getInfoAsync(modelPath);

                if (fileInfo.exists) {
                    console.log(`Loading existing ${cropType} model...`);
                    await onnxInferenceService.loadModel(modelPath, cropType);
                }
            }
        } catch (error) {
            console.error('Error loading existing models:', error);
        }
    }

    private async generateS3Url(modelName: string): Promise<string> {
        const objectKey = `${this.AWS_CONFIG.modelPrefix}${modelName}`;
        // Use direct public URL format
        const url = `https://${this.AWS_CONFIG.bucket}.s3.${this.AWS_CONFIG.region}.amazonaws.com/${objectKey}`;
        return url;
    }

    async downloadModel(cropType: string): Promise<boolean> {
        try {
            const modelName = `best_${cropType.toLowerCase()}_model.onnx`;
            const modelUrl = await this.generateS3Url(modelName);
            const localPath = `${this.modelsDirectory}${modelName}`;

            console.log(`Downloading ${cropType} model from S3...`);
            console.log(`URL: ${modelUrl}`);

            // Check if model already exists
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
                console.log(`Model ${cropType} already exists, loading into ONNX runtime...`);
                const loadSuccess = await onnxInferenceService.loadModel(localPath, cropType);
                if (loadSuccess) {
                    await this.updateModelInfo(cropType, true);
                }
                return loadSuccess;
            }

            // Try to download the model
            console.log(`Attempting to download from: ${modelUrl}`);

            const downloadResult = await FileSystem.downloadAsync(modelUrl, localPath, {
                headers: {
                    'User-Agent': 'Crop-Classifier-Mobile-App/1.0',
                    'Accept': 'application/octet-stream'
                }
            });

            console.log(`Download result status: ${downloadResult.status}`);

            if (downloadResult.status === 200) {
                console.log(`Successfully downloaded ${cropType} model`);

                // Verify the downloaded file exists and has content
                const downloadedFile = await FileSystem.getInfoAsync(localPath);
                if (!downloadedFile.exists || (downloadedFile.size && downloadedFile.size < 1000)) {
                    console.error(`Downloaded file is invalid or too small: ${downloadedFile.size} bytes`);
                    // Clean up invalid file
                    if (downloadedFile.exists) {
                        await FileSystem.deleteAsync(localPath);
                    }
                    return false;
                }

                console.log(`Downloaded model size: ${downloadedFile.size} bytes`);

                // Load the model into ONNX runtime
                const loadSuccess = await onnxInferenceService.loadModel(localPath, cropType);
                if (!loadSuccess) {
                    console.error(`Failed to load ${cropType} model into ONNX runtime`);
                    // Clean up file if it can't be loaded
                    await FileSystem.deleteAsync(localPath);
                    return false;
                }

                await this.updateModelInfo(cropType, true);
                return true;
            } else if (downloadResult.status === 403) {
                throw new Error(`Access denied: S3 bucket requires public read permissions for models/ folder.\n\nTo fix this:\n1. Go to AWS S3 Console\n2. Select 'ghana-ai-hackathon' bucket\n3. Go to Permissions > Bucket Policy\n4. Add public read policy for models/* objects`);
            } else if (downloadResult.status === 404) {
                throw new Error(`Model '${modelName}' not found in S3 bucket.\n\nPlease verify the model exists at:\n${modelUrl}`);
            } else {
                throw new Error(`Download failed with HTTP ${downloadResult.status}.\nURL: ${modelUrl}`);
            }
        } catch (error) {
            console.error(`Error downloading ${cropType} model:`, error);

            // Provide helpful error messages
            if (error instanceof Error) {
                if (error.message.includes('Network request failed')) {
                    throw new Error(`Network error: Please check your internet connection and try again.`);
                } else if (error.message.includes('Access denied') || error.message.includes('403')) {
                    throw new Error(`Access denied: The S3 bucket needs public read permissions.\n\nContact the administrator to make the models/ folder publicly readable.`);
                } else {
                    throw new Error(`Download failed: ${error.message}`);
                }
            }

            return false;
        }
    }

    async deleteModel(cropType: string): Promise<boolean> {
        try {
            const modelName = `best_${cropType.toLowerCase()}_model.onnx`;
            const localPath = `${this.modelsDirectory}${modelName}`;

            // Unload from ONNX runtime
            onnxInferenceService.unloadModel(cropType);

            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(localPath);
                console.log(`Deleted ${cropType} model`);
            }

            await this.updateModelInfo(cropType, false);
            return true;
        } catch (error) {
            console.error(`Error deleting ${cropType} model:`, error);
            return false;
        }
    }

    private async updateModelInfo(cropType: string, isAdding: boolean): Promise<void> {
        try {
            const currentInfo = await this.getModelInfo();
            let availableModels = currentInfo.availableModels;

            if (isAdding) {
                if (!availableModels.includes(cropType.toLowerCase())) {
                    availableModels.push(cropType.toLowerCase());
                }
            } else {
                availableModels = availableModels.filter(model => model !== cropType.toLowerCase());
            }

            // Calculate actual storage used
            let totalSize = 0;
            for (const model of availableModels) {
                const modelName = `best_${model}_model.onnx`;
                const localPath = `${this.modelsDirectory}${modelName}`;
                const fileInfo = await FileSystem.getInfoAsync(localPath);
                if (fileInfo.exists) {
                    totalSize += fileInfo.size || 0;
                }
            }

            const modelInfo = {
                totalModels: Object.keys(this.modelLabels).length,
                availableModels,
                storageUsed: totalSize
            };

            await AsyncStorage.setItem('offlineModelInfo', JSON.stringify(modelInfo));
        } catch (error) {
            console.error('Failed to update model info:', error);
        }
    }

    async getModelInfo(): Promise<ModelInfo> {
        try {
            const storedInfo = await AsyncStorage.getItem('offlineModelInfo');
            if (storedInfo) {
                return JSON.parse(storedInfo);
            }

            // Calculate current available models by checking file system
            const availableModels: string[] = [];
            let totalSize = 0;

            for (const crop of Object.keys(this.modelLabels)) {
                const modelName = `best_${crop}_model.onnx`;
                const localPath = `${this.modelsDirectory}${modelName}`;
                const fileInfo = await FileSystem.getInfoAsync(localPath);
                if (fileInfo.exists) {
                    availableModels.push(crop);
                    totalSize += fileInfo.size || 0;
                }
            }

            const modelInfo = {
                totalModels: Object.keys(this.modelLabels).length,
                availableModels,
                storageUsed: totalSize
            };

            // Save the calculated info
            await AsyncStorage.setItem('offlineModelInfo', JSON.stringify(modelInfo));
            return modelInfo;
        } catch (error) {
            console.error('Failed to get model info:', error);
            return {
                totalModels: Object.keys(this.modelLabels).length,
                availableModels: [],
                storageUsed: 0
            };
        }
    }

    async isModelAvailable(cropType: string): Promise<boolean> {
        const modelName = `best_${cropType.toLowerCase()}_model.onnx`;
        const localPath = `${this.modelsDirectory}${modelName}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        return fileInfo.exists && onnxInferenceService.isModelLoaded(cropType);
    }

    async classifyImage(imageUri: string, cropType: string): Promise<ModelClassification> {
        const crop = cropType.toLowerCase();

        if (!(await this.isModelAvailable(crop))) {
            throw new Error(`Model not available for ${cropType}. Please download the model first.`);
        }

        try {
            console.log(`Running real ONNX inference for ${cropType}...`);

            // Use ONNX inference service for actual model prediction
            const { predictions, confidence } = await onnxInferenceService.predictFromImage(imageUri, crop);

            // Convert predictions to classification result
            const labels = this.modelLabels[crop];
            const topPredictions = Array.from(predictions)
                .map((confidence, index) => ({
                    disease: labels[index],
                    confidence: Math.round(confidence * 100)
                }))
                .sort((a, b) => b.confidence - a.confidence);

            const topPrediction = topPredictions[0];

            console.log(`ONNX inference for ${cropType}: ${topPrediction.disease} (${topPrediction.confidence}%)`);

            return {
                predicted_disease: topPrediction.disease,
                confidence: topPrediction.confidence,
                top_predictions: topPredictions.slice(0, 3)
            };
        } catch (error) {
            console.error('Classification error:', error);
            throw new Error(`Classification failed: ${error}`);
        }
    }

    async clearAllModels(): Promise<void> {
        try {
            // Unload all models from ONNX runtime
            const loadedModels = onnxInferenceService.getLoadedModels();
            for (const cropType of loadedModels) {
                onnxInferenceService.unloadModel(cropType);
            }

            const dirInfo = await FileSystem.getInfoAsync(this.modelsDirectory);
            if (dirInfo.exists) {
                await FileSystem.deleteAsync(this.modelsDirectory);
                await FileSystem.makeDirectoryAsync(this.modelsDirectory, { intermediates: true });
            }

            await AsyncStorage.removeItem('offlineModelInfo');
            console.log('All offline models cleared');
        } catch (error) {
            console.error('Error clearing models:', error);
        }
    }

    getSupportedCrops(): string[] {
        return Object.keys(this.modelLabels);
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    getModelPath(cropType: string): string {
        const modelName = `best_${cropType.toLowerCase()}_model.onnx`;
        return `${this.modelsDirectory}${modelName}`;
    }
}

export const offlineModelService = new OfflineModelService();