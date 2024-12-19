import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ImageOptionsSheetComponent } from '../../image-options-sheet/image-options-sheet.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';


@Component({
  selector: 'app-mealform',
  templateUrl: './mealform.page.html',
  styleUrls: ['./mealform.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class MealformPage {

  selectedImage: string = 'assets/placeholder-image.png';
  mealNameControl = new FormControl('', { nonNullable: true });
  scoreControl = new FormControl(null);
  descriptionControl = new FormControl('');
  urlControl = new FormControl('')
  thumbUpSelected: boolean = false;
  thumbDownSelected: boolean = false;

  toggleThumb(thumb: string) {
    if (thumb === 'up') {
      this.thumbUpSelected = !this.thumbUpSelected;
      if (this.thumbUpSelected) {
        this.thumbDownSelected = false; // Desactiva thumb-down
      }
    } else if (thumb === 'down') {
      this.thumbDownSelected = !this.thumbDownSelected;
      if (this.thumbDownSelected) {
        this.thumbUpSelected = false; // Desactiva thumb-up
      }
    }
  }



  constructor(private bottomSheet: MatBottomSheet) { }

  openImageOptions() {
    const bottomSheetRef = this.bottomSheet.open(ImageOptionsSheetComponent);

    bottomSheetRef.afterDismissed().subscribe((result) => {
      if (result === 'gallery') {
        this.pickImageFromGallery();
      } else if (result === 'camera') {
        this.takePhoto();
      }
    });
  }

  async pickImageFromGallery() {
    try {
      const image = await Camera.getPhoto({
        source: CameraSource.Photos, // Abre la galería
        resultType: CameraResultType.Uri, // Devuelve la URI
        quality: 90, // Calidad de la imagen
        allowEditing: false, // Opcional, no permite editar
      });

      if (image && image.webPath) {
        this.selectedImage = image.webPath; // Actualiza el placeholder con la imagen seleccionada
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  }


  async takePhoto() {
    const image = await Camera.getPhoto({
      quality: 90,
      source: CameraSource.Camera, // Abre la cámara directamente
      resultType: CameraResultType.Uri
    });

    if (image.webPath) {
      this.selectedImage = image.webPath; // Mostramos la imagen en la vista
      console.log('Photo taken:', image.webPath);
    }
  }



  saveMeal() {
    const mealName = this.mealNameControl.value;
    const score = this.scoreControl.value;

    if (!mealName || !score) {
      console.log('Both Name and Score are required.');
      return;
    }

    console.log('Meal saved:', { mealName, score });
    this.mealNameControl.reset();
    this.scoreControl.setValue(null); // Reiniciamos el score a null
  }

  getScoreColor(score: number | null): string {
    if (score === null) return '#ccc'; // Gris por defecto
    switch (score) {
      case 1: return '#ff4d4d'; // Rojo
      case 2: return '#ffa64d'; // Naranja
      case 3: return '#ffd24d'; // Amarillo
      case 4: return '#b3ff4d'; // Verde claro
      case 5: return '#4dff4d'; // Verde fuerte
      default: return '#ccc';    // Gris
    }
  }

  isValidUrl(url: string): boolean {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // Protocolo
      '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|' + // Dominio
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // IP (v4) dirección
      '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*' + // Ruta
      '(\\?[;&a-zA-Z\\d%_.~+=-]*)?' + // Query string
      '(\\#[-a-zA-Z\\d_]*)?$', 'i'); // Fragmento
    return !!pattern.test(url);
  }



  onThumbsUp() {
    console.log('Thumbs up clicked!');
  }

  onThumbsDown() {
    console.log('Thumbs down clicked!');
  }


}


