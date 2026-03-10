import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  dailyReminder?: boolean;
  defaultQuestDuration?: number;
  theme?: string;
  weight?: number; // in kg
  height?: number; // in cm
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  maintenanceCalories?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private firestore: Firestore = inject(Firestore);

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(this.firestore, `users/${uid}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }

  async createUserProfile(user: UserProfile): Promise<void> {
    const docRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(docRef, user, { merge: true });
  }

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(docRef, data);
  }
}
