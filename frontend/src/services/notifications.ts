/**
 * Web Push Notifications Service
 * Manages notification permissions and scheduling
 */

export interface NotificationConfig {
  cropId: number;
  wateringTimes: string[]; // e.g., ['08:00', '18:00']
  cropName: string;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    try {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  hasPermission(): boolean {
    return this.permission === 'granted';
  }
  
  async scheduleWateringReminder(config: NotificationConfig): Promise<void> {
    if (!this.hasPermission()) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }
    
    // Store configuration in localStorage
    const configs = this.getStoredConfigs();
    configs[config.cropId] = config;
    localStorage.setItem('notificationConfigs', JSON.stringify(configs));
    
    console.log(`Scheduled reminders for ${config.cropName} at ${config.wateringTimes.join(', ')}`);
    
    // In a production app, you would:
    // 1. Register a service worker
    // 2. Use service worker to schedule periodic notifications
    // 3. Use backend to send push notifications via web-push protocol
    
    // For demo, we'll just check at intervals
    this.startNotificationChecker();
  }
  
  cancelReminders(cropId: number): void {
    const configs = this.getStoredConfigs();
    delete configs[cropId];
    localStorage.setItem('notificationConfigs', JSON.stringify(configs));
  }
  
  private getStoredConfigs(): Record<number, NotificationConfig> {
    const stored = localStorage.getItem('notificationConfigs');
    return stored ? JSON.parse(stored) : {};
  }
  
  private startNotificationChecker(): void {
    // Check every minute if we should send a notification
    if (typeof window !== 'undefined' && !window.__notificationCheckerStarted) {
      window.__notificationCheckerStarted = true;
      
      setInterval(() => {
        const configs = this.getStoredConfigs();
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        Object.values(configs).forEach(config => {
          if (config.wateringTimes.includes(currentTime)) {
            this.sendNotification(
              'Watering Time! 💧',
              `Time to water your ${config.cropName}. Log today's conditions to track yield.`,
              config.cropId
            );
          }
        });
      }, 60000); // Check every minute
    }
  }
  
  sendNotification(title: string, body: string, cropId?: number): void {
    if (!this.hasPermission()) return;
    
    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: cropId ? `crop-${cropId}` : 'microgreens',
      requireInteraction: false,
    });
    
    notification.onclick = () => {
      window.focus();
      if (cropId) {
        window.location.href = `/dashboard/${cropId}`;
      }
      notification.close();
    };
    
    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  }
}

declare global {
  interface Window {
    __notificationCheckerStarted?: boolean;
  }
}

export const notificationService = new NotificationService();
export default notificationService;

