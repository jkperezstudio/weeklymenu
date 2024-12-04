import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Meal } from '../../interfaces/meal.interface';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dailyview',
  templateUrl: './dailyview.page.html',
  styleUrls: ['./dailyview.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    CommonModule
  ],
})
export class DailyviewPage {
  meals: Meal[] = [
    { id: '1', name: 'Breakfast', score: 1, done: false },
    { id: '2', name: 'Lunch', score: 2, done: false },
    { id: '3', name: 'Dinner', score: 5, done: false },
  ];

  constructor(private alertController: AlertController) { }

  toggleMealDone(meal: Meal): void {
    meal.done = !meal.done;
    // Aquí actualizamos el color si fuera necesario
    if (meal.done) {
      // Si el checkbox está marcado, podrías hacer algo específico aquí, aunque ya lo gestionamos en el CSS.
    } else {
      // Si desmarcamos, también podrías añadir lógica específica si lo necesitas.
    }
  }

  async presentMealAlert(meal: Meal) {
    const alert = await this.alertController.create({
      header: meal.name ? 'Edit Meal' : 'Add Meal',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Meal name',
          value: meal.name || '',
        },
        {
          name: 'score',
          type: 'number',
          placeholder: 'Score (1-5)',
          min: 1,
          max: 5,
          value: meal.score || 1,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            meal.name = data.name;
            meal.score = Number(data.score);
          },
        },
      ],
    });

    await alert.present();
  }

  getColorByScore(score: number): string {
    switch (score) {
      case 1:
        return '#f91a30'; // Rojo
      case 2:
        return '#fa691c'; // Naranja
      case 3:
        return '#fce91e'; // Amarillo
      case 4:
        return '#c7f91d'; // Verde claro
      case 5:
        return '#07e911'; // Verde oscuro
      default:
        return '#000'; // Negro por defecto
    }
  }
}
