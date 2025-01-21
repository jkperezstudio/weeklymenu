import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';


@Component({
  selector: 'app-day-complete-modal',
  templateUrl: './day-complete-modal.component.html',
  styleUrls: ['./day-complete-modal.component.scss'],
  standalone: true,
  // Importa los módulos de Ionic que uses en el template
  imports: [CommonModule, IonicModule]
})
export class DayCompleteModalComponent {
  @Input() averageScore!: number;
  @Input() color!: string;

  constructor(private modalCtrl: ModalController) { }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
