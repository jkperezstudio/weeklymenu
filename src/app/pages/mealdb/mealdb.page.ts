import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItemSliding, IonItem, IonLabel, IonItemOptions, IonItemOption, IonIcon, IonThumbnail, IonSearchbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonFooter, IonFab, IonFabButton, IonSpinner } from '@ionic/angular/standalone';
import { Meal } from 'src/app/interfaces/meal.interface';
import { Firestore, collection, deleteDoc, doc, getDocs } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-mealdb',
  templateUrl: './mealdb.page.html',
  styleUrls: ['./mealdb.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonFabButton, IonFab, IonFooter, IonCardTitle, IonCardHeader, IonCard, IonIcon, IonItemOption, IonItemOptions, IonLabel, IonItem, IonItemSliding, IonList, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonThumbnail, ReactiveFormsModule, IonSearchbar]
})
export class MealdbPage implements OnInit {
  meals: Meal[] = [];
  filteredMeals: Meal[] = [];
  searchQuery = new FormControl('');
  isLoading: boolean = false;


  constructor(private firestore: Firestore, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        console.log('Forzando recarga de meals...');
        this.fetchMeals();
      }
    });
    this.fetchMeals();
  }


  // 🔥 Se ejecuta SIEMPRE que entras en la página
  ionViewWillEnter() {
    this.fetchMeals();
  }

  async fetchMeals() {
    this.isLoading = true;
    const mealsCollection = collection(this.firestore, 'meals');
    const mealsSnapshot = await getDocs(mealsCollection);

    this.meals = mealsSnapshot.docs.map((doc) => {
      const data = doc.data() as Meal; // 🔥 Convertimos correctamente a `Meal`
      return {
        ...data,  // Copia los datos originales (name, score, etc.)
        id: doc.id,  // Añade el ID
        imageLoaded: false // 🔥 Para el spinner
      };
    });

    this.meals.sort((a, b) => a.name.localeCompare(b.name));
    this.filteredMeals = [...this.meals];

    this.isLoading = false; // 🔥 La lista aparece al instante
  }


  onImageLoad(meal: any) {
    meal.imageLoaded = true;  // 🔥 Se oculta el spinner cuando la imagen termina de cargar
  }


  filterMeals() {
    const query = this.searchQuery.value?.toLowerCase() || '';
    this.filteredMeals = this.meals.filter((meal) =>
      meal.name.toLowerCase().includes(query)
    );
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

  async deleteMeal(mealId: string) {
    if (!mealId) {
      console.error('Invalid meal ID');
      return;
    }
    const mealDoc = doc(this.firestore, `meals/${mealId}`);
    await deleteDoc(mealDoc);
    this.fetchMeals(); // Refresh meals
  }

  goToMealForm(meal?: Meal) {
    const mealId = meal ? meal.id : 'new';  // Si no hay meal, usa 'new'
    this.router.navigate(['/mealform', mealId]);
  }

  capitalizeWords(str: string): string {
    return str.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  }
}
