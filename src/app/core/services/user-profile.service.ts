import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  house?: string;
  favoriteSpell?: string;
  theme?: string;
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
