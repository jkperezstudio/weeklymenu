import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule, } from '@angular/forms';
import { IonCard, IonItem, IonLabel, IonButton, IonCardHeader, IonCardContent, IonCardTitle } from '@ionic/angular/standalone';


@Component({
  selector: 'app-meal-quick-form',
  templateUrl: './meal-quick-form.component.html',
  styleUrls: ['./meal-quick-form.component.scss'],
  standalone: true,
  imports: [IonCardTitle, IonCardContent, IonCardHeader, IonButton, IonItem, IonLabel, IonCard, FormsModule, ReactiveFormsModule]
})


export class MealQuickFormComponent {
  @Input() meal: { name?: string; score?: number | null } = {};
  @Output() mealSaved = new EventEmitter<{ name: string; score: number }>();

  mealName = '';
  mealScore = 1;

  ngOnInit() {
    if (this.meal) {
      this.mealName = this.meal.name || '';
      this.mealScore = this.meal.score || 1;
    }
  }

  saveMeal() {
    if (this.mealName) {
      this.mealSaved.emit({ name: this.mealName, score: this.mealScore });
    }
  }
}

