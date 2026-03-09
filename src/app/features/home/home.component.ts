import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyLogService, DailyLog } from '../../core/services/daily-log.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { MonthCalendarComponent } from '../../components/month-calendar/month-calendar.component';
import { PartookSliderComponent } from '../../components/partook-slider/partook-slider.component';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { User } from 'firebase/auth';
import { collection, query, getDocs, Firestore, where } from '@angular/fire/firestore';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashboardComponent,
    MonthCalendarComponent,
    PartookSliderComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private dailyLogService = inject(DailyLogService);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<void>();

  currentUser: User | null = null;
  dates: Date[] = [];
  selectedDate!: Date;
  selectedDateStr: string = '';

  currentLog: Partial<DailyLog> = { partook: null, journal: '', mood: '' };
  monthLogs: { [dateStr: string]: boolean | null } = {};
  isLoading = false;
  isSaving = false;

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadLogForSelectedDate();
        this.loadMonthLogs();
      }
    });

    this.generateDateCarousel();

    this.saveSubject$.pipe(
      takeUntil(this.destroy$),
      debounceTime(1000)
    ).subscribe(() => this.saveCurrentLog());
  }

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
    // Scroll week carousel to include this date if possible
  }

  loadLogForSelectedDate() {
    if (!this.currentUser) return;
    this.isLoading = true;
    this.dailyLogService.getLogByDate(this.currentUser.uid, this.selectedDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe(log => {
        this.currentLog = log ? { ...log } : { partook: null, journal: '', mood: '' };
        this.isLoading = false;
      });
  }

  async loadMonthLogs() {
    if (!this.currentUser) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    try {
      const logsRef = collection(this.firestore, `users/${this.currentUser.uid}/daily_logs`);
      const q = query(logsRef, where('date', '>=', startStr), where('date', '<=', endStr));
      const snap = await getDocs(q);
      const map: { [dateStr: string]: boolean | null } = {};
      snap.forEach(doc => {
        const data = doc.data() as DailyLog;
        map[doc.id] = data.partook ?? null;
      });
      this.monthLogs = map;
    } catch (e) {
      console.error('Error loading month logs', e);
    }
  }

  onPartookChange(value: boolean | null) {
    this.currentLog.partook = value;
    // Update monthLogs immediately for responsive calendar
    this.monthLogs = { ...this.monthLogs, [this.selectedDateStr]: value };
    this.triggerSave();
  }

  onJournalChange() {
    this.triggerSave();
  }

  triggerSave() {
    this.saveSubject$.next();
  }

  async saveCurrentLog() {
    if (!this.currentUser) return;
    try {
      this.isSaving = true;
      await this.dailyLogService.saveLog(this.currentUser.uid, this.selectedDateStr, {
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
