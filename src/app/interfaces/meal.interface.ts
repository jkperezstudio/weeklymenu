import { DocumentData } from '@angular/fire/firestore';


export interface Meal {
    id: string;
    name: string;
    score: number;
    done: boolean;
    mealtype: string;
    description?: string | null;
    reminder?: boolean;
    reminderTime?: string;
    delivery?: boolean;
    recipe?: string | null;
    url?: string | null;
    image?: string | null;
    defrostAlarm?: {
        enabled: boolean;
        scheduledTime: string; // ISO string
        notificationId?: number;
    };
}


export interface FirestoreDayData extends DocumentData {
    year: number;
    month: number;
    day: number;
    meals: Meal[];
    score: number;
    color: string;
    isComplete?: boolean;
}

