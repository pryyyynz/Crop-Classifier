import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassificationResult } from './api';

export interface HistoryItem {
    id: string;
    timestamp: number;
    date: string;
    result: ClassificationResult;
    imageUri: string;
}

const HISTORY_KEY = 'predictionHistory';
const MAX_HISTORY_ITEMS = 50; // Limit to prevent storage bloat

class HistoryService {
    /**
     * Add a new prediction to history (latest on top)
     */
    async addPrediction(result: ClassificationResult, imageUri: string): Promise<void> {
        try {
            const history = await this.getHistory();
            const timestamp = Date.now();

            const newItem: HistoryItem = {
                id: `prediction_${timestamp}`,
                timestamp,
                date: this.formatDate(timestamp),
                result,
                imageUri
            };

            // Add to the beginning of the array (latest on top)
            history.unshift(newItem);

            // Limit the number of items to prevent storage bloat
            if (history.length > MAX_HISTORY_ITEMS) {
                history.splice(MAX_HISTORY_ITEMS);
            }

            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Error adding prediction to history:', error);
        }
    }

    /**
     * Get all predictions from history (latest first)
     */
    async getHistory(): Promise<HistoryItem[]> {
        try {
            const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
            if (!historyJson) {
                return [];
            }

            const history: HistoryItem[] = JSON.parse(historyJson);

            // Ensure items are sorted by timestamp (latest first)
            return history.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error getting history:', error);
            return [];
        }
    }

    /**
     * Get a specific prediction by ID
     */
    async getPredictionById(id: string): Promise<HistoryItem | null> {
        try {
            const history = await this.getHistory();
            return history.find(item => item.id === id) || null;
        } catch (error) {
            console.error('Error getting prediction by ID:', error);
            return null;
        }
    }

    /**
     * Delete a prediction from history
     */
    async deletePrediction(id: string): Promise<void> {
        try {
            const history = await this.getHistory();
            const updatedHistory = history.filter(item => item.id !== id);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error('Error deleting prediction:', error);
        }
    }

    /**
     * Clear all history
     */
    async clearHistory(): Promise<void> {
        try {
            await AsyncStorage.removeItem(HISTORY_KEY);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    /**
     * Get history statistics
     */
    async getHistoryStats(): Promise<{
        totalScans: number;
        healthyCount: number;
        diseasedCount: number;
        lastScanDate: string | null;
    }> {
        try {
            const history = await this.getHistory();

            const totalScans = history.length;
            const healthyCount = history.filter(item => item.result.is_healthy).length;
            const diseasedCount = totalScans - healthyCount;
            const lastScanDate = history.length > 0 ? history[0].date : null;

            return {
                totalScans,
                healthyCount,
                diseasedCount,
                lastScanDate
            };
        } catch (error) {
            console.error('Error getting history stats:', error);
            return {
                totalScans: 0,
                healthyCount: 0,
                diseasedCount: 0,
                lastScanDate: null
            };
        }
    }

    private formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();

        // Check if it's today
        if (date.toDateString() === now.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Check if it's yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Format as "Jan 15, 2024"
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

export const historyService = new HistoryService();