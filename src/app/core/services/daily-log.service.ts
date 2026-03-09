import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, docData, setDoc, serverTimestamp, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface DailyLog {
  id?: string;
  date: string | Timestamp;
  partook: boolean | null;
  mood?: string;
  journal?: string;
  updatedAt?: object;
}

@Injectable({
  providedIn: 'root'
})
export class DailyLogService {
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  /**
   * Get a real-time stream of a user's log for a specific date
   * @param uid The user's UID
   * @param dateString Format 'YYYY-MM-DD'
   */
  getLogByDate(uid: string, dateString: string): Observable<DailyLog | undefined> {
    const logDocRef = doc(this.firestore, `users/${uid}/daily_logs/${dateString}`);
    return docData(logDocRef, { idField: 'id' }) as Observable<DailyLog | undefined>;
  }

  /**
   * Create or update a log for a specific date
   * @param uid The user's UID
   * @param dateString Format 'YYYY-MM-DD'
   * @param data The log payload (partially updated)
   */
  async saveLog(uid: string, dateString: string, data: Partial<DailyLog>): Promise<void> {
    const logDocRef = doc(this.firestore, `users/${uid}/daily_logs/${dateString}`);
    
    const payload = {
      ...data,
      id: dateString,
      updatedAt: serverTimestamp() // Set updated timestamp automatically
    };
    
    return setDoc(logDocRef, payload, { merge: true });
  }
}
