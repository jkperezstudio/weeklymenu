import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink, IonHeader, IonToolbar, IonTitle, IonChip, IonAvatar, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp } from 'ionicons/icons';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonAvatar, IonChip, IonToolbar, IonHeader, RouterLink, RouterLinkActive, CommonModule, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle, IonItem, IonLabel, IonRouterLink, IonRouterOutlet],
})
export class AppComponent {
  public appPages = [
    { title: 'Daily View', url: '/dailyview', icon: 'day-icon' },
    { title: 'Weekly View', url: '/weeklyview', icon: 'week-icon' },
    { title: 'Monthly View', url: '/monthlyview', icon: 'month-icon' },
    { title: 'Meal form', url: '/mealform', icon: 'form-icon' },
    { title: 'Meal database', url: '/mealdb', icon: 'database-icon' },
    { title: 'Stats', url: '/stats', icon: 'stats-icon' },
    { title: 'Config', url: '/config', icon: 'config-icon' },
    { title: 'Test', url: '/checkbox-test', icon: 'database-icon' },
  ];

  constructor(private cdr: ChangeDetectorRef) {
    addIcons({ mailOutline, mailSharp, paperPlaneOutline, paperPlaneSharp, heartOutline, heartSharp, archiveOutline, archiveSharp, trashOutline, trashSharp, warningOutline, warningSharp, bookmarkOutline, bookmarkSharp });
  }



}
