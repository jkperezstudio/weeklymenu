export interface Meal {
    id: string;
    mealtype: string;
    name: string;
    score: number;
    done: boolean;
    reminder: boolean;
    description?: string;
    recipe?: string;
    url?: string;
    image?: string;
}

export interface FirestoreDayData {
    score: number;
    color: string;
    year: number;
    month: number;
    day: number;
    meals: Meal[];
}
