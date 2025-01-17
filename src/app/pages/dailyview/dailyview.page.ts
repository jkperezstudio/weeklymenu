import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Meal, FirestoreDayData } from '../../interfaces/meal.interface';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonItem, IonLabel, IonItemOption, IonItemSliding, IonItemOptions, AlertController, IonCheckbox, IonButton, IonFooter, IonList, IonModal, IonSelect, IonSelectOption, IonInput, IonRange, IonToggle, } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';

@Component({
    selector: 'app-dailyview',
    templateUrl: './dailyview.page.html',
    styleUrls: ['./dailyview.page.scss'],
    standalone: true,
    imports: [IonModal, IonList, IonFooter, IonButton, IonCheckbox, IonItemOptions, IonItemSliding, IonItemOption, IonLabel, IonItem, IonCardContent, IonCardHeader, IonCardTitle, IonCard, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuButton, ReactiveFormsModule, IonSelect, IonSelectOption, IonInput, IonRange, IonToggle]
})
export class DailyviewPage implements OnInit {

    day: number = 0;
    month: number = 0;
    year: number = 0;
    formattedDate: string = '';

    constructor(private alertController: AlertController, private route: ActivatedRoute, private firestore: Firestore) { }

    ngOnInit() {
        // Obtenemos el parámetro 'day' de la URL
        this.route.paramMap.subscribe(async (params) => {
            const dateParam = params.get('day');
            if (dateParam) {
                // Si hay un parámetro, dividimos en año, mes y día
                const [year, month, day] = dateParam.split('-').map(Number);
                this.year = year;
                this.month = month;
                this.day = day;
            } else {
                // Si no hay parámetro, usamos la fecha actual
                const currentDate = new Date();
                this.year = currentDate.getFullYear();
                this.month = currentDate.getMonth() + 1; // Recordar que los meses empiezan en 0
                this.day = currentDate.getDate();
            }

            // Creamos una fecha formateada basada en el día, mes y año recibidos o actuales
            this.formattedDate = new Date(this.year, this.month - 1, this.day).toDateString();
            console.log('Formatted date:', this.formattedDate);

            // Leer datos de Firestore
            const dateKey = `${this.year}-${this.month}-${this.day}`;
            const docRef = doc(this.firestore, 'dailyScores', dateKey);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as FirestoreDayData; // Tipamos los datos usando FirestoreDayData
                console.log('Datos cargados desde Firestore:', data);

                // Asignamos los valores al componente utilizando los datos cargados desde Firestore
                this.meals.forEach((meal, index) => {
                    if (data.meals && data.meals[index]) {
                        meal.name = data.meals[index].name;
                        meal.score = data.meals[index].score;
                        meal.done = data.meals[index].done;
                        meal.mealtype = data.meals[index].mealtype;
                        meal.description = data.meals[index].description;
                        meal.recipe = data.meals[index].recipe;
                        meal.url = data.meals[index].url;
                        meal.image = data.meals[index].image;
                    }
                });
            }


            // Inicializamos los controles del formulario de las comidas
            this.meals.forEach(meal => {
                this.mealDoneControls[meal.id] = new FormControl(meal.done);
            });
        });
    }


    isModalOpen = false;
    currentMeal: Meal = { id: '', name: '', score: 0, done: false, mealtype: '', description: '', reminder: false };
    suggestions: string[] = [];
    mealDoneControls: { [key: string]: FormControl } = {};

    meals: Meal[] = [
        { id: '1', mealtype: 'Breakfast', name: '', score: 0, done: false, reminder: false },
        { id: '2', mealtype: 'Lunch', name: '', score: 0, done: false, reminder: false },
        { id: '3', mealtype: 'Dinner', name: '', score: 0, done: false, reminder: false }
    ];

    static dayScores: { [date: string]: { score: number; color: string } } = {};

    openMealForm(meal: Meal) {
        this.currentMeal = meal
            ? { ...meal }
            : {
                id: '',
                name: '',
                score: 0, // Valor por defecto
                done: false,
                mealtype: 'Custom',
                description: '',
                reminder: false,
            };
        console.log('Current meal on opening modal:', this.currentMeal);
        this.isModalOpen = true;
    }



    closeModal() {
        this.isModalOpen = false;
    }

    onModalDismiss(event: any) {
        console.log('Modal dismissed:', event);
        this.isModalOpen = false;

    }

    filterSuggestions() {
        // Simula la búsqueda en la base de datos
        const query = this.currentMeal.name.toLowerCase();
        this.suggestions = this.meals
            .map(m => m.name)
            .filter(name => name.toLowerCase().includes(query) && name !== this.currentMeal.name);
    }

    setSuggestion() {
        // Actualizamos el rango al seleccionar una sugerencia
        const selectedMeal = this.meals.find(m => m.name === this.currentMeal.name);
        if (selectedMeal) {
            this.currentMeal.score = selectedMeal.score;
        }
    }

    saveMeal() {
        console.log('Saving meal:', this.currentMeal);

        if (!this.currentMeal.name || !this.currentMeal.score) {
            console.error('Meal name and score are required');
            return;
        }

        if (this.currentMeal.id) {
            // Actualizar comida existente
            const index = this.meals.findIndex(m => m.id === this.currentMeal.id);
            if (index !== -1) {
                this.meals[index] = { ...this.currentMeal };
            }
        } else {
            // Crear nueva comida
            const newMeal: Meal = {
                ...this.currentMeal,
                id: (this.meals.length + 1).toString(), // Generar un ID único
                mealtype: this.currentMeal.mealtype || 'Custom'
            };
            this.meals.push(newMeal);
        }

        console.log('Meals updated:', this.meals);

        // Guarda los datos en Firestore
        this.saveDayDataToFirebase();
        this.closeModal();
    }



    editMeal(meal: Meal) {
        // Este método se activa con el deslizamiento y también llama a openMealForm para editar.
        console.log("Editando comida existente:", meal);
        this.openMealForm(meal);
    }

    toggleMealDone(meal: Meal): void {
        meal.done = !meal.done;

        // Subir los datos actualizados a Firebase
        this.saveDayDataToFirebase();
        console.log("Meal status updated and saved in Firebase:", meal);
    }


    isDayComplete(): boolean {
        // Verificar si todas las comidas están hechas
        return this.meals.every(meal => meal.done);
    }

    async finalizeDay() {
        if (this.isDayComplete()) {
            const averageScore = this.calculateAverageScore();
            const color = this.getColorByScore(averageScore);
            const dateKey = `${this.year}-${this.month}-${this.day}`;
            const dayDoc = doc(collection(this.firestore, 'dailyScores'), dateKey);

            await setDoc(dayDoc, {
                score: averageScore,
                color: color,
                year: this.year,
                month: this.month,
                day: this.day,
                isComplete: true,
                meals: this.meals // Ahora sí, con todos los cambios
            }, { merge: true }); // Para no machacar nada externo si lo hubiera

            // Alert con el resumen...
        }
    }


    calculateAverageScore(): number {
        // Asegurarse de hacer la suma primero y luego dividir
        const totalScore = this.meals.reduce((sum, meal) => sum + meal.score, 0);
        return totalScore / this.meals.length;
    }


    getColorClass(meal: Meal): string {
        const baseClass = meal.done ? 'checked' : 'unchecked';
        const scoreClass = `score-${meal.score}`;
        return `${baseClass} ${scoreClass}`;
    }


    getColorByScore(score: number): string {
        // Devolver el color basado en la puntuación
        if (score === 0) return '#999999';
        if (score >= 4.5) return '#4dff4d';
        if (score >= 3.5) return '#b3ff4d';
        if (score >= 2.5) return '#ffd24d';
        if (score >= 1.5) return '#ffa74d';
        return '#ff4d4d';
    }

    saveDayDataToFirebase() {
        const docRef = doc(this.firestore, 'dailyScores', `${this.year}-${this.month}-${this.day}`);

        getDoc(docRef).then((docSnap) => {
            // 1. "Sanitizar" los meals (si algo es undefined => null)
            const sanitizedMeals = this.meals.map((meal) => ({
                ...meal,
                recipe: meal.recipe ?? null,
                image: meal.image ?? null,
                url: meal.url ?? null,
                description: meal.description ?? null,
                // Añade aquí cualquier propiedad que pueda ser undefined
            }));

            if (docSnap.exists()) {
                const existingData = docSnap.data() as FirestoreDayData;

                // 2. Fusionar lo anterior con las comidas sanitizadas, sin tocar score/color/isComplete
                const updatedData: FirestoreDayData = {
                    ...existingData,
                    meals: sanitizedMeals,
                    score: existingData.score,
                    color: existingData.color,
                    isComplete: existingData.isComplete
                };

                updateDoc(docRef, updatedData)
                    .then(() => console.log('Documento actualizado (sólo meals):', updatedData))
                    .catch((error) => console.error('Error al actualizar:', error));

            } else {
                // Doc no existía => creamos con valores iniciales
                const initialData: FirestoreDayData = {
                    year: this.year,
                    month: this.month,
                    day: this.day,
                    meals: sanitizedMeals,
                    score: 0,
                    color: '#222222',
                    isComplete: false
                };

                setDoc(docRef, initialData)
                    .then(() => console.log('Documento creado (día nuevo):', initialData))
                    .catch((error) => console.error('Error al crear doc:', error));
            }
        })
            .catch((error) => console.error('Error al leer doc:', error));
    }





}





