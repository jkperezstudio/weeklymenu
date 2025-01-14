
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Meal } from '../../interfaces/meal.interface';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonApp, IonSplitPane, IonRouterOutlet, IonMenu, IonMenuButton, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonItem, IonLabel, IonItemOption, IonItemSliding, IonItemOptions, AlertController, IonCheckbox } from '@ionic/angular/standalone';



@Component({
    selector: 'app-dailyview',
    templateUrl: './dailyview.page.html',
    styleUrls: ['./dailyview.page.scss'],
    standalone: true,
    imports: [IonCheckbox, IonItemOptions, IonItemSliding, IonItemOption, IonLabel, IonItem, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonRouterOutlet, IonSplitPane, IonApp, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenu, IonMenuButton, ReactiveFormsModule]
})
export class DailyviewPage implements OnInit {

    ngOnInit() {
        this.meals.forEach(meal => {
            this.mealDoneControls[meal.id] = new FormControl(meal.done);
        });



    }


    mealDoneControls: { [key: string]: FormControl } = {};


    meals: Meal[] = [
        { id: '1', mealtype: 'Breakfast', name: '', score: 1, done: false },
        { id: '2', mealtype: 'Lunch', name: '', score: 2, done: false },
        { id: '3', mealtype: 'Dinner', name: '', score: 5, done: false }
    ];


    constructor(private alertController: AlertController) { }



    async presentMealAlert(meal: Meal) {
        const alert = await this.alertController.create({
            header: meal.name ? 'Edit Meal' : 'Add Meal',
            inputs: [
                {
                    name: 'name',
                    type: 'text',
                    placeholder: 'Meal name',
                    value: meal.name || ''
                },
                {
                    name: 'score',
                    type: 'number',
                    placeholder: 'Score (1-5)',
                    min: 1,
                    max: 5,
                    value: meal.score || 1
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                        console.log('Edit cancelled');
                    }
                },
                {
                    text: 'Save',
                    handler: (data) => {
                        meal.name = data.name;
                        meal.score = data.score;
                        console.log("Meal saved:", meal);
                    }
                }
            ]
        });

        await alert.present();
    }

    openMealForm(meal: Meal) {
        // Aquí abrirías el formulario para añadir o editar la comida.
        if (meal.name === '') {
            this.presentMealAlert(meal);
            console.log("Abriendo formulario vacío para añadir nueva comida.");
        } else {
            console.log("Comida ya existente:", meal);
        }
    }

    editMeal(meal: Meal) {
        // Este método se activa con el deslizamiento y también llama a openMealForm para editar.
        console.log("Editando comida existente:", meal);
        this.presentMealAlert(meal);
    }

    toggleMealDone(meal: Meal): void {
        meal.done = !meal.done;
    }

    getColorClass(meal: Meal): string {
        const baseClass = meal.done ? 'checked' : 'unchecked';
        const scoreClass = `score-${meal.score}`;
        return `${baseClass} ${scoreClass}`;
    }


    getColorByScore(score: number): string {
        switch (score) {
            case 1: return '#f91a30';
            case 2: return '#fa691c';
            case 3: return '#fce91e';
            case 4: return '#c7f91d';
            case 5: return '#07e911';
            default: return '#616e7e';
        }
    }

}




