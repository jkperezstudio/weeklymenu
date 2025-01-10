import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ImageOptionsSheetComponent } from '../../image-options-sheet/image-options-sheet.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Firestore, collection, addDoc, doc, getDoc } from '@angular/fire/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Meal } from 'src/app/interfaces/meal.interface';




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
  scoreControl = new FormControl<number | null>(null);
  descriptionControl = new FormControl('', { nonNullable: true });
  urlControl = new FormControl('', { nonNullable: true });
  thumbUpSelected: boolean = false;
  thumbDownSelected: boolean = false;
  isLoading: boolean = false;

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

  constructor(private bottomSheet: MatBottomSheet, private firestore: Firestore, private route: ActivatedRoute) { }

  ngOnInit() {
    const mealId = this.route.snapshot.paramMap.get('id');
    if (mealId) {
      this.loadMealData(mealId);
    }
  }

  async loadMealData(mealId: string) {
    const mealDoc = doc(this.firestore, `meals/${mealId}`);
    const mealSnapshot = await getDoc(mealDoc);

    if (mealSnapshot.exists()) {
      const mealData = mealSnapshot.data() as Meal; // Tipa los datos como 'Meal'

      this.mealNameControl.setValue(mealData.name || '');
      this.scoreControl.setValue(mealData.score || null);
      this.descriptionControl.setValue(mealData.description || '');
      this.urlControl.setValue(mealData.url || '');
      this.selectedImage = mealData.image || 'assets/placeholder-image.png';
      this.thumbUpSelected = mealData.thumbsUp || false;
      this.thumbDownSelected = mealData.thumbsDown || false;
    } else {
      console.error('No such meal found!');
    }
  }



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
        source: CameraSource.Photos,
        resultType: CameraResultType.DataUrl, // Devuelve la imagen en formato base64
        quality: 90,
      });

      if (image.dataUrl) {
        this.selectedImage = image.dataUrl; // Actualizamos solo si se seleccionó una imagen
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User cancelled photos app')) {
        console.log('User canceled image selection.');
      } else {
        console.error('Error selecting image:', error);
      }
    }
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        source: CameraSource.Camera, // Abre la cámara
        resultType: CameraResultType.Uri // Devuelve una URI accesible
      });

      if (image.webPath) {
        this.selectedImage = image.webPath; // Muestra la imagen en la vista
        console.log('Photo webPath:', image.webPath);

        // Obtén el contenido de la imagen como blob
        const response = await fetch(image.webPath);
        const blob = await response.blob();

        // Convierte el blob a base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          this.selectedImage = base64data; // Almacena la imagen en base64 para subirla
          console.log('Base64 image:', base64data);
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  }

  async saveMeal() {

    this.isLoading = true;

    const mealName = this.mealNameControl.value;
    const score = this.scoreControl.value;
    const description = this.descriptionControl.value;
    const url = this.urlControl.value;

    if (!mealName || mealName.trim() === '') {
      console.log('Name is required.');
      this.isLoading = false;
      return;
    }

    let imageUrl = '';
    if (this.selectedImage && this.selectedImage.startsWith('data:image')) { // Verificamos si es una imagen válida
      try {
        imageUrl = await this.uploadImage(this.selectedImage); // Sube la imagen y obtiene la URL
      } catch (error) {
        console.error('Error uploading image:', error);
        this.isLoading = false;
        return;
      }
    } else {
      console.log('No valid image to upload.'); // Mensaje opcional
    }


    const mealData = {
      name: mealName.trim(),
      score,
      description: description?.trim() || '',
      url: url?.trim() || '',
      thumbsUp: this.thumbUpSelected,
      thumbsDown: this.thumbDownSelected,
      image: imageUrl, // Incluye la URL de la imagen en Firestore
    };

    try {
      const mealsCollection = collection(this.firestore, 'meals');
      await addDoc(mealsCollection, mealData);
      console.log('Meal saved successfully:', mealData);
      this.resetForm();
    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      this.isLoading = false; // Siempre desactiva el spinner al final
    }
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

  async uploadImage(imageBase64: string): Promise<string> {
    console.log('Uploading image:', imageBase64); // Depuración
    const storage = getStorage();
    const storageRef = ref(storage, `meals/${new Date().getTime()}.jpg`);

    try {
      if (!imageBase64.startsWith('data:image')) {
        throw new Error('Invalid image format');
      }
      await uploadString(storageRef, imageBase64, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  resetForm() {
    this.mealNameControl.reset();
    this.scoreControl.setValue(null); // Restablece el score
    this.descriptionControl.reset();
    this.urlControl.reset();
    this.thumbUpSelected = false;
    this.thumbDownSelected = false;
    this.selectedImage = 'assets/placeholder-image.png'; // Restablece la imagen al placeholder
  }

}


