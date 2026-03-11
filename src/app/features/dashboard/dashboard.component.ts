import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService, UserProfile } from '../../core/services/user-profile.service';
import { JourneyService, QuestProgress } from '../../core/services/journey.service';
import { DailyLogService, DailyLog } from '../../core/services/daily-log.service';
import { MonthCalendarComponent } from '../../components/month-calendar/month-calendar.component';
import { PartookSliderComponent } from '../../components/partook-slider/partook-slider.component';
import { Observable, Subscription, Subject, takeUntil, debounceTime } from 'rxjs';
import { collection, query, getDocs, Firestore, where } from '@angular/fire/firestore';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MonthCalendarComponent, 
    PartookSliderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private journeyService = inject(JourneyService);
  private dailyLogService = inject(DailyLogService);
  private firestore = inject(Firestore);

  userProfile: UserProfile | null = null;
  isLoading = true;
  isCreatingQuest = false;

  questProgress$: Observable<QuestProgress | null> | null = null;
  private authSub: Subscription | null = null;
  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<void>();

  // Check-In vars
  dates: Date[] = [];
  selectedDate!: Date;
  selectedDateStr: string = '';
  currentLog: Partial<DailyLog> = { partook: null, journal: '', mood: '' };
  monthLogs: { [dateStr: string]: { partook: boolean | null, mood?: string } } = {};
  isSaving = false;

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
        
        this.loadLogForSelectedDate();
        this.loadMonthLogs();
      }
      this.isLoading = false;
    });

    this.generateDateCarousel();

    this.saveSubject$.pipe(
      takeUntil(this.destroy$),
      debounceTime(1000)
    ).subscribe(() => this.saveCurrentLog());
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Mock Quest Logic ---
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

  // --- Check-in Logic from Home ---

  generateDateCarousel() {
    const today = new Date();
    this.selectedDate = today;
    this.selectedDateStr = this.formatDate(today);
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      this.dates.push(d);
    }
  }

  formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getDisplayDay(date: Date): string {
    if (this.formatDate(date) === this.formatDate(new Date())) return 'Today';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.selectedDateStr = this.formatDate(date);
    this.currentLog = { partook: null, journal: '', mood: '' };
    this.loadLogForSelectedDate();
  }

  onDaySelectedFromCalendar(dateStr: string) {
    const parts = dateStr.split('-');
    const date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    this.selectDate(date);
  }

  loadLogForSelectedDate() {
    const user = this.authService.currentUser;
    if (!user) return;
    this.dailyLogService.getLogByDate(user.uid, this.selectedDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe(log => {
        this.currentLog = log ? { ...log } : { partook: null, journal: '', mood: '' };
      });
  }

  async loadMonthLogs() {
    const user = this.authService.currentUser;
    if (!user) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      const logsRef = collection(this.firestore, `users/${user.uid}/daily_logs`);
      const q = query(logsRef, where('date', '>=', startStr), where('date', '<=', endStr));
      const snap = await getDocs(q);
      const map: { [dateStr: string]: { partook: boolean | null, mood?: string } } = {};
      snap.forEach(doc => {
        const data = doc.data() as DailyLog;
        map[doc.id] = { partook: data.partook ?? null, mood: data.mood };
      });
      this.monthLogs = map;
    } catch (e) {
      console.error('Error loading month logs', e);
    }
  }

  onPartookChange(value: boolean | null) {
    this.currentLog.partook = value;
    this.monthLogs = { ...this.monthLogs, [this.selectedDateStr]: { partook: value, mood: this.currentLog.mood } };
    this.triggerSave();
  }

  triggerSave() {
    this.saveSubject$.next();
  }

  async saveCurrentLog() {
    const user = this.authService.currentUser;
    if (!user) return;
    try {
      this.isSaving = true;
      await this.dailyLogService.saveLog(user.uid, this.selectedDateStr, {
        date: this.selectedDateStr,
        partook: this.currentLog.partook,
        mood: this.currentLog.mood,
        journal: this.currentLog.journal
      });
    } catch (e) {
      console.error('Error saving log', e);
    } finally {
      this.isSaving = false;
    }
  }
}
