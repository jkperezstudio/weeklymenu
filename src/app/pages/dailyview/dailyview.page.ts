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
                score: 1, // Valor por defecto
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

            try {
                // Referencia a la colección y al documento específico
                const scoresCollection = collection(this.firestore, 'dailyScores');
                const dayDoc = doc(scoresCollection, dateKey);

                // Guardar el score, el color y la información de las comidas en Firestore
                await setDoc(dayDoc, {
                    score: averageScore,
                    color: color,
                    year: this.year,
                    month: this.month,
                    day: this.day,
                    isComplete: true, // Marcar como día completado
                    meals: this.meals
                });


                // Mostrar alerta
                let colorName = '';
                switch (color) {
                    case '#07e911':
                        colorName = 'green';
                        break;
                    case '#c7f91d':
                        colorName = 'light green';
                        break;
                    case '#fce91e':
                        colorName = 'yellow';
                        break;
                    case '#fa691c':
                        colorName = 'orange';
                        break;
                    case '#f91a30':
                        colorName = 'red';
                        break;
                    default:
                        colorName = 'unknown';
                }

                const alert = await this.alertController.create({
                    header: 'Day Summary',
                    message: `The average score for today is: ${averageScore.toFixed(1)} (${colorName})`,
                    buttons: ['OK']
                });

                await alert.present();

            } catch (error) {
                console.error('Error guardando en Firestore:', error);
            }
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
        if (score >= 4.5) return '#07e911';
        if (score >= 3.5) return '#c7f91d';
        if (score >= 2.5) return '#fce91e';
        if (score >= 1.5) return '#fa691c';
        return '#f91a30';
    }

    saveDayDataToFirebase() {
        const docRef = doc(this.firestore, 'dailyScores', `${this.year}-${this.month}-${this.day}`);

        getDoc(docRef)
            .then((docSnap) => {
                if (docSnap.exists()) {
                    const existingData = docSnap.data() as FirestoreDayData;

                    // Fusionamos los datos existentes con los nuevos
                    const updatedData: Partial<FirestoreDayData> = {
                        ...existingData,
                        meals: this.meals,
                        color: existingData.meals?.length
                            ? existingData.meals.every((meal: Meal) => meal.done)
                                ? this.getColorByScore(existingData.score || 0) // Color según el score si está completado
                                : '#484848' // Neutro para días en progreso
                            : '#222222', // Transparente para días vacíos
                    };

                    console.log('Actualizando documento en Firebase:', updatedData);

                    updateDoc(docRef, updatedData)
                        .then(() => console.log('Documento actualizado correctamente:', updatedData))
                        .catch((error) => console.error('Error al actualizar el documento:', error));
                } else {
                    const initialData: FirestoreDayData = {
                        year: this.year,
                        month: this.month,
                        day: this.day,
                        meals: this.meals.map((meal: Meal) => ({
                            ...meal,
                            name: meal.name || '',
                            score: meal.score || 0,
                            done: meal.done || false,
                        })),
                        score: 0, // Sin calcular
                        color: this.meals.length ? '#484848' : '#222222', // Color inicial
                    };

                    console.log('Creando nuevo documento en Firebase:', initialData);

                    setDoc(docRef, initialData)
                        .then(() => console.log('Documento creado correctamente:', initialData))
                        .catch((error) => console.error('Error al crear documento:', error));
                }
            })
            .catch((error) => console.error('Error al verificar si el documento existe:', error));
    }



}





