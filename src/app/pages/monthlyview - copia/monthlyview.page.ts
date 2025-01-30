import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonDatetime } from '@ionic/angular/standalone';
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
  imports: [IonDatetime, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuButton, RouterModule]
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

    // Si `currentDay` está vacío, asignamos la fecha actual en formato ISO
    if (!this.currentDay) {
      this.currentDay = new Date().toISOString();
    }

    // Suscribirse a cambios de navegación
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url.includes('monthlyview')) {
          this.clearSelectedDay(); // Limpia la selección del día cuando se vuelve a la vista mensual
        }
      });

    const scoresCollection = collection(this.firestore, 'dailyScores');

    onSnapshot(scoresCollection, (snapshot) => {

      this.dayScores = {};

      snapshot.forEach((doc) => {
        const data = doc.data() as { year: number, month: number, day: number, color: string, isComplete: boolean };
        const dateKey = `${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`;
        this.dayScores[dateKey] = {
          color: data.color,
          isComplete: data.isComplete
        };
      });

      console.log('Colores actualizados desde Firebase:', this.dayScores);
      this.isCalendarReady = true;
      this.highlightedDates = this.createHighlightedDatesFunction();
      this.refreshCalendar();
      this.cdr.detectChanges();

    });
  }

  private createHighlightedDatesFunction(): (isoString: string) => any {
    return (isoString: string) => {
      const date = new Date(isoString);
      const dateKey = this.formatDateKey(date);
      const dayData = this.dayScores[dateKey];

      if (dayData) {
        return {
          textColor: dayData.isComplete ? '#000000' : '#898989',
          backgroundColor: dayData.isComplete ? dayData.color : '#525357',
        };
      }

      // Manejar el día actual
      if (dateKey === this.formatDateKey(new Date(this.currentDay))) {
        return {
          textColor: '#FFFFFF',
          backgroundColor: '#00FF00', // Color para el día actual (puedes cambiarlo)
        };
      }

      return {
        textColor: '#FFFFFF',
        backgroundColor: '#222222',
      };
    };
  }

  // En el método clearSelectedDay:
  clearSelectedDay() {
    this.selectedDate = '';
    this.currentDay = new Date().toISOString();
    this.cdr.detectChanges();
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
    // Aplica los cambios visuales si corresponde
  }

  highlightedDates: (isoString: string) => any = () => ({});


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
        console.log('Calendario reseteado.');
      }, 50);
    } else {
      console.warn('No se encontró el calendario para resetear.');
    }
  }

  private refreshCalendar() {
    const currentValue = this.currentDay;

    // Usar un valor diferente temporalmente (no vacío)
    this.currentDay = new Date().toISOString();
    this.cdr.detectChanges();

    setTimeout(() => {
      this.currentDay = currentValue;
      this.cdr.detectChanges();
    }, 50); // Aumentar el tiempo de espera
  }
}