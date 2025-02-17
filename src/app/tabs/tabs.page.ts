import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, grid, server, reader } from 'ionicons/icons';

addIcons({ calendar, grid });





@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonRouterOutlet, IonIcon, IonTabButton, IonTabBar, IonTabs, CommonModule, FormsModule, IonLabel]
})
export class TabsPage implements OnInit {

  constructor() {
    addIcons({ reader, calendar, server });
  }

  ngOnInit() {
  }

}
