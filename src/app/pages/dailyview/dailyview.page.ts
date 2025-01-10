import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Meal, DailyMeal } from '../../interfaces/meal.interface';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonItem, IonLabel, IonItemOption, IonItemSliding, IonItemOptions, AlertController, IonCheckbox, IonButton } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Component({
    selector: 'app-dailyview',
    templateUrl: './dailyview.page.html',
    styleUrls: ['./dailyview.page.scss'],
    standalone: true,
    imports: [IonButton, IonCheckbox, IonItemOptions, IonItemSliding, IonItemOption, IonLabel, IonItem, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuButton, ReactiveFormsModule]
})
export class DailyviewPage implements OnInit {

    day: number = 0;
    month: number = 0;
    year: number = 0;
    formattedDate: string = '';

    meals: DailyMeal[] = [
        { id: '1', name: '', score: 0, done: false, mealtype: 'Breakfast', date: '', description: '' },
        { id: '2', name: '', score: 0, done: false, mealtype: 'Lunch', date: '', description: '' },
        { id: '3', name: '', score: 0, done: false, mealtype: 'Dinner', date: '', description: '' }
    ];


    mealDoneControls: { [key: string]: FormControl } = {};

    constructor(private alertController: AlertController, private route: ActivatedRoute, private firestore: Firestore) { }

    ngOnInit() {
        this.route.paramMap.subscribe(async (params) => {
            const dateParam = params.get('day');
            if (dateParam) {
                const [year, month, day] = dateParam.split('-').map(Number);
                this.year = year;
                this.month = month;
                this.day = day;
            } else {
                const currentDate = new Date();
                this.year = currentDate.getFullYear();
                this.month = currentDate.getMonth() + 1;
                this.day = currentDate.getDate();
            }

            this.formattedDate = `${this.year}-${this.month}-${this.day}`;
            await this.loadDayData();
        });
    }

    async loadDayData() {
        const dateKey = `${this.year}-${this.month}-${this.day}`;
        const docRef = doc(this.firestore, 'dailyScores', dateKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const dailyData = docSnap.data() as { meals: DailyMeal[] };
            this.meals = dailyData.meals;
            console.log('Datos del día cargados:', this.meals);
        } else {
            console.log('No hay datos guardados para este día.');
        }
    }

    saveDayDataToFirebase() {
        const dateKey = `${this.year}-${this.month}-${this.day}`;
        const docRef = doc(this.firestore, 'dailyScores', dateKey);

        setDoc(docRef, {
            year: this.year,
            month: this.month,
            day: this.day,
            meals: this.meals.map(meal => ({
                id: meal.id,
                name: meal.name,
                score: meal.score,
                done: meal.done,
                mealtype: meal.mealtype
            })),
            score: this.calculateAverageScore(),
            color: this.getColorByScore(this.calculateAverageScore())
        })
            .then(() => console.log('Datos diarios guardados correctamente.'))
            .catch(error => console.error('Error al guardar los datos diarios:', error));
    }

    async presentMealAlert(meal: DailyMeal) {
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
                    handler: () => console.log('Edit cancelled')
                },
                {
                    text: 'Save',
                    handler: (data) => {
                        meal.name = data.name;
                        meal.score = parseInt(data.score, 10);
                        this.saveDayDataToFirebase();
                        console.log('Meal updated:', meal);
                    }
                }
            ]
        });

        await alert.present();
    }

    openMealForm(meal: DailyMeal) {
        if (meal.name === '') {
            this.presentMealAlert(meal);
            console.log("Abriendo formulario vacío para añadir nueva comida.");
        } else {
            console.log("Comida ya existente:", meal);
        }
    }

    editMeal(meal: DailyMeal) {
        console.log("Editando comida existente:", meal);
        this.presentMealAlert(meal);
    }

    toggleMealDone(meal: DailyMeal): void {
        meal.done = !meal.done;
        this.saveDayDataToFirebase();
        console.log('Meal status updated and saved in Firebase:', meal);
    }

    isDayComplete(): boolean {
        return this.meals.every(meal => meal.done);
    }

    async finalizeDay() {
        if (this.isDayComplete()) {
            const averageScore = this.calculateAverageScore();
            const color = this.getColorByScore(averageScore);
            const dateKey = `${this.year}-${this.month}-${this.day}`;

            try {
                const docRef = doc(this.firestore, 'dailyScores', dateKey);
                await setDoc(docRef, {
                    year: this.year,
                    month: this.month,
                    day: this.day,
                    meals: this.meals,
                    score: averageScore,
                    color: color
                });

                const alert = await this.alertController.create({
                    header: 'Day Summary',
                    message: `The average score for today is: ${averageScore.toFixed(1)} (${color})`,
                    buttons: ['OK']
                });

                await alert.present();
            } catch (error) {
                console.error('Error guardando en Firestore:', error);
            }
        }
    }

    calculateAverageScore(): number {
        const totalScore = this.meals.reduce((sum, meal) => sum + (meal.score || 0), 0);
        return totalScore / this.meals.length;
    }

    getColorByScore(score: number): string {
        if (score >= 4.5) return '#07e911';
        if (score >= 3.5) return '#c7f91d';
        if (score >= 2.5) return '#fce91e';
        if (score >= 1.5) return '#fa691c';
        return '#f91a30';
    }

    getColorClass(meal: DailyMeal): string {
        const baseClass = meal.done ? 'checked' : 'unchecked';
        const scoreClass = `score-${meal.score}`;
        return `${baseClass} ${scoreClass}`;
    }
}
