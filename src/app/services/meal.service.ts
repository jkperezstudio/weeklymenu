import { Injectable } from '@angular/core';
import { Meal } from '../interfaces/meal.interface'; // Asegúrate de importar la interfaz desde la ruta correcta
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MealService {
  // Array mock inicial de comidas
  private meals: Meal[] = [
    { id: '1', name: 'Desayuno', score: 5, done: false, mealtype: 'breakfast' },
    { id: '2', name: 'Comida', score: 3, done: false, mealtype: 'lunch' },
    { id: '3', name: 'Cena', score: 2, done: false, mealtype: 'dinner' }

  ];

  // Observable para poder suscribirnos a los cambios en la lista de comidas
  private mealsSubject = new BehaviorSubject<Meal[]>(this.meals);
  meals$ = this.mealsSubject.asObservable();

  constructor() { }

  // Obtener todas las comidas
  getMeals(): Meal[] {
    return this.meals;
  }

  // Añadir una comida nueva
  addMeal(meal: Meal): void {
    this.meals.push(meal);
    this.mealsSubject.next(this.meals);
  }

  // Editar una comida existente
  editMeal(id: string, updatedMeal: Meal): void {
    const index = this.meals.findIndex(meal => meal.id === id);
    if (index !== -1) {
      this.meals[index] = { ...this.meals[index], ...updatedMeal };
      this.mealsSubject.next(this.meals);
    }
  }

  // Cambiar el estado "done" de una comida
  toggleMealStatus(id: string): void {
    const meal = this.meals.find(meal => meal.id === id);
    if (meal) {
      meal.done = !meal.done;
      this.mealsSubject.next(this.meals);
    }
  }
}
