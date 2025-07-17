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
        this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5003';
    }

    async classifyImage(imageFile: File, cropType: string): Promise<ClassificationResult> {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('crop_type', cropType);

        const response = await fetch(`${this.baseUrl}/api/classify`, {
            method: 'POST',
            body: formData,
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