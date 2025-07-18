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
    notes?: string;
    user_question?: string;
    status: string;
    ai_advice?: {
        causes: string;
        immediate_actions: string;
        prevention: string;
        treatment: string;
        monitoring: string;
        question_answer?: string;
    } | null;
    ai_advice_error?: string;
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

    async classifyImage(
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