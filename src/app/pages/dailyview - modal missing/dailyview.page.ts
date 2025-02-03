import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Meal, FirestoreDayData } from '../../interfaces/meal.interface';
import { AlertController, ModalController, GestureController, Gesture } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { DayCompleteModalComponent } from '../../day-complete-modal/day-complete-modal.component';
import { IonHeader, IonItem, IonLabel, IonButton, IonItemOption, IonItemOptions, IonItemSliding, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonContent, IonTitle, IonToolbar, IonButtons, IonModal, IonList, IonMenuButton, IonInput, IonRange, IonToggle, IonIcon, IonFab, IonFabButton } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { arrowBack, arrowForward, add } from 'ionicons/icons';
import { NotificationsService } from '../../services/notifications.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-dailyview',
    templateUrl: './dailyview.page.html',
    styleUrls: ['./dailyview.page.scss'],
    standalone: true,
    imports: [
        IonList, IonModal, IonButtons, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
        IonCardTitle, IonCardContent, IonItemSliding, IonItemOptions, IonItemOption, IonButton,
        IonLabel, IonItem, IonHeader, CommonModule, FormsModule, ReactiveFormsModule,
        IonMenuButton, IonInput, IonRange, IonToggle /*IonIcon, IonFab, IonFabButton*/
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})



export class DailyviewPage implements OnInit, AfterViewInit {

    @ViewChild('gestureContainer', { static: true }) gestureContainer!: ElementRef;
    @ViewChild('mealCard', { read: ElementRef }) mealCard!: ElementRef;

    private gesture!: Gesture;

    defrostEnabled = false;
    selectedTime: string = ''; // Para que TypeScript no se queje
    isTimePickerOpen = false; // controla la visibilidad
    alarmEnabled = false;
    scheduledAlarmId?: number;


    day: number = 0;
    month: number = 0;
    year: number = 0;
    formattedDate: string = '';

    allMealData: { name: string; score: number }[] = [];
    suggestions: { name: string; score: number }[] = [];

    isSlidingItemOpen = false;
    isModalOpen = false;
    currentMeal: Meal = {
        id: '',
        name: '',
        score: 0,
        done: false,
        mealtype: '',
        reminder: false,
        reminderTime: '',
        delivery: false,
    };

    mealDoneControls: { [key: string]: FormControl } = {};

    meals: Meal[] = [
        { id: '1', mealtype: 'Breakfast', name: '', score: 0, done: false, reminder: false },
        { id: '2', mealtype: 'Lunch', name: '', score: 0, done: false, reminder: false },
        { id: '3', mealtype: 'Dinner', name: '', score: 0, done: false, reminder: false }
    ];

    static dayScores: { [date: string]: { score: number; color: string } } = {};

    constructor(
        private notificationsService: NotificationsService,
        private alertController: AlertController,
        private route: ActivatedRoute,
        private firestore: Firestore,
        private modalCtrl: ModalController,
        private gestureCtrl: GestureController,
        private cdr: ChangeDetectorRef
    ) {
        addIcons({ arrowBack, arrowForward, add });
    }

    ngOnInit() {
        // Obtenemos el parámetro 'day' de la URL
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

            this.formattedDate = new Date(this.year, this.month - 1, this.day).toDateString();
            console.log('Formatted date (from route or current):', this.formattedDate);

            // Carga datos del día
            await this.loadDayData();

            // Cargar la colección "meals" para sugerencias
            try {
                const mealsRef = collection(this.firestore, 'meals');
                const querySnap = await getDocs(mealsRef);

                this.allMealData = [];
                querySnap.forEach(docSnap => {
                    const data = docSnap.data() as any;
                    if (data.name) {
                        this.allMealData.push({
                            name: data.name,
                            score: data.score || 1
                        });
                    }
                });
                console.log('allMealData cargadas:', this.allMealData);
            } catch (error) {
                console.error('Error cargando comidas (allMealData):', error);
            }

            // Inicializa formControls
            this.meals.forEach(meal => {
                this.mealDoneControls[meal.id] = new FormControl(meal.done);
            });
        });
    }

    async loadDayData() {
        try {
            const dateKey = `${this.year}-${this.month}-${this.day}`;
            const docRef = doc(this.firestore, 'dailyScores', dateKey);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as FirestoreDayData;
                this.meals = data.meals || this.getDefaultMeals();

                // Restaurar alarmas
                await this.restoreScheduledAlarms();
            } else {
                this.meals = this.getDefaultMeals();
            }

            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.meals = this.getDefaultMeals();
            this.cdr.detectChanges();
        }
    }

    private async restoreScheduledAlarms() {
        for (const meal of this.meals) {
            if (meal.defrostAlarm?.scheduledTime) {
                try {
                    const alarmDate = new Date(meal.defrostAlarm.scheduledTime);

                    if (alarmDate > new Date()) { // Solo si es futura
                        const notificationId = await this.notificationsService.scheduleDefrostAlarm(
                            meal, // ← Usamos la meal del loop, no this.currentMeal
                            alarmDate
                        );

                        // Actualizamos la meal del array
                        meal.defrostAlarm = {
                            ...meal.defrostAlarm,
                            notificationId: notificationId
                        };
                    }
                } catch (error) {
                    console.error(`Error restaurando alarma para ${meal.name}:`, error);
                    meal.defrostAlarm!.enabled = false;
                }
            }
        }
    }



    private getDefaultMeals(): Meal[] {
        return [
            { id: '1', mealtype: 'Breakfast', name: '', score: 0, done: false, reminder: false },
            { id: '2', mealtype: 'Lunch', name: '', score: 0, done: false, reminder: false },
            { id: '3', mealtype: 'Dinner', name: '', score: 0, done: false, reminder: false }
        ];
    }

    ngAfterViewInit() {
        const swipeFooter = this.mealCard.nativeElement.querySelector('.swipe-footer');

        this.gesture = this.gestureCtrl.create({
            el: swipeFooter,
            gestureName: 'footer-swipe',
            threshold: 30,
            onStart: () => {
                this.mealCard.nativeElement.style.transition = 'none';
                swipeFooter.classList.add('swiping');
            },
            onMove: (ev) => {
                this.mealCard.nativeElement.style.transform = `translateX(${ev.deltaX}px)`;
            },
            onEnd: (ev) => {
                swipeFooter.classList.remove('swiping');
                this.mealCard.nativeElement.style.transform = 'translateX(0)';
                this.mealCard.nativeElement.style.transition = 'transform 0.3s ease-out';

                if (Math.abs(ev.deltaX) > 50) {
                    const targetDate = ev.deltaX > 0
                        ? this.goToPreviousDay()
                        : this.goToNextDay();
                    this.navigateToDate(targetDate);
                }
            }
        });
        this.gesture.enable();
    }

    handleSwipeEnd(event: any) {
        if (event.deltaX > 50) {
            this.goToPreviousDay();
        } else if (event.deltaX < -50) {
            this.goToNextDay();
        }
    }

    goToPreviousDay(): Date {
        const current = new Date(this.year, this.month - 1, this.day);
        return new Date(current.setDate(current.getDate() - 1));
    }

    goToNextDay(): Date {
        const current = new Date(this.year, this.month - 1, this.day);
        return new Date(current.setDate(current.getDate() + 1));
    }

    async navigateToDate(date: Date) {
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.day = date.getDate();
        this.formattedDate = date.toDateString();

        await this.loadDayData();
        this.cdr.detectChanges();
    }

    openMealForm(meal: Meal) {
        this.currentMeal = meal ? {
            ...meal,
            defrostAlarm: meal.defrostAlarm ? {
                enabled: meal.defrostAlarm.enabled,
                scheduledTime: meal.defrostAlarm.scheduledTime || '', // Inicializar como cadena vacía si es undefined
                notificationId: meal.defrostAlarm.notificationId
            } : undefined
        } : {
            id: '',
            name: '',
            score: 0,
            done: false,
            mealtype: 'Custom',
            reminder: false,
            delivery: false,
            defrostAlarm: {
                enabled: false,
                scheduledTime: '' // Inicializar como cadena vacía
            }
        };
        this.isModalOpen = true;
        this.cdr.detectChanges();
    }


    closeModal() {
        this.isModalOpen = false;
        this.suggestions = [];
    }

    onModalDismiss(event: any) {
        this.isModalOpen = false;
        this.suggestions = [];
    }

    filterSuggestions() {
        const query = this.currentMeal.name?.trim().toLowerCase() || '';
        if (!query) {
            this.suggestions = [];
            return;
        }
        this.suggestions = this.allMealData
            .filter(meal => meal.name.toLowerCase().startsWith(query))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    selectSuggestion(suggestion: { name: string; score: number }) {
        this.currentMeal.name = suggestion.name;
        this.currentMeal.score = suggestion.score;
        this.suggestions = [];
    }

    async askToAddMealToDatabase(): Promise<boolean> {
        await this.modalCtrl.dismiss();

        return new Promise(async (resolve) => {
            const alert = await this.alertController.create({
                header: 'New Meal',
                message: `The meal "${this.currentMeal.name}" is not in the database. Would you like to add it?`,
                buttons: [
                    {
                        text: 'No Thanks',
                        role: 'cancel',
                        handler: () => resolve(false)
                    },
                    {
                        text: 'Add',
                        handler: async () => {
                            await this.addMealToDatabase();
                            resolve(true);
                        }
                    }
                ]
            });
            await alert.present();
        });
    }

    async saveMeal() {
        if (this.currentMeal.defrostAlarm && !this.currentMeal.defrostAlarm.enabled) {
            this.currentMeal.defrostAlarm = {
                enabled: false,
                scheduledTime: ''
            };
        }


        if (!this.currentMeal.name || !this.currentMeal.score) {
            console.error('Meal name and score are required');
            return;
        }

        if (this.currentMeal.id) {
            const index = this.meals.findIndex(m => m.id === this.currentMeal.id);
            if (index !== -1) {
                this.meals[index] = { ...this.currentMeal };
            }
        } else {
            const newMeal: Meal = {
                ...this.currentMeal,
                id: (this.meals.length + 1).toString(),
                mealtype: this.currentMeal.mealtype || 'Custom'
            };
            this.meals.push(newMeal);
        }

        const mealExists = this.allMealData.some(
            meal => meal.name.toLowerCase() === this.currentMeal.name.toLowerCase()
        );
        if (!mealExists) {
            const userWantsToAdd = await this.askToAddMealToDatabase();
            if (!userWantsToAdd) {
                console.log('Meal not added to the database.');
            }
        }

        this.closeModal();
        this.saveDayDataToFirebase();
    }

    async addMealToDatabase() {
        try {
            const mealsRef = collection(this.firestore, 'meals');
            const newMealData = {
                name: this.currentMeal.name,
                score: this.currentMeal.score,
                mealtype: this.currentMeal.mealtype || 'Custom',
            };
            await addDoc(mealsRef, newMealData);
            console.log('New meal added to the database:', newMealData);
            this.allMealData.push(newMealData);
        } catch (error) {
            console.error('Error adding meal to the database:', error);
        }
    }

    deleteMeal(meal: Meal) {
        this.alertController.create({
            header: 'Delete Meal',
            message: `Are you sure you want to delete "${meal.name}" from today?`,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                        console.log('Deletion canceled');
                    }
                },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.meals = this.meals.filter(m => m.id !== meal.id);
                        this.saveDayDataToFirebase();
                    }
                }
            ]
        }).then(alert => alert.present());
    }

    editMeal(meal: Meal) {
        this.openMealForm(meal);
    }

    toggleMealDone(meal: Meal): void {
        meal.done = !meal.done;
        this.saveDayDataToFirebase();
    }

    isDayComplete(): boolean {
        return this.meals.every(meal => meal.name && meal.done);
    }

    async finalizeDay() {
        if (this.isDayComplete()) {
            const averageScore = this.calculateAverageScore();
            const color = this.getColorByScore(averageScore);

            const dateKey = `${this.year}-${this.month}-${this.day}`;
            const docRef = doc(this.firestore, 'dailyScores', dateKey);

            try {
                await setDoc(docRef, {
                    score: averageScore,
                    color: color,
                    year: this.year,
                    month: this.month,
                    day: this.day,
                    isComplete: true,
                    meals: this.meals
                }, { merge: true });

                console.log('Day finalized and saved:', { averageScore, color });

                const modal = await this.modalCtrl.create({
                    component: DayCompleteModalComponent,
                    componentProps: {
                        averageScore: averageScore.toFixed(1),
                        color: color
                    }
                });
                await modal.present();
            } catch (error) {
                console.error('Error finalizing day:', error);
            }
        } else {
            console.log('Day is not complete. Ensure all meals are done.');
        }
    }

    calculateAverageScore(): number {
        const totalScore = this.meals.reduce((sum, meal) => sum + meal.score, 0);
        return totalScore / this.meals.length;
    }

    getColorClass(meal: Meal): string {
        const baseClass = meal.done ? 'checked' : 'unchecked';
        const scoreClass = `score-${meal.score}`;
        return `${baseClass} ${scoreClass}`;
    }

    getColorByScore(score: number): string {
        if (score === 0) return '#999999';
        if (score >= 4.5) return '#4dff4d';
        if (score >= 3.5) return '#b3ff4d';
        if (score >= 2.5) return '#ffd24d';
        if (score >= 1.5) return '#ffa74d';
        return '#ff4d4d';
    }

    saveDayDataToFirebase() {
        const docRef = doc(this.firestore, 'dailyScores', `${this.year}-${this.month}-${this.day}`);

        getDoc(docRef)
            .then((docSnap) => {
                const sanitizedMeals = this.meals.map(meal => ({
                    ...meal,
                    done: meal.done || false
                }));

                if (docSnap.exists()) {
                    const existingData = docSnap.data() as FirestoreDayData;
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

    /**
     * -------------------------------------------------------------
     * LA FUNCIÓN clearMealContent :)
     * -------------------------------------------------------------
     */
    clearMealContent(meal: Meal) {
        this.alertController.create({
            header: 'Clear Meal',
            message: `Are you sure you want to clear the content of "${meal.mealtype}"?`,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                        console.log('Clearing canceled.');
                    }
                },
                {
                    text: 'Clear',
                    role: 'destructive',
                    handler: () => {
                        meal.name = '';
                        meal.score = 0;
                        meal.done = false;
                        meal.reminder = false;
                        meal.delivery = false;
                        // Hay que incluir también para hacer el Clear sobre la alarma de descongelar
                        this.saveDayDataToFirebase();
                        console.log(`Content of "${meal.mealtype}" cleared.`);
                    }
                }
            ]
        }).then(alert => alert.present());
    }

    /**
     * Métodos del toggle y datetime para notificaciones
     */
    async handleDefrostToggle(event: any) {
        const enabled = event.detail.checked;

        if (!this.currentMeal.defrostAlarm) {
            this.currentMeal.defrostAlarm = {
                enabled: false,
                scheduledTime: ''
            };
        }

        this.currentMeal.defrostAlarm.enabled = enabled;

        if (enabled) {
            await this.notificationsService.requestPermissions();
            this.openTimePicker();
        } else {
            if (this.currentMeal.defrostAlarm.notificationId) {
                await this.notificationsService.cancelDefrostAlarm(
                    this.currentMeal.defrostAlarm.notificationId
                );
            }
            this.currentMeal.defrostAlarm.scheduledTime = '';
        }
    }



    async scheduleAlarm() {
        try {
            if (!this.currentMeal.defrostAlarm?.scheduledTime) return;

            const dateTime = new Date(this.currentMeal.defrostAlarm.scheduledTime);

            // Llamada corregida con ambos parámetros
            const notificationId = await this.notificationsService.scheduleDefrostAlarm(
                this.currentMeal, // ← Primer parámetro (Meal)
                dateTime          // ← Segundo parámetro (Date)
            );

            // Actualizar el ID de notificación
            if (this.currentMeal.defrostAlarm) {
                this.currentMeal.defrostAlarm.notificationId = notificationId;
            }
        } catch (error) {
            console.error('Error scheduling alarm:', error);
        }
    }



    // Cuando el usuario toca el toggle de 'reminder'
    async onMealReminderToggle() {
        if (this.currentMeal.reminder) {
            // Pide permisos si está activando la alarma
            await this.notificationsService.requestPermissions();

        } else {
            // Si lo desactiva, cancelamos la notificación
            await this.notificationsService.cancelDefrostAlarm(this.currentMeal.defrostAlarm?.notificationId!);

        }
    }



    openTimePicker() {
        this.isTimePickerOpen = true;

        // Inicializar defrostAlarm si no existe
        if (!this.currentMeal.defrostAlarm) {
            this.currentMeal.defrostAlarm = {
                enabled: true,
                scheduledTime: new Date().toISOString()
            };
        }
    }


    closeTimePicker() {
        this.isTimePickerOpen = false;
    }





    async cancelAlarm() {
        if (this.currentMeal.defrostAlarm?.notificationId) {
            // Llamada corregida con parámetro
            await this.notificationsService.cancelDefrostAlarm(
                this.currentMeal.defrostAlarm.notificationId
            );
            this.currentMeal.defrostAlarm.notificationId = undefined;
        }
    }


    // Actualizar las llamadas de permisos
    async enableAlarm() {
        await this.notificationsService.requestPermissions(); // ← Nombre corregido
        this.openTimePicker();
    }



    async onTimeSelected(event: any) {
        const selectedTime = event.detail.value;
        this.isTimePickerOpen = false;

        if (!this.currentMeal.defrostAlarm) return;

        try {
            const targetDate = new Date(selectedTime);

            // Cancelar alarma anterior si existe
            if (this.currentMeal.defrostAlarm.notificationId) {
                await this.notificationsService.cancelDefrostAlarm(
                    this.currentMeal.defrostAlarm.notificationId
                );
            }

            // Programar nueva alarma
            const notificationId = await this.notificationsService.scheduleDefrostAlarm(
                this.currentMeal,
                targetDate
            );

            // Actualizar modelo
            this.currentMeal.defrostAlarm = {
                enabled: true,
                scheduledTime: selectedTime,
                notificationId: notificationId
            };

        } catch (error) {
            console.error('Error al programar alarma:', error);
            this.currentMeal.defrostAlarm.enabled = false;
            this.showAlert('Error', 'No se pudo programar la alarma');
        }
    }




    onTimePickerCancel() {
        this.isTimePickerOpen = false;
        this.alarmEnabled = false; // Desactivar si cancela
        this.selectedTime = '';
    }

    onTimePickerDismiss() {
        this.isTimePickerOpen = false;

        // Solo desactivar si no hay hora seleccionada
        if (!this.selectedTime) {
            this.alarmEnabled = false;
        }
    }




    private parseTimeString(timeString: string): Date | null {
        if (!timeString) return null;

        try {
            // Usar la fecha actual de la vista (no la fecha del sistema)
            const baseDate = new Date(this.year, this.month - 1, this.day);
            const timeParts = timeString.split('T')[1].split(':');

            return new Date(
                baseDate.getFullYear(),
                baseDate.getMonth(),
                baseDate.getDate(),
                parseInt(timeParts[0]),
                parseInt(timeParts[1])
            );
        } catch (error) {
            console.error('Error parsing time:', error);
            return null;
        }
    }



    private handleAlarmError() {
        this.showAlert('Error', 'No se pudo programar la alarma');
        this.alarmEnabled = false;
        this.selectedTime = '';

        if (this.currentMeal.defrostAlarm) {
            this.currentMeal.defrostAlarm.enabled = false;
            this.currentMeal.defrostAlarm.notificationId = undefined;
        }
    }




    private async showAlert(header: string, message: string) {
        const alert = await this.alertController.create({
            header,
            message,
            buttons: ['OK']
        });
        await alert.present();
    }


    // En dailyview.page.ts
    async checkPendingNotifications() {
        const pending = await LocalNotifications.getPending(); // Ahora reconocerá LocalNotifications
        console.log('Notificaciones pendientes:', pending.notifications);
    }



}
