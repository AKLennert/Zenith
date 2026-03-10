import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface FoodItem {
  id: string; // usually timestamp or uuid
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyFoodLog {
  date: string; // YYYY-MM-DD
  breakfast: FoodItem[];
  lunch: FoodItem[];
  dinner: FoodItem[];
  snacks: FoodItem[];
  medicine: FoodItem[]; // Represents medicines or supplements
}

@Injectable({
  providedIn: 'root'
})
export class FoodLogService {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  private async getUserId(): Promise<string> {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.uid;
  }

  async getLogByDate(date: string): Promise<DailyFoodLog | null> {
    const uid = await this.getUserId();
    const docRef = doc(this.firestore, `users/${uid}/foodLogs/${date}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DailyFoodLog;
    }
    return null;
  }

  async saveLog(log: DailyFoodLog): Promise<void> {
    const uid = await this.getUserId();
    const docRef = doc(this.firestore, `users/${uid}/foodLogs/${log.date}`);
    // Merge so we don't accidentally overwrite if multiple things save at once
    await setDoc(docRef, log, { merge: true });
  }

  async addFoodItem(date: string, mealType: keyof Omit<DailyFoodLog, 'date'>, item: FoodItem): Promise<void> {
    let log = await this.getLogByDate(date);
    if (!log) {
      log = {
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
        medicine: []
      };
    }
    
    // Ensure array exists in case of old data structures
    if (!log[mealType]) {
      log[mealType] = [];
    }
    
    log[mealType].push(item);
    await this.saveLog(log);
  }
}
