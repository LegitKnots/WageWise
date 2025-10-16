import { Platform, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { PermissionsAndroid } from 'react-native';

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      
      if (hasPermission) {
        // Configure push notifications
        PushNotification.configure({
          onRegister: function (token) {
            console.log('TOKEN:', token);
          },
          onNotification: function (notification) {
            console.log('NOTIFICATION:', notification);
          },
          onAction: function (notification) {
            console.log('ACTION:', notification.action);
            console.log('NOTIFICATION:', notification);
          },
          onRegistrationError: function(err) {
            console.error(err.message, err);
          },
          permissions: {
            alert: true,
            badge: true,
            sound: true,
          },
          popInitialNotification: true,
          requestPermissions: false, // We handle this manually
          // Android specific
          channelId: 'payday_reminders',
        });

        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'WageWise would like to send you payday reminders.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled by the PushNotification library
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  public schedulePaydayReminder(employerName: string, payDate: Date, reminderType: 'twoHoursAfter' | 'eightAmSameDay' | 'noonDayAfter'): void {
    try {
      let notificationDate = new Date(payDate);

      switch (reminderType) {
        case 'twoHoursAfter':
          notificationDate.setHours(notificationDate.getHours() + 2);
          break;
        case 'eightAmSameDay':
          notificationDate.setHours(8, 0, 0, 0);
          break;
        case 'noonDayAfter':
          notificationDate.setDate(notificationDate.getDate() + 1);
          notificationDate.setHours(12, 0, 0, 0);
          break;
      }

      // Don't schedule if the date is in the past
      if (notificationDate <= new Date()) {
        return;
      }

      PushNotification.localNotificationSchedule({
        id: `payday_${employerName}_${payDate.getTime()}`,
        title: 'Payday Reminder',
        message: `Don't forget to log your paycheck for ${employerName}!`,
        date: notificationDate,
        allowWhileIdle: true,
        repeatType: 'day',
        repeatTime: 24 * 60 * 60 * 1000, // Repeat daily
        channelId: 'payday_reminders',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
      });

      console.log(`Scheduled payday reminder for ${employerName} at ${notificationDate}`);
    } catch (error) {
      console.error('Error scheduling payday reminder:', error);
    }
  }

  public cancelPaydayReminder(employerName: string, payDate: Date): void {
    try {
      const notificationId = `payday_${employerName}_${payDate.getTime()}`;
      PushNotification.cancelLocalNotifications({ id: notificationId });
      console.log(`Cancelled payday reminder for ${employerName}`);
    } catch (error) {
      console.error('Error cancelling payday reminder:', error);
    }
  }

  public cancelAllReminders(): void {
    try {
      PushNotification.cancelAllLocalNotifications();
      console.log('Cancelled all payday reminders');
    } catch (error) {
      console.error('Error cancelling all reminders:', error);
    }
  }

  public async testNotification(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (hasPermission) {
      PushNotification.localNotification({
        title: 'Test Notification',
        message: 'WageWise notifications are working!',
        channelId: 'payday_reminders',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
      });
      } else {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

export default NotificationService.getInstance();
