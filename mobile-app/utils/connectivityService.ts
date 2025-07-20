import React from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConnectivityState {
    isOnline: boolean;
    isOfflineMode: boolean;
    canUseOnlineFeatures: boolean;
    connectionType?: string;
    isInternetReachable?: boolean | null;
    connectionQuality?: 'poor' | 'good' | 'excellent';
    lastOnlineTimestamp?: number;
}

export interface NetworkStats {
    totalOnlineTime: number;
    totalOfflineTime: number;
    connectionSwitches: number;
    lastConnected?: number;
    lastDisconnected?: number;
}

export class ConnectivityService {
    private currentState: ConnectivityState = {
        isOnline: false,
        isOfflineMode: false,
        canUseOnlineFeatures: false,
        connectionType: 'unknown',
        isInternetReachable: null,
        connectionQuality: 'poor'
    };

    private listeners: ((state: ConnectivityState) => void)[] = [];
    private netInfoUnsubscribe: (() => void) | null = null;
    private initialized = false;
    private networkStats: NetworkStats = {
        totalOnlineTime: 0,
        totalOfflineTime: 0,
        connectionSwitches: 0
    };
    private lastStateChangeTime: number = Date.now();
    private connectionQualityInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        if (this.initialized) return;

        try {
            // Load saved preferences and stats
            await this.loadSavedData();

            // Set up network state monitoring with enhanced detection
            this.netInfoUnsubscribe = NetInfo.addEventListener(this.handleNetworkChange.bind(this));

            // Get initial network state
            const netState = await NetInfo.fetch();
            await this.handleNetworkChange(netState);

            // Start connection quality monitoring
            this.startConnectionQualityMonitoring();

            this.initialized = true;
            console.log('Enhanced connectivity service initialized');
        } catch (error) {
            console.error('Failed to initialize connectivity service:', error);
            this.initialized = true; // Continue with basic functionality
        }
    }

    private async loadSavedData() {
        try {
            // Load offline mode preference
            const savedOfflineMode = await AsyncStorage.getItem('offlineMode');
            const isOfflineMode = savedOfflineMode === 'true';

            // Load network statistics
            const savedStats = await AsyncStorage.getItem('networkStats');
            if (savedStats) {
                this.networkStats = JSON.parse(savedStats);
            }

            this.currentState.isOfflineMode = isOfflineMode;
        } catch (error) {
            console.error('Failed to load saved connectivity data:', error);
        }
    }

    private async saveNetworkStats() {
        try {
            await AsyncStorage.setItem('networkStats', JSON.stringify(this.networkStats));
        } catch (error) {
            console.error('Failed to save network stats:', error);
        }
    }

    private async handleNetworkChange(state: NetInfoState) {
        const wasOnline = this.currentState.isOnline;
        const isOnline = state.isConnected === true && state.isInternetReachable === true;
        const currentTime = Date.now();

        // Update network statistics
        if (wasOnline !== isOnline) {
            const timeDiff = currentTime - this.lastStateChangeTime;

            if (wasOnline) {
                this.networkStats.totalOnlineTime += timeDiff;
                this.networkStats.lastDisconnected = currentTime;
            } else {
                this.networkStats.totalOfflineTime += timeDiff;
                this.networkStats.lastConnected = currentTime;
            }

            this.networkStats.connectionSwitches++;
            this.lastStateChangeTime = currentTime;
            await this.saveNetworkStats();
        }

        // Determine connection quality
        const connectionQuality = this.determineConnectionQuality(state);

        // Update current state
        this.currentState = {
            isOnline,
            isOfflineMode: this.currentState.isOfflineMode,
            canUseOnlineFeatures: isOnline && !this.currentState.isOfflineMode,
            connectionType: state.type || 'unknown',
            isInternetReachable: state.isInternetReachable,
            connectionQuality,
            lastOnlineTimestamp: isOnline ? currentTime : this.currentState.lastOnlineTimestamp
        };

        // Log significant network changes
        if (wasOnline !== isOnline) {
            console.log(`Network state changed: ${isOnline ? 'Online' : 'Offline'} (${state.type})`);
        }

        this.notifyListeners();
    }

    private determineConnectionQuality(state: NetInfoState): 'poor' | 'good' | 'excellent' {
        if (!state.isConnected || state.isInternetReachable === false) {
            return 'poor';
        }

        // Determine quality based on connection type and details
        switch (state.type) {
            case 'wifi':
                // WiFi quality assessment
                if (state.details && typeof state.details === 'object') {
                    const wifiDetails = state.details as any;
                    if (wifiDetails.strength && wifiDetails.strength > 80) {
                        return 'excellent';
                    } else if (wifiDetails.strength && wifiDetails.strength > 50) {
                        return 'good';
                    }
                }
                return 'good'; // Default for WiFi

            case 'cellular':
                // Cellular quality assessment
                if (state.details && typeof state.details === 'object') {
                    const cellularDetails = state.details as any;
                    if (cellularDetails.cellularGeneration === '5g') {
                        return 'excellent';
                    } else if (cellularDetails.cellularGeneration === '4g') {
                        return 'good';
                    }
                }
                return 'good'; // Default for cellular

            case 'ethernet':
                return 'excellent';

            default:
                return 'poor';
        }
    }

    private startConnectionQualityMonitoring() {
        // Periodically test connection quality with actual network requests
        this.connectionQualityInterval = setInterval(async () => {
            if (this.currentState.isOnline && this.currentState.canUseOnlineFeatures) {
                await this.testConnectionLatency();
            }
        }, 60000); // Test every minute when online
    }

    private async testConnectionLatency() {
        try {
            const startTime = Date.now();
            const response = await fetch('https://iumqtt2ins.eu-west-1.awsapprunner.com/api/health', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000)
            });

            const latency = Date.now() - startTime;

            if (response.ok) {
                // Update connection quality based on latency
                let quality: 'poor' | 'good' | 'excellent';
                if (latency < 200) {
                    quality = 'excellent';
                } else if (latency < 500) {
                    quality = 'good';
                } else {
                    quality = 'poor';
                }

                if (quality !== this.currentState.connectionQuality) {
                    this.currentState.connectionQuality = quality;
                    this.notifyListeners();
                }
            }
        } catch (error) {
            // Connection test failed, mark as poor quality
            if (this.currentState.connectionQuality !== 'poor') {
                this.currentState.connectionQuality = 'poor';
                this.notifyListeners();
            }
        }
    }

    public async setOfflineMode(enabled: boolean) {
        try {
            await AsyncStorage.setItem('offlineMode', enabled.toString());

            const previousCanUseOnline = this.currentState.canUseOnlineFeatures;

            this.currentState = {
                ...this.currentState,
                isOfflineMode: enabled,
                canUseOnlineFeatures: this.currentState.isOnline && !enabled
            };

            // Log mode change
            console.log(`Offline mode ${enabled ? 'enabled' : 'disabled'}`);

            this.notifyListeners();

            // Trigger additional actions based on mode change
            if (enabled && previousCanUseOnline) {
                console.log('Switched to offline mode - online features disabled');
            } else if (!enabled && this.currentState.isOnline) {
                console.log('Switched to online mode - online features enabled');
            }
        } catch (error) {
            console.error('Failed to set offline mode:', error);
            throw error;
        }
    }

    public getState(): ConnectivityState {
        return { ...this.currentState };
    }

    public getNetworkStats(): NetworkStats {
        // Update current session time
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastStateChangeTime;

        const stats = { ...this.networkStats };
        if (this.currentState.isOnline) {
            stats.totalOnlineTime += timeDiff;
        } else {
            stats.totalOfflineTime += timeDiff;
        }

        return stats;
    }

    public async resetNetworkStats() {
        this.networkStats = {
            totalOnlineTime: 0,
            totalOfflineTime: 0,
            connectionSwitches: 0
        };
        this.lastStateChangeTime = Date.now();
        await this.saveNetworkStats();
        console.log('Network statistics reset');
    }

    public addListener(listener: (state: ConnectivityState) => void) {
        this.listeners.push(listener);

        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.currentState);
            } catch (error) {
                console.error('Error in connectivity listener:', error);
            }
        });
    }

    public async forceNetworkRefresh() {
        try {
            console.log('Forcing network state refresh...');
            const netState = await NetInfo.refresh();
            await this.handleNetworkChange(netState);
            return this.currentState;
        } catch (error) {
            console.error('Failed to refresh network state:', error);
            throw error;
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public cleanup() {
        if (this.netInfoUnsubscribe) {
            this.netInfoUnsubscribe();
            this.netInfoUnsubscribe = null;
        }

        if (this.connectionQualityInterval) {
            clearInterval(this.connectionQualityInterval);
            this.connectionQualityInterval = null;
        }

        this.listeners = [];
        this.initialized = false;
        console.log('Connectivity service cleaned up');
    }

    // Advanced connectivity features
    public async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
        if (this.currentState.canUseOnlineFeatures) {
            return true;
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                unsubscribe();
                resolve(false);
            }, timeoutMs);

            const unsubscribe = this.addListener((state) => {
                if (state.canUseOnlineFeatures) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(true);
                }
            });
        });
    }

    public getConnectionStatusMessage(): string {
        if (this.currentState.isOfflineMode) {
            return 'Offline Mode Active';
        }

        if (!this.currentState.isOnline) {
            return 'No Internet Connection';
        }

        if (!this.currentState.isInternetReachable) {
            return 'Limited Connectivity';
        }

        const quality = this.currentState.connectionQuality;
        const type = this.currentState.connectionType;

        return `Connected via ${type} (${quality} quality)`;
    }

    public shouldRetryRequest(): boolean {
        return this.currentState.canUseOnlineFeatures &&
            this.currentState.connectionQuality !== 'poor';
    }

    public getRecommendedTimeout(): number {
        switch (this.currentState.connectionQuality) {
            case 'excellent':
                return 10000; // 10 seconds
            case 'good':
                return 20000; // 20 seconds
            case 'poor':
                return 30000; // 30 seconds
            default:
                return 15000; // 15 seconds default
        }
    }
}

export const connectivityService = new ConnectivityService();

// Enhanced React hook for using connectivity in components
export function useConnectivity(): ConnectivityState & {
    setOfflineMode: (enabled: boolean) => void;
    networkStats: NetworkStats;
    forceRefresh: () => Promise<ConnectivityState>;
    waitForConnection: (timeoutMs?: number) => Promise<boolean>;
    statusMessage: string;
} {
    const [state, setState] = React.useState<ConnectivityState>(connectivityService.getState());
    const [networkStats, setNetworkStats] = React.useState<NetworkStats>(connectivityService.getNetworkStats());

    React.useEffect(() => {
        const unsubscribe = connectivityService.addListener((newState) => {
            setState(newState);
            setNetworkStats(connectivityService.getNetworkStats());
        });
        return unsubscribe;
    }, []);

    return {
        ...state,
        networkStats,
        setOfflineMode: connectivityService.setOfflineMode.bind(connectivityService),
        forceRefresh: connectivityService.forceNetworkRefresh.bind(connectivityService),
        waitForConnection: connectivityService.waitForConnection.bind(connectivityService),
        statusMessage: connectivityService.getConnectionStatusMessage()
    };
}