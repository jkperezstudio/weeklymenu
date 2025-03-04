import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonDatetime } from '@ionic/angular/standalone';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Firestore, collection, onSnapshot } from '@angular/fire/firestore';
import { FirestoreDayData } from '../../interfaces/meal.interface';
import { Meal } from '../../interfaces/meal.interface';
import { ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-monthlyview',
  templateUrl: './monthlyview.page.html',
  styleUrls: ['./monthlyview.page.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [IonDatetime, IonContent, CommonModule, FormsModule, RouterModule]
})
export class MonthlyViewPage implements OnInit {
  @ViewChild('calendar', { static: false }) calendar!: IonDatetime;

  currentDay: string = '';
  isCalendarReady: boolean = false;
  dayScores: { [key: string]: { color: string; isComplete: boolean; hasDelivery?: boolean } } = {};
  initialDate: string;
  selectedDate: string = ''; // Almacena la fecha seleccionada inicialmente

  disableActiveDay = (dateString: string): boolean => {
    // Deshabilita el día activo seleccionado
    return this.selectedDate !== dateString;
  };

  constructor(private router: Router, private firestore: Firestore, private cdr: ChangeDetectorRef) {
    this.initialDate = '';
  }

  async ngOnInit() {
    console.log('Días con delivery marcados:', this.dayScores);

    this.selectedDate = ''; // Limpia la selección actual
    this.currentDay = ''; // Limpia el día actual también

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('monthlyview')) {
          this.clearSelectedDay();
        }
      });

    const scoresCollection = collection(this.firestore, 'dailyScores');

    onSnapshot(scoresCollection, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data() as FirestoreDayData;
        const dateKey = `${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`;

        const hasDelivery = data.meals?.some((meal: Meal) => meal.hasDelivery === true) || false;

        this.dayScores[dateKey] = {
          color: data.color,
          isComplete: data.isComplete || false,
          hasDelivery: hasDelivery
        };
      });

      this.isCalendarReady = true;
      this.cdr.detectChanges();

      // 🔥 Esperar un poco más antes de marcar los días
      setTimeout(() => {
        const datetimeElement = document.querySelector('ion-datetime') as HTMLIonDatetimeElement;
        if (datetimeElement) {
          let selectedValue = datetimeElement.value;

          // Si es un array, tomar el primer valor
          if (Array.isArray(selectedValue)) {
            selectedValue = selectedValue[0] || "";
          }

          // Si sigue sin ser válido, usar la fecha actual
          const selectedDate = selectedValue ? new Date(selectedValue) : new Date();
          const currentYear = selectedDate.getFullYear();
          const currentMonth = selectedDate.getMonth(); // `getMonth()` devuelve 0-11

          console.log(`📌 Datos cargados. Llamando a markDeliveryDays(${currentYear}, ${currentMonth})`);
          this.markDeliveryDays(currentYear, currentMonth);
        } else {
          console.warn('⚠️ No se encontró ion-datetime, no se puede marcar delivery.');
        }
      }, 300); // 🔥 Esperamos 300ms antes de ejecutar markDeliveryDays
    });


  }

  // 🔥 Método para marcar los días con delivery en el DOM de ion-datetime
  markDeliveryDays(currentYear: number, currentMonth: number) {
    console.log('🔹 Ejecutando markDeliveryDays()...');
    console.log(`📌 Aplicando marcas para ${currentYear}-${currentMonth + 1}`);

    const datetimeElement = document.querySelector('ion-datetime') as HTMLIonDatetimeElement;
    if (!datetimeElement) {
      console.log('❌ ion-datetime no encontrado');
      return;
    }

    const shadowRoot = datetimeElement.shadowRoot;
    if (!shadowRoot) {
      console.log('❌ No se pudo acceder al Shadow DOM de ion-datetime');
      return;
    }

    // 🔄 Esperamos activamente a que los botones de los días existan en el DOM antes de marcar
    const checkDaysReady = setInterval(() => {
      const dayButtons = shadowRoot.querySelectorAll('button[data-day]');
      if (dayButtons.length > 0) {
        console.log(`✅ Botones de días detectados: ${dayButtons.length}. Aplicando marcas...`);
        clearInterval(checkDaysReady); // Detenemos el intervalo porque ya encontramos los botones

        Object.keys(this.dayScores).forEach(dateKey => {
          if (this.dayScores[dateKey]?.hasDelivery) {
            const [year, month, day] = dateKey.split('-').map(Number);

            console.log(`🔍 Evaluando: ${year}-${month}-${day} (Esperado: ${currentYear}-${currentMonth + 1})`);

            if (year === currentYear && (month - 1) === currentMonth) {
              console.log(`✅ Marcando delivery en: ${year}-${month}-${day}`);

              const dayElement = shadowRoot.querySelector(`button[data-day="${day}"]`);

              if (dayElement) {
                dayElement.setAttribute('data-delivery', 'true');
                console.log(`🎯 PUNTO AÑADIDO: ${year}-${month}-${day}`);
              } else {
                console.log(`⚠️ No se encontró el botón para ${year}-${month}-${day}`);
              }
            }
          }
        });
      }
    }, 50); // Comprobamos cada 50ms si los botones ya están renderizados
  }




  onMonthChange(event: any) {
    const currentYear = event.detail.year;
    const currentMonth = event.detail.month - 1; // Ajustar porque `event.detail.month` es 1-12 y JS usa 0-11

    console.log(`🔄 Cambio de mes detectado: ${currentYear}-${currentMonth + 1}`);

    // Llamamos a markDeliveryDays con el mes y año correctos
    this.markDeliveryDays(currentYear, currentMonth);
  }



  clearSelectedDay() {
    // Lógica para reiniciar la selección del día
    console.log('Reiniciando la selección del día...');
    this.selectedDate = '';
  }

  applyActiveDayColor(selectedDate: Date = new Date(), isDeselection: boolean = false) {
    const dateKey = this.formatDateKey(selectedDate);
    const dayData = this.dayScores[dateKey];
    const datetimeElement = document.querySelector('ion-datetime') as HTMLIonDatetimeElement;

    if (datetimeElement) {
      if (isDeselection) {
        // Si estamos deseleccionando un día, eliminamos cualquier color previamente aplicado
        datetimeElement.style.removeProperty('--day-score-color');
        console.log(`Deseleccionando día ${dateKey}, eliminando color personalizado.`);
        return;
      }

      let color = '#1e1e1e'; // Color neutro por defecto
      if (dayData && dayData.isComplete) {
        color = dayData.color; // Usar el color solo si está completo
      }

      datetimeElement.style.setProperty('--day-score-color', color);
      console.log(`Estableciendo --day-score-color: ${color} para el día ${dateKey}`);
    }
  }

  formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectDay(event: any) {
    if (this.selectedDate) {
      // Deseleccionamos el día previamente seleccionado
      this.selectedDate = ''; // Limpia la selección antes de continuar
    }

    const selectedDate = new Date(event.detail.value);
    this.selectedDate = this.formatDateKey(selectedDate);

    // Aplicar el color al nuevo día seleccionado
    this.applyActiveDayColor(selectedDate);

    // Navegamos al día seleccionado después de un pequeño retraso
    setTimeout(() => {
      const day = selectedDate.getDate();
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      // Aquí aplicamos el replaceUrl
      this.router.navigate(['/tabs/daily', `${year}-${month}-${day}`], { replaceUrl: true });
    }, 50);
  }


  onDateChange(event: any) {
    const selectedDate = new Date(event.detail.value);
    this.selectedDate = selectedDate.toISOString(); // Actualiza el valor seleccionado
    this.applyActiveDayColor(selectedDate); // Aplica los cambios visuales si corresponde
  }

  highlightedDates = (isoString: string) => {
    const date = new Date(isoString);
    const dateKey = this.formatDateKey(date);
    const dayData = this.dayScores[dateKey];

    if (dayData) {
      // Podrías distinguir si es un día completo o parcial:
      if (dayData.isComplete) {
        // Día completo
        return {
          textColor: '#000000',
          backgroundColor: dayData.color,
        };
      } else {
        // Día parcial
        return {
          textColor: '#141218',
          backgroundColor: '#616e7e',
        };
      }
    }

    // Si no hay datos de ese día, usa un color neutro
    return {
      textColor: '#FFFFFF',
      backgroundColor: '#1e1e1e',
    };
  };

  resetCalendar() {
    const calendarElement = document.querySelector('ion-datetime') as HTMLIonDatetimeElement;

    if (calendarElement) {
      console.log('Forzando reseteo del calendario...');
      calendarElement.value = null;

      setTimeout(() => {
        const today = new Date().toISOString();
        this.currentDay = today;
        calendarElement.value = this.currentDay;
        calendarElement.dispatchEvent(new Event('ionChange'));
        this.cdr.detectChanges();
        this.applyActiveDayColor(); // Reaplicamos el color personalizado
        console.log('Calendario reseteado.');
      }, 50);
    } else {
      console.warn('No se encontró el calendario para resetear.');
    }
  }
}
