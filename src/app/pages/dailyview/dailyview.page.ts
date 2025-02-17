import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Meal, FirestoreDayData } from '../../interfaces/meal.interface';
import { AlertController, ModalController, GestureController, Gesture, IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { DayCompleteModalComponent } from '../../day-complete-modal/day-complete-modal.component';
import { addIcons } from 'ionicons';
import { add, trash, caretBackOutline, caretForwardOutline } from 'ionicons/icons';
import { NotificationsService } from '../../services/notifications.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Keyboard } from '@capacitor/keyboard';
import { Platform } from '@ionic/angular';



@Component({
    selector: 'app-dailyview',
    templateUrl: './dailyview.page.html',
    styleUrls: ['./dailyview.page.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class DailyviewPage implements OnInit, AfterViewInit {

    @ViewChild('gestureContainer', { static: true }) gestureContainer!: ElementRef;
    @ViewChild('mealCard', { read: ElementRef }) mealCard!: ElementRef;
    @ViewChild('mealInput') mealInput!: ElementRef;
    @ViewChild('suggestionsContainer') suggestionsContainer!: ElementRef;;

    private gesture!: Gesture;



    day: number = 0;
    month: number = 0;
    year: number = 0;
    formattedDate: string = '';

    allMealData: { name: string; score: number }[] = [];
    suggestions: { name: string; score: number }[] = [];

    isSlidingItemOpen = false;
    isModalOpen = false;
    currentMeal: Meal = { id: '', name: '', score: 0, done: false, mealtype: '', reminder: false, hasDelivery: false };
    mealDoneControls: { [key: string]: FormControl } = {};

    isDayFinalized: boolean = false;

    public isTimePickerOpen = false;
    public selectedTime: string = '09:00';



    meals: Meal[] = [
        { id: '1', mealtype: 'Breakfast', name: '', score: 0, done: false, reminder: false },
        { id: '2', mealtype: 'Lunch', name: '', score: 0, done: false, reminder: false },
        { id: '3', mealtype: 'Dinner', name: '', score: 0, done: false, reminder: false }
    ];

    static dayScores: { [date: string]: { score: number; color: string } } = {};

    constructor(
        private alertController: AlertController,
        private route: ActivatedRoute,
        private firestore: Firestore,
        private modalCtrl: ModalController,
        private gestureCtrl: GestureController,
        private notificationsService: NotificationsService,
        private cdr: ChangeDetectorRef,
        private platform: Platform,
        private router: Router

    ) { addIcons({ add, trash, caretBackOutline, caretForwardOutline }); }

    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.suggestions = []; // 🔥 Vaciar la lista de sugerencias
            event.preventDefault(); // ❌ Evita scroll raro o que envíe formularios por accidente
        }
    }

    // 🔹 CIERRA la lista si se toca fuera del input o la lista
    @HostListener('document:click', ['$event'])
    @HostListener('document:touchstart', ['$event'])
    onClickOutside(event: Event) {
        setTimeout(() => {
            if (!this.mealInput?.nativeElement || !this.suggestionsContainer?.nativeElement) {
                return;
            }

            const inputElement = this.mealInput.nativeElement;
            const suggestionsElement = this.suggestionsContainer.nativeElement;
            const target = event.target as HTMLElement;

            // Obtener la ruta del evento para manejar Shadow DOM
            const path = event.composedPath ? event.composedPath() : [];
            const isInsideInput = inputElement?.contains(target) || path.includes(inputElement);
            const isInsideSuggestions = suggestionsElement?.contains(target) || path.includes(suggestionsElement);

            if (!this.mealInput || !this.suggestionsContainer || !this.mealInput.nativeElement || !this.suggestionsContainer.nativeElement) {
                return;
            }


            // Si el clic fue fuera, vaciar la lista de sugerencias
            this.suggestions = [];
            this.cdr.detectChanges();
        }, 50);
    }



    /**
     * ----------------------------------------------------------------
     * 1. Ajustamos ngOnInit para solo leer el parámetro y cargar allMealData
     * ----------------------------------------------------------------
     */
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
                this.month = currentDate.getMonth() + 1;
                this.day = currentDate.getDate();
            }

            // Creamos una fecha formateada
            this.formattedDate = new Date(this.year, this.month - 1, this.day).toDateString();
            console.log('Formatted date (from route or current):', this.formattedDate);

            // Llamamos a loadDayData() para cargar la info de Firestore de este día
            await this.loadDayData();

            /**
             * Cargamos también la colección "meals" global para las sugerencias
             */
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

            // Inicializamos los controles del formulario
            this.meals.forEach(meal => {
                this.mealDoneControls[meal.id] = new FormControl(meal.done);
            });
        });

        if (this.platform.is('mobile')) {  // Solo lo hacemos en móvil
            Keyboard.addListener('keyboardDidShow', (info) => {
                console.log('Teclado abierto, moviendo modal...');
                document.body.classList.add('keyboard-is-open');
            });

            Keyboard.addListener('keyboardDidHide', () => {
                console.log('Teclado cerrado, restaurando modal...');

                // 🔥 En lugar de quitar la clase de golpe, esperamos un poco
                setTimeout(() => {
                    document.body.classList.remove('keyboard-is-open');
                }, 50); // ⏳ Pequeño delay para que la animación se vea mejor
            });

        }
    }

    /**
     * ----------------------------------------------------------------
     * 2. Cargar la info del día (Firestore) en su propia función
     * ----------------------------------------------------------------
     */
    async loadDayData() {
        try {
            const dateKey = `${this.year}-${this.month}-${this.day}`;
            const docRef = doc(this.firestore, 'dailyScores', dateKey);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as FirestoreDayData;
                this.meals = data.meals || this.getDefaultMeals();
                this.isDayFinalized = data.isComplete ?? false;  // ✅ Guardamos si el día está finalizado
            } else {
                this.meals = this.getDefaultMeals();
                this.isDayFinalized = false;
            }

            this.cdr.detectChanges(); // 🔄 Asegura que la UI se actualice

        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.meals = this.getDefaultMeals();
            this.isDayFinalized = false;
            this.cdr.detectChanges();
        }
    }


    // Añade esta función para obtener las comidas por defecto
    private getDefaultMeals(): Meal[] {
        return [
            { id: '1', mealtype: 'Breakfast', name: '', score: 0, done: false, reminder: false },
            { id: '2', mealtype: 'Lunch', name: '', score: 0, done: false, reminder: false },
            { id: '3', mealtype: 'Dinner', name: '', score: 0, done: false, reminder: false }
        ];
    }

    /**
     * ----------------------------------------------------------------
     * 3. Configuración del gesto de swipe en ngAfterViewInit 
     *    usando onEnd en lugar de onMove
     * ----------------------------------------------------------------
     */
    ngAfterViewInit() {
        console.log(this.mealInput); // Verifica si está definido
        console.log(this.suggestionsContainer);

        // Cambiar de .swipe-header a .swipe-footer
        const swipeFooter = this.mealCard.nativeElement.querySelector('.swipe-footer');

        this.gesture = this.gestureCtrl.create({
            el: swipeFooter, // <<--- Aquí el cambio clave
            gestureName: 'footer-swipe',
            threshold: 30,
            onStart: () => {
                this.mealCard.nativeElement.style.transition = 'none';
                swipeFooter.classList.add('swiping'); // Añade clase
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

        setTimeout(() => {
            console.log('mealInput:', this.mealInput);
            console.log('suggestionsContainer:', this.suggestionsContainer);
        }, 500);



    }

    handleSwipeEnd(event: any) {
        if (event.deltaX > 50) {
            // Deslizó a la derecha => día anterior
            this.goToPreviousDay();
        } else if (event.deltaX < -50) {
            // Deslizó a la izquierda => día siguiente
            this.goToNextDay();
        }
    }

    // Ejemplo de implementación correcta:
    goToPreviousDay(): Date {
        const current = new Date(this.year, this.month - 1, this.day);
        return new Date(current.setDate(current.getDate() - 1));
    }

    goToNextDay(): Date {
        const current = new Date(this.year, this.month - 1, this.day);
        return new Date(current.setDate(current.getDate() + 1));
    }

    async navigateToDate(date: Date) {
        console.log('Navegando a:', this.year, this.month, this.day);

        // Actualiza las variables de fecha
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.day = date.getDate();

        // Fuerza la actualización de la vista
        this.formattedDate = date.toDateString();

        // Recarga los datos del nuevo día
        await this.loadDayData();

        // Detecta cambios manualmente
        this.cdr.detectChanges();
    }


    openMealForm(meal?: Meal) {
        if (this.isDayFinalized) {
            console.log('El día está finalizado. No se pueden editar comidas.');
            return;
        }

        this.currentMeal = meal
            ? { ...meal }
            : {
                id: '',
                name: '',
                score: 0,
                done: false,
                mealtype: '',
                reminder: false,
                hasDelivery: false
            };

        this.isModalOpen = true;
        this.cdr.detectChanges();
    }



    closeModal() {
        this.isModalOpen = false;
        this.suggestions = [];
    }

    onModalDismiss(event: any) {
        console.log('Modal dismissed:', event);
        this.isModalOpen = false;
        this.suggestions = [];
    }

    filterSuggestions() {

        console.log("Filtrando sugerencias...");
        console.log("Texto actual:", this.currentMeal.name);
        console.log("Sugerencias antes del filtrado:", this.suggestions);

        const query = this.currentMeal.name?.trim().toLowerCase() || '';
        if (!query) {
            this.suggestions = [];
            return;
        }

        this.suggestions = this.allMealData
            .filter(meal => meal.name.toLowerCase().startsWith(query))
            .sort((a, b) => a.name.localeCompare(b.name));

        // 🔥 Solo intentamos desplazar el input si existe
        setTimeout(() => {
            if (this.mealInput?.nativeElement) {
                this.mealInput.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

        console.log("Sugerencias después del filtrado:", this.suggestions);

    }



    selectSuggestion(suggestion: { name: string; score: number }, event: Event) {
        event.stopPropagation();
        this.currentMeal.name = suggestion.name;
        this.currentMeal.score = suggestion.score;

        // Retrasar la limpieza para evitar conflictos
        setTimeout(() => {
            this.suggestions = [];
            this.cdr.detectChanges();
        }, 0);
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
                        handler: () => {
                            console.log('User chose not to add the meal to the database.');
                            resolve(false);
                        }
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
        if (this.isDayFinalized) {
            console.log('No se puede modificar una comida en un día finalizado.');
            return;
        }

        if (!this.currentMeal.name || !this.currentMeal.score || !this.currentMeal.mealtype) {
            console.error('Meal name, score, and meal type are required.');
            return;
        }

        // 🔍 Comprobar si la comida ya existe en la base de datos
        const mealExists = this.allMealData.some(meal => meal.name.toLowerCase() === this.currentMeal.name.toLowerCase());

        if (!mealExists) {
            console.log(`"${this.currentMeal.name}" no está en la base de datos. Preguntando al usuario...`);
            const shouldAdd = await this.askToAddMealToDatabase();

            // ✅ **Independientemente de la respuesta, la comida se añade a la vista diaria**
            if (!shouldAdd) {
                console.log('El usuario ha rechazado añadir la comida a la base de datos, pero la añadimos a la vista diaria.');
            }
        }

        // Si estamos editando una comida ya existente
        if (this.currentMeal.id) {
            const index = this.meals.findIndex(m => m.id === this.currentMeal.id);
            if (index !== -1) {
                // Actualizar todos los campos manualmente
                this.meals[index] = {
                    ...this.meals[index],  // Mantiene lo que tenía antes
                    ...this.currentMeal    // Aplica los nuevos cambios
                };
            }
        } else {
            // Nueva comida
            const newMeal: Meal = {
                id: (this.meals.length + 1).toString(),
                name: this.currentMeal.name,
                score: this.currentMeal.score,
                done: this.currentMeal.done,
                mealtype: this.currentMeal.mealtype,
                reminder: this.currentMeal.reminder ?? false, // Si es undefined, que sea false
                hasDelivery: this.currentMeal.hasDelivery ?? false
            };
            this.meals.push(newMeal);
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

            // Añadirlo a las sugerencias locales
            this.allMealData.push(newMealData);
        } catch (error) {
            console.error('Error adding meal to the database:', error);
        }
    }

    deleteMeal(meal: Meal) {
        this.alertController.create({
            header: 'Delete Meal',
            message: `Are you sure you want to delete this meal slot?`,
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
                        console.log(`Meal slot deleted.`);
                    }
                }
            ]
        }).then(alert => alert.present());
    }


    editMeal(meal: Meal) {
        console.log('Editando comida existente:', meal);
        this.openMealForm(meal);
    }

    toggleMealDone(meal: Meal): void {
        if (this.isDayFinalized) {
            console.log('No se puede marcar como hecha una comida en un día finalizado.');
            return;
        }

        meal.done = !meal.done;
        this.saveDayDataToFirebase();
        console.log('Meal status updated:', meal);
    }


    isDayComplete(): boolean {
        return this.meals.every(meal => meal.name && meal.done);
    }

    async finalizeDay() {
        if (this.isDayFinalized) {
            console.log("Este día ya está finalizado, no se puede volver a finalizar.");
            return;
        }

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
                    isComplete: true,  // Marcar el día como finalizado
                    meals: this.meals
                }, { merge: true });

                console.log('Day finalized and saved to Firestore:', { averageScore, color, isComplete: true });

                this.isDayFinalized = true;  // 🔴 Se actualiza la variable en la UI

                this.goToCalendar()

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

        getDoc(docRef).then((docSnap) => {
            const sanitizedMeals = this.meals.map(meal => ({
                ...meal,
                done: meal.done || false,
            }));

            if (docSnap.exists()) {
                const existingData = docSnap.data() as FirestoreDayData;

                // 🚨 Bloquear edición si el día ya está finalizado
                if (existingData.isComplete) {
                    console.log('No se pueden modificar los datos de un día finalizado.');
                    return;
                }

                const updatedData: FirestoreDayData = {
                    ...existingData,
                    meals: sanitizedMeals,
                    score: existingData.score,
                    color: existingData.color,
                    isComplete: existingData.isComplete
                };

                updateDoc(docRef, updatedData)
                    .then(() => console.log('Documento actualizado:', updatedData))
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
                    .then(() => console.log('Documento creado:', initialData))
                    .catch((error) => console.error('Error al crear doc:', error));
            }
        })
            .catch((error) => console.error('Error al leer doc:', error));
    }


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
                        meal.hasDelivery = false;
                        this.saveDayDataToFirebase();
                        console.log(`Content of "${meal.mealtype}" cleared.`);
                    }
                }
            ]
        }).then(alert => alert.present());
    }

    onReminderToggle(event: any) {
        if (event.detail.checked && this.currentMeal.alarms?.length === 0) {
            this.addAlarm();
        }
    }

    addAlarm() {
        // Puedes usar ion-datetime o un prompt para simplificar.
        const nuevaHora = prompt("Ingresa la hora (HH:mm):");
        if (nuevaHora) {
            this.currentMeal.alarms?.push(nuevaHora);
        }
    }

    toggleAlarm(ev: any) {
        if (ev.detail.checked) {
            // Si se activa, abre el modal de selección de hora
            this.openDatetimeModal();
        }
    }

    async openDatetimeModal() {
        // Aquí deberías abrir un modal con ion-datetime.
        // Por simplicidad usamos prompt, pero lo ideal es un modal aparte.
        const input = prompt("Ingresa la hora (HH:mm):", "12:00");
        if (input) {
            const [hours, minutes] = input.split(':').map(Number);
            const targetDate = new Date();
            targetDate.setHours(hours, minutes, 0, 0);
            // Comprueba que la hora es futura
            if (targetDate < new Date()) {
                alert("La hora debe ser en el futuro");
                this.currentMeal.reminder = false;
                return;
            }
            // Guarda la hora en ISO (o el formato que prefieras)
            this.currentMeal.alarmTime = targetDate.toISOString();
            // Programa la notificación
            try {
                const notificationId = await this.notificationsService.scheduleDefrostAlarm(this.currentMeal, targetDate);
                this.currentMeal.notificationId = notificationId;
            } catch (error: any) {
                alert("Error al programar la alarma: " + error.message);
                this.currentMeal.reminder = false;
            }
        } else {
            // Si cancela, desactiva el toggle
            this.currentMeal.reminder = false;
        }
    }

    editAlarm() {
        // Abre nuevamente el modal de datetime para editar la hora
        this.openDatetimeModal();
    }

    removeAlarm() {
        console.log("Eliminando alarma...");

        this.currentMeal.alarms = [];
        this.currentMeal.alarmTime = null;  // 🔥 Cambiar undefined por null
        this.currentMeal.notificationId = null;  // 🔥 Cambiar undefined por null
        this.currentMeal.reminder = false;

        if (this.currentMeal.id) {
            const index = this.meals.findIndex(m => m.id === this.currentMeal.id);
            if (index !== -1) {
                this.meals[index] = {
                    ...this.meals[index],
                    alarms: [],
                    alarmTime: null, // 🔥 Cambiar undefined por null
                    notificationId: null, // 🔥 Cambiar undefined por null
                    reminder: false
                };
            }
        }

        this.saveDayDataToFirebase();
    }



    openTimePicker() {
        this.isTimePickerOpen = true;
    }

    cancelTimePicker() {
        this.isTimePickerOpen = false;
        this.currentMeal.reminder = false; // Opcional: desactiva el toggle si se cancela
    }

    onTimePickerDismiss() {
        this.isTimePickerOpen = false;
        this.currentMeal.reminder = false;
    }

    confirmTimePicker() {
        const [hoursStr, minutesStr] = this.selectedTime.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        // Usa la fecha del día específico en lugar de la fecha actual:
        let targetDate = new Date(this.year, this.month - 1, this.day, hours, minutes, 0);

        // Si la hora ya pasó para ese día, puedes mostrar un error o evitar programar la notificación
        if (targetDate < new Date()) {
            alert("La hora seleccionada ya pasó para este día.");
            return;
        }

        this.currentMeal.alarmTime = targetDate.toISOString();

        this.notificationsService.scheduleDefrostAlarm(this.currentMeal, targetDate)
            .then(id => {
                this.currentMeal.notificationId = id;
                this.isTimePickerOpen = false;
            })
            .catch(err => {
                alert("Error al programar la alarma: " + err.message);
                this.currentMeal.reminder = false;
            });
    }

    goToCalendar() {
        this.router.navigate(['/tabs/monthly']);
    }

    reorderMeals(event: CustomEvent) {
        this.meals = event.detail.complete(this.meals);  // Actualiza el array con el nuevo orden

        const dayId = `${this.year}-${this.month}-${this.day}`;
        const docRef = doc(this.firestore, 'dailyScores', dayId); // Asegura que el documento sea el correcto

        updateDoc(docRef, { meals: this.meals })
            .then(() => console.log('Orden actualizado en Firebase'))
            .catch((error: any) => console.error('Error guardando el orden:', error));
    }

}

