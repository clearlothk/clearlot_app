import { deliveryReminderService } from './deliveryReminderService';

class AppInitializationService {
  private static instance: AppInitializationService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AppInitializationService {
    if (!AppInitializationService.instance) {
      AppInitializationService.instance = new AppInitializationService();
    }
    return AppInitializationService.instance;
  }

  /**
   * Initialize all app services
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🚀 App already initialized, skipping...');
      return;
    }

    try {
      console.log('🚀 Initializing app services...');

      // Initialize delivery reminder system
      await deliveryReminderService.initializeReminders();
      console.log('✅ Delivery reminder system initialized');

      this.initialized = true;
      console.log('✅ App initialization completed');

    } catch (error) {
      console.error('❌ Error during app initialization:', error);
      // Don't throw error - app should still work even if initialization fails
    }
  }

  /**
   * Check if app is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const appInitializationService = AppInitializationService.getInstance();
