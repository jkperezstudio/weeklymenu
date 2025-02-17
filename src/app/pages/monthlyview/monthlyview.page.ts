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
          hasDelivery: hasDelivery // Guardamos si hay pedido
        };


      });

      this.isCalendarReady = true;
      this.cdr.detectChanges();

      // 🔥 Aplicamos los estilos una vez que los datos han cargado
      this.markDeliveryDays();
    });

  }

  // 🔥 Método para marcar los días con delivery en el DOM de ion-datetime
  markDeliveryDays() {
    setTimeout(() => {
      const datetimeElement = document.querySelector('ion-datetime');
      if (!datetimeElement) {
        console.log('❌ ion-datetime no encontrado');
        return;
      }

      const shadowRoot = datetimeElement.shadowRoot;
      if (!shadowRoot) {
        console.log('❌ No se pudo acceder al Shadow DOM de ion-datetime');
        return;
      }

      // 🔥 Inyectar CSS en el Shadow DOM
      const styleTag = document.createElement("style");
      styleTag.textContent = `
    button[data-delivery="true"]::before {
    content: "•";
    color: #901050;
    font-size: 30px;  /* Reducimos el tamaño para que no se desborde */
    position: absolute;
    bottom: -5px;  /* Bajamos más */
    right: 5px;  /* Lo pegamos más a la esquina */
    transform: none;
    line-height: 1;  /* Evita que se mueva por el tamaño del botón */
}

`;


      if (!shadowRoot.querySelector("style[data-injected='true']")) {
        styleTag.setAttribute("data-injected", "true");
        shadowRoot.appendChild(styleTag);
      }

      Object.keys(this.dayScores).forEach(dateKey => {
        if (this.dayScores[dateKey]?.hasDelivery) {
          const [year, month, day] = dateKey.split('-').map(Number);

          const dayElement = shadowRoot.querySelector(
            `button[data-day="${day}"][data-month="${month}"][data-year="${year}"]`
          );

          if (dayElement) {
            dayElement.setAttribute('data-delivery', 'true');

          } else {

          }
        }
      });
    }, 500);
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
