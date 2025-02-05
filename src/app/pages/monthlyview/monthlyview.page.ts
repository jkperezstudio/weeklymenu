import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonDatetime } from '@ionic/angular/standalone';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Firestore, collection, onSnapshot } from '@angular/fire/firestore';
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
  dayScores: { [key: string]: { color: string, isComplete: boolean } } = {};
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

    // Suscribirse a los cambios de navegación
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('monthlyview')) {
          this.clearSelectedDay(); // Limpia la selección del día cuando se vuelve a la vista mensual
        }
      });

    const scoresCollection = collection(this.firestore, 'dailyScores');

    onSnapshot(scoresCollection, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data() as { year: number, month: number, day: number, color: string, isComplete: boolean };
        const dateKey = `${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`;
        this.dayScores[dateKey] = {
          color: data.color,
          isComplete: data.isComplete // Incluimos isComplete en dayScores
        };
      });

      console.log('Colores actualizados desde Firebase:', this.dayScores);

      // Establece el color inicial del día actual SOLO si no hay día seleccionado
      const today = new Date();
      this.applyActiveDayColor(today);

      this.isCalendarReady = true;
      this.cdr.detectChanges();
    });

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

      let color = '#222222'; // Color neutro por defecto
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
      this.router.navigate(['/dailyview', `${year}-${month}-${day}`], { replaceUrl: true });
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
          backgroundColor: '#3f384c',
        };
      }
    }

    // Si no hay datos de ese día, usa un color neutro
    return {
      textColor: '#FFFFFF',
      backgroundColor: '#222222',
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
