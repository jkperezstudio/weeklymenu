import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabs, IonTabBar, IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, grid, restaurantOutline, calendarOutline, bookOutline } from 'ionicons/icons';

addIcons({ calendar, grid });


@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonRouterOutlet, IonIcon, IonTabBar, IonTabs, CommonModule, FormsModule, RouterModule]
})

export class TabsPage {
  activeRoute = 'tabs/daily';
  indicatorTransform = 'translateX(-50%)';
  indicatorLeft = '50%';

  constructor(private router: Router) {
    addIcons({ restaurantOutline, calendarOutline, bookOutline });
  }

  ngOnInit() {
    setTimeout(() => {
      this.activeRoute = this.router.url;
      this.updateIndicatorPosition(true); // 🔥 Asegura la posición inicial correcta
    }, 10);

    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url;
      this.updateIndicatorPosition();
    });
  }

  ionViewWillEnter() {
    this.activeRoute = this.router.url;

    // 🔥 Eliminamos la transición temporalmente para que la bolita no haga el recorrido
    const indicator = document.querySelector('.indicator') as HTMLElement;
    if (indicator) {
      indicator.style.transition = 'none'; // 🔥 Quitar animación antes de moverla
    }

    this.updateIndicatorPosition(true); // 🔥 Posicionar sin animación

    // 🔥 Volvemos a habilitar la animación después de un pequeño delay
    setTimeout(() => {
      if (indicator) {
        indicator.style.transition = 'left 0.3s ease-in-out, transform 0.3s ease-in-out';
      }
    }, 50);
  }






  isActive(route: string): boolean {
    return this.activeRoute.includes(route);
  }

  updateIndicatorPosition(skipAnimation = false) {
    const tabs = document.querySelectorAll('.navigation ul li');
    if (tabs.length === 0) return;

    let newIndex = 0;

    if (this.isActive('tabs/daily')) newIndex = 0;
    else if (this.isActive('tabs/monthly')) newIndex = 1;
    else if (this.isActive('tabs/database')) newIndex = 2;

    const activeTab = tabs[newIndex] as HTMLElement;
    if (!activeTab) return;

    const tabRect = activeTab.getBoundingClientRect();
    const parentRect = (activeTab.parentElement as HTMLElement).getBoundingClientRect();

    const newLeft = tabRect.left - parentRect.left + tabRect.width / 2;

    if (skipAnimation) {
      this.indicatorLeft = `${newLeft}px`;
      this.indicatorTransform = `translateX(-50%)`;
      return;
    }

    this.indicatorLeft = `${newLeft}px`;
    this.indicatorTransform = `translateX(-50%) scale(1.1)`;

    setTimeout(() => {
      this.indicatorTransform = `translateX(-50%) scale(1)`;
    }, 300);
  }



}







