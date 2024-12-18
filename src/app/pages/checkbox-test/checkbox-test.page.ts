import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonCheckbox, IonTextarea, IonInput, IonRange, IonCardContent, IonCard } from '@ionic/angular/standalone';

@Component({
  selector: 'app-checkbox-test',
  templateUrl: './checkbox-test.page.html',
  styleUrls: ['./checkbox-test.page.scss'],
  standalone: true,
  imports: [IonCard, IonCardContent, IonRange, IonInput, IonTextarea, IonCheckbox, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CheckboxTestPage implements OnInit {
  scoreControl = new FormControl(3, { nonNullable: true });

  constructor() { }

  ngOnInit() {
  }

  getScoreColor(score: number | null): string {
    if (!score) return '#ccc'; // Color gris por defecto si no hay valor
    switch (score) {
      case 1: return '#ff4d4d'; // Rojo
      case 2: return '#ffa64d'; // Naranja
      case 3: return '#ffd24d'; // Amarillo
      case 4: return '#b3ff4d'; // Verde claro
      case 5: return '#4dff4d'; // Verde fuerte
      default: return '#ccc';    // Gris por defecto
    }
  }

}
