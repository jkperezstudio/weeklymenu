import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { ImageOptionsSheetComponent } from '../../image-options-sheet/image-options-sheet.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Firestore, collection, addDoc, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';


@Component({
  selector: 'app-mealform',
  templateUrl: './mealform.page.html',
  styleUrls: ['./mealform.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, MatBottomSheetModule]
})
export class MealformPage implements OnInit {
  mealId: string | null = null;
  selectedImage: string = 'assets/placeholder-image.png';
  mealNameControl = new FormControl('', { nonNullable: true });
  scoreControl = new FormControl(null);
  descriptionControl = new FormControl('', { nonNullable: true });
  urlControl = new FormControl('', { nonNullable: true });
  thumbUpSelected: boolean = false;
  thumbDownSelected: boolean = false;
  isLoading: boolean = false;
  allMeals: any[] = [];
  suggestions: any[] = [];


  constructor(
    private route: ActivatedRoute,
    private bottomSheet: MatBottomSheet,
    private firestore: Firestore,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.mealId = this.route.snapshot.paramMap.get('id');
    await this.loadAllMeals(); // Cargar todas las comidas al inicializar
    if (this.mealId) {
      await this.loadMeal();
    }
  }

  async loadAllMeals() {
    try {
      const mealsCollection = collection(this.firestore, 'meals');
      const querySnapshot = await getDocs(mealsCollection);
      this.allMeals = querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error loading meals:', error);
    }
  }

  filterSuggestions() {
    const query = this.mealNameControl.value?.trim().toLowerCase() || '';
    if (!query) {
      this.suggestions = [];
      return;
    }
    this.suggestions = this.allMeals
      .filter(meal => meal.name.toLowerCase().startsWith(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  selectSuggestion(suggestion: any) {
    this.mealNameControl.setValue(suggestion.name);
    this.scoreControl.setValue(suggestion.score);
    this.descriptionControl.setValue(suggestion.description || '');
    this.urlControl.setValue(suggestion.url || '');
    this.selectedImage = suggestion.image || 'assets/placeholder-image.png';
    this.thumbUpSelected = suggestion.thumbsUp || false;
    this.thumbDownSelected = suggestion.thumbsDown || false;

    this.suggestions = []; // Ocultar la lista de sugerencias tras la selección
  }



  async loadMeal() {
    this.isLoading = true;
    try {
      const mealDocRef = doc(this.firestore, `meals/${this.mealId}`);
      const mealDocSnap = await getDoc(mealDocRef);
      if (mealDocSnap.exists()) {
        const mealData = mealDocSnap.data() as any;
        this.mealNameControl.setValue(mealData.name);
        this.scoreControl.setValue(mealData.score);
        this.descriptionControl.setValue(mealData.description || '');
        this.urlControl.setValue(mealData.url || '');
        this.selectedImage = mealData.image || 'assets/placeholder-image.png';
        this.thumbUpSelected = mealData.thumbsUp;
        this.thumbDownSelected = mealData.thumbsDown;
      } else {
        console.error('Meal not found');
      }
    } catch (error) {
      console.error('Error loading meal:', error);
    } finally {
      this.isLoading = false;
    }
  }

  toggleThumb(thumb: string) {
    if (thumb === 'up') {
      this.thumbUpSelected = !this.thumbUpSelected;
      if (this.thumbUpSelected) this.thumbDownSelected = false;
    } else if (thumb === 'down') {
      this.thumbDownSelected = !this.thumbDownSelected;
      if (this.thumbDownSelected) this.thumbUpSelected = false;
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
        resultType: CameraResultType.DataUrl,
        quality: 90,
      });
      if (image.dataUrl) {
        this.selectedImage = image.dataUrl;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('User cancelled')) {
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
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri
      });
      if (image.webPath) {
        // Convertir la imagen a base64
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          this.selectedImage = reader.result as string;
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

    let imageUrl = this.selectedImage;

    if (this.selectedImage && this.selectedImage.startsWith('data:image')) {
      try {
        imageUrl = await this.uploadImage(this.selectedImage);
      } catch (error) {
        console.error('Error uploading image:', error);
        this.isLoading = false;
        return;
      }
    }

    const mealData = {
      name: mealName.trim(),
      score,
      description: description.trim() || '',
      url: url.trim() || '',
      thumbsUp: this.thumbUpSelected,
      thumbsDown: this.thumbDownSelected,
      image: imageUrl
    };

    try {
      if (this.mealId) {
        // Editando meal existente
        const mealDocRef = doc(this.firestore, `meals/${this.mealId}`);
        await updateDoc(mealDocRef, mealData);
        console.log('Meal updated successfully:', mealData);
      } else {
        // Creando nueva meal
        const mealsCollection = collection(this.firestore, 'meals');
        await addDoc(mealsCollection, mealData);
        console.log('Meal saved successfully:', mealData);
        this.resetForm();
      }

      // 🔥 Redirigir a DataBase después de guardar
      this.router.navigate(['/tabs/database']);

    } catch (error) {
      console.error('Error saving meal:', error);
    } finally {
      this.isLoading = false;
    }
  }



  async uploadImage(imageBase64: string): Promise<string> {
    const storage = getStorage();
    const storageRef = ref(storage, `meals/${new Date().getTime()}.jpg`);
    try {
      await uploadString(storageRef, imageBase64, 'data_url');
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  resetForm() {
    this.mealNameControl.reset();
    this.scoreControl.setValue(null);
    this.descriptionControl.reset();
    this.urlControl.reset();
    this.thumbUpSelected = false;
    this.thumbDownSelected = false;
    this.selectedImage = 'assets/placeholder-image.png';
  }

  getScoreColor(score: number | null): string {
    if (score === null) return '#ccc';
    switch (score) {
      case 1: return '#ff4d4d';
      case 2: return '#ffa64d';
      case 3: return '#ffd24d';
      case 4: return '#b3ff4d';
      case 5: return '#4dff4d';
      default: return '#ccc';
    }
  }
}
