import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, collectionData, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Reminder {
  id?: string;
  text: string;
  completed: boolean;
  date: string; // Format 'YYYY-MM-DD'
  createdAt?: object;
}

@Injectable({
  providedIn: 'root'
})
export class RemindersService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  /**
   * Get a real-time stream of a user's reminders for a specific date
   */
  getRemindersByDate(uid: string, dateString: string): Observable<Reminder[]> {
    const remindersRef = collection(this.firestore, `users/${uid}/reminders`);
    const q = query(
      remindersRef, 
      where('date', '==', dateString)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Reminder[]>;
  }

  /**
   * Add a new reminder for a specific date
   */
  async addReminder(uid: string, dateString: string, text: string): Promise<void> {
    const remindersRef = collection(this.firestore, `users/${uid}/reminders`);
    await addDoc(remindersRef, {
      text,
      completed: false,
      date: dateString,
      createdAt: serverTimestamp()
    });
  }

  /**
   * Update a reminder (e.g., mark as completed or change text)
   */
  async updateReminder(uid: string, reminderId: string, data: Partial<Reminder>): Promise<void> {
    const reminderDocRef = doc(this.firestore, `users/${uid}/reminders/${reminderId}`);
    return updateDoc(reminderDocRef, data);
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(uid: string, reminderId: string): Promise<void> {
    const reminderDocRef = doc(this.firestore, `users/${uid}/reminders/${reminderId}`);
    return deleteDoc(reminderDocRef);
  }
}
