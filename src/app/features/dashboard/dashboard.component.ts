import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService, UserProfile } from '../../core/services/user-profile.service';
import { JourneyService, QuestProgress } from '../../core/services/journey.service';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private journeyService = inject(JourneyService);
  private router = inject(Router);

  userProfile: UserProfile | null = null;
  isLoading = true;
  isCreatingQuest = false;

  questProgress$: Observable<QuestProgress | null> | null = null;
  private authSub: Subscription | null = null;

  readonly timeUnits = [
    { key: 'hoursElapsed', label: 'Hours', icon: '⏳' },
    { key: 'minutesElapsed', label: 'Minutes', icon: '🕐' },
    { key: 'secondsElapsed', label: 'Seconds', icon: '✨' },
  ] as const;

  ngOnInit() {
    this.authSub = this.authService.user$.subscribe(async (user) => {
      if (user) {
        this.userProfile = await this.userProfileService.getUserProfile(user.uid);
        this.questProgress$ = this.journeyService.getLiveProgress(user.uid);
      }
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  async beginMockQuest(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    this.isCreatingQuest = true;
    try {
      await this.journeyService.createMockQuest(user.uid, 7);
    } finally {
      this.isCreatingQuest = false;
    }
  }

  /** Returns a decimal fill value (0–1) capped to the unit's max. */
  getFillPercent(unit: 'hoursElapsed' | 'minutesElapsed' | 'secondsElapsed', progress: QuestProgress): number {
    const maxes = { hoursElapsed: 24, minutesElapsed: 60, secondsElapsed: 60 };
    return Math.min(progress[unit] / maxes[unit], 1);
  }

  formatPad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
