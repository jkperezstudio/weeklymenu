import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItemSliding, IonItem, IonLabel, IonItemOptions, IonItemOption, IonIcon, IonThumbnail, IonButtons, IonMenuButton, IonSearchbar } from '@ionic/angular/standalone';
import { Meal } from 'src/app/interfaces/meal.interface';
import { Firestore, collection, deleteDoc, doc, getDocs } from '@angular/fire/firestore';



@Component({
  selector: 'app-mealdb',
  templateUrl: './mealdb.page.html',
  styleUrls: ['./mealdb.page.scss'],
  standalone: true,
  imports: [IonButtons, IonIcon, IonItemOption, IonItemOptions, IonLabel, IonItem, IonItemSliding, IonList, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonThumbnail, IonMenuButton, ReactiveFormsModule, IonSearchbar]
})
export class MealdbPage implements OnInit {
  meals: Meal[] = [];
  filteredMeals: Meal[] = [];
  searchQuery = new FormControl('');

  constructor(private firestore: Firestore, private router: Router) { }

  ngOnInit() {
    this.fetchMeals();
  }

  async fetchMeals() {
    const mealsCollection = collection(this.firestore, 'meals');
    const mealsSnapshot = await getDocs(mealsCollection);
    this.meals = mealsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Meal[];
    this.filteredMeals = [...this.meals];
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

  goToMealForm(meal: Meal) {
    this.router.navigate(['/mealform', meal.id]);
  }



  capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }


}


