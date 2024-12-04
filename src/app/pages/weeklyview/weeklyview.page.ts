import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-weeklyview',
  templateUrl: './weeklyview.page.html',
  styleUrls: ['./weeklyview.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class WeeklyviewPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
