export interface ClassificationResult {
    crop_type: string;
    predicted_disease: string;
    confidence: number;
    is_healthy: boolean;
    description: string;
    top_predictions: Array<{
        disease: string;
        confidence: number;
    }>;
    filename?: string;
    file_size?: number;
    status: string;
}

export interface ClassificationError {
    detail: string;
}

class ApiService {
    private baseUrl: string;

    constructor() {
        // For mobile app, we'll use localhost for development
        // In production, this should be your deployed API URL
        this.baseUrl = 'http://localhost:5003';
    }

    async classifyImage(imageUri: string, cropType: string): Promise<ClassificationResult> {
        const formData = new FormData();

        // Create file object from image URI
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'crop_image.jpg',
        } as any);

        formData.append('crop_type', cropType.toLowerCase());

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

        return response.json();
    }

    async getSupportedCrops() {
        const response = await fetch(`${this.baseUrl}/api/crops`);

        if (!response.ok) {
            throw new Error('Failed to fetch supported crops');
        }

        return response.json();
    }
}

export const apiService = new ApiService();