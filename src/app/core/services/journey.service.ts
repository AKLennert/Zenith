import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  collectionData,
  addDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, timer, combineLatest, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

export interface Quest {
  id?: string;
  userId: string;
  name: string;
  durationDays: number;
  startDate: Timestamp;
}

export interface QuestProgress {
  quest: Quest;
  totalElapsedSeconds: number;
  daysElapsed: number;
  hoursElapsed: number;
  minutesElapsed: number;
  secondsElapsed: number;
  progressPercent: number;
  isComplete: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class JourneyService {
  private firestore: Firestore = inject(Firestore);

  /** Stream of the user's active quests from Firestore. Returns the first/latest one. */
  getActiveQuest(userId: string): Observable<Quest | null> {
    const questsRef = collection(this.firestore, 'quests');
    const q = query(questsRef, where('userId', '==', userId));
    return (collectionData(q, { idField: 'id' }) as Observable<Quest[]>).pipe(
      map((quests) => (quests && quests.length > 0 ? quests[0] : null)),
    );
  }

  /** Combines the quest with a 1-second timer to produce live-updating progress. */
  getLiveProgress(userId: string): Observable<QuestProgress | null> {
    return this.getActiveQuest(userId).pipe(
      switchMap((quest) => {
        if (!quest) return of(null);
        return timer(0, 1000).pipe(
          map(() => this.calculateProgress(quest)),
        );
      }),
    );
  }

  private calculateProgress(quest: Quest): QuestProgress {
    const startDate = quest.startDate.toDate();
    const now = new Date();
    const totalElapsedSeconds = Math.floor(
      (now.getTime() - startDate.getTime()) / 1000,
    );

    const daysElapsed = Math.floor(totalElapsedSeconds / 86400);
    const remaining = totalElapsedSeconds % 86400;
    const hoursElapsed = Math.floor(remaining / 3600);
    const minutesElapsed = Math.floor((remaining % 3600) / 60);
    const secondsElapsed = remaining % 60;

    const totalQuestSeconds = quest.durationDays * 86400;
    const progressPercent = Math.min(
      100,
      Math.round((totalElapsedSeconds / totalQuestSeconds) * 100),
    );

    return {
      quest,
      totalElapsedSeconds,
      daysElapsed,
      hoursElapsed,
      minutesElapsed,
      secondsElapsed,
      progressPercent,
      isComplete: progressPercent >= 100,
    };
  }

  /** Creates a new quest document in Firestore. */
  async createQuest(
    userId: string,
    name: string,
    durationDays: number,
    startDate: Date,
  ): Promise<void> {
    const questsRef = collection(this.firestore, 'quests');
    await addDoc(questsRef, {
      userId,
      name,
      durationDays,
      startDate: Timestamp.fromDate(startDate),
    });
  }

  /** Helper: creates a demo Clear30 quest starting N days ago for testing. */
  async createMockQuest(userId: string, daysAgo: number = 7): Promise<void> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);
    await this.createQuest(userId, 'Clear30', 30, startDate);
  }
}
