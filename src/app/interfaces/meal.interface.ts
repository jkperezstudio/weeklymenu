export interface Meal {
    id: string;
    mealtype: string;
    name: string;
    score: number;
    done: boolean;
    description?: string;
    recipe?: string;
    url?: string;
    image?: string;
    thumbsUp?: boolean;
    thumbsDown?: boolean;
}

export interface DailyMeal {
    id: string;
    name: string;
    score: number | null;
    mealtype: string;
    done: boolean;
    date: string;
    description?: string;
}




export interface FirestoreDayData {
    score: number;
    color: string;
    year: number;
    month: number;
    day: number;
    meals: Meal[];
}
