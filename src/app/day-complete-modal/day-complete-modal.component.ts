import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';



@Component({
  selector: 'app-day-complete-modal',
  templateUrl: './day-complete-modal.component.html',
  styleUrls: ['./day-complete-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DayCompleteModalComponent {
  @Input() averageScore!: number;
  @Input() color!: string;

  constructor(private modalCtrl: ModalController, private router: Router) { }

  ngOnInit() {
    // Calcula el matiz (hue) basado en el color recibido
    const hue = this.calculateHueFromColor(this.color);

    // Inyecta el matiz como una variable CSS para colorear el GIF
    document.documentElement.style.setProperty('--color-of-day-hue', `${hue}deg`);

    // Cierra el modal automáticamente después de 3 segundos
    setTimeout(() => {
      this.dismissAndRedirect();
    }, 2500);

  }

  dismissAndRedirect() {
    this.modalCtrl.dismiss().then(() => {
      this.router.navigate(['/monthlyview']); // Ajusta la ruta según tu vista de calendario
    });
  }

  private calculateHueFromColor(color: string): number {
    // Convierte el color HEX a matiz (hue) para aplicar en hue-rotate
    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.slice(1), 16);
      return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    };

    const rgb = hexToRgb(color);
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    let hue = 0;

    if (max !== min) {
      const delta = max - min;
      switch (max) {
        case rgb.r: hue = ((rgb.g - rgb.b) / delta) % 6; break;
        case rgb.g: hue = (rgb.b - rgb.r) / delta + 2; break;
        case rgb.b: hue = (rgb.r - rgb.g) / delta + 4; break;
      }
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    return Math.round(hue);
  }
}


