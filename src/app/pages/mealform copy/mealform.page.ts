import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';


@Component({
  selector: 'app-mealform',
  templateUrl: './mealform.page.html',
  styleUrls: ['./mealform.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class MealformPage {

  selectedImage: string = 'assets/placeholder-image.png';
  mealNameControl = new FormControl('');
  scoreControl = new FormControl(3);
  descriptionControl = new FormControl('');
  urlControl = new FormControl('')

  constructor(private toastController: ToastController) { }

  public toastButtons = [
    {
      text: 'Gallery',
      handler: () => {
        this.selectFromGallery();
      },
    },
    {
      text: 'Camera',
      handler: () => {
        this.takePhoto();
      },
    },
    {
      text: 'Cancel',
      role: 'cancel',
    },
  ];


  saveMeal() {
    const mealName = this.mealNameControl.value;
    const score = this.scoreControl.value;
    const description = this.descriptionControl.value;
    const url = this.urlControl.value;

    if (!mealName || mealName.trim() === '') {
      console.log('Name is required.');
      return;
    }

    if (url && !this.isValidUrl(url)) {
      console.log('Invalid URL.');
      return;
    }


    console.log('Meal saved:', { mealName, score, description, url });
    this.mealNameControl.reset();
    this.scoreControl.setValue(3); // Reseteamos el score al valor por defecto
    this.descriptionControl.reset();
    this.urlControl.reset();
  }


  getScoreColor(score: number | null): string {
    if (!score) return '#ccc'; // Color gris por defecto si no hay valor
    switch (score) {
      case 1: return '#ff4d4d'; // Rojo
      case 2: return '#ffa64d'; // Naranja
      case 3: return '#ffd24d'; // Amarillo
      case 4: return '#b3ff4d'; // Verde claro
      case 5: return '#4dff4d'; // Verde fuerte
      default: return '#ccc';    // Gris por defecto
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

  async openImageOptions() {
    const toast = await this.toastController.create({
      message: 'Select an image from:',
      position: 'bottom', // O 'top', según prefieras
      buttons: [
        {
          text: 'Gallery',
          handler: () => {
            this.selectFromGallery();
          },
        },
        {
          text: 'Camera',
          handler: () => {
            this.takePhoto();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }


  selectFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedImage = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
    input.click();
  }

  takePhoto() {
    console.log('Take a photo (to be implemented later)');
    // Aquí implementarás la cámara más adelante
  }

  onThumbsUp() {
    console.log('Thumbs up clicked!');
  }

  onThumbsDown() {
    console.log('Thumbs down clicked!');
  }


}


