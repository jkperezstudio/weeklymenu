import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Meal } from '../interfaces/meal.interface'; // Añadir importación

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  async requestPermissions() {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  }

  async scheduleDefrostAlarm(meal: Meal, targetDate: Date): Promise<number> {
    const notificationId = this.generateNotificationId(meal.id, targetDate);

    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: '¡Defrost Time!',
        body: `Time to defrost ${meal.name}`,
        schedule: { at: targetDate },
        smallIcon: 'defrostalarm',
        sound: 'alarmbeep',
        extra: { mealId: meal.id }
      }]
    });

    return notificationId;
  }

  async cancelDefrostAlarm(notificationId: number) {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
  }

  private generateNotificationId(mealId: string, date: Date): number {
    const hash = mealId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (date.getTime() % 1000000) + hash;
  }
}