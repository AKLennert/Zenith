import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DailyLogService, DailyLog } from '../../core/services/daily-log.service';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-daily-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './daily-log.component.html',
  styleUrls: ['./daily-log.component.scss']
})
export class DailyLogComponent implements OnInit, OnDestroy {
  private dailyLogService = inject(DailyLogService);
  private authService = inject(AuthService);
  
  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<void>();

  currentUser: User | null = null;
  dates: Date[] = [];
  selectedDate!: Date;
  selectedDateStr: string = '';
  
  // Current log state
  currentLog: Partial<DailyLog> = { partook: null, journal: '', mood: '' };
  isLoading = false;

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user) {
         this.loadLogForSelectedDate();
      }
    });

    this.generateDateCarousel();

    // Auto-save debounce
    this.saveSubject$.pipe(
      takeUntil(this.destroy$),
      debounceTime(1000)
    ).subscribe(() => {
      this.saveCurrentLog();
    });
  }

  generateDateCarousel() {
    const today = new Date();
    this.selectedDate = today;
    this.selectedDateStr = this.formatDate(today);

    // Generate last 7 days
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
    if (this.formatDate(date) === this.formatDate(new Date())) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  getDisplayDate(date: Date): string {
     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.selectedDateStr = this.formatDate(date);
    this.currentLog = { partook: null, journal: '', mood: '' }; // Reset before load
    this.loadLogForSelectedDate();
  }

  loadLogForSelectedDate() {
    if (!this.currentUser) return;
    
    this.isLoading = true;
    this.dailyLogService.getLogByDate(this.currentUser.uid, this.selectedDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe(log => {
        if (log) {
          this.currentLog = { ...log };
        } else {
          // Initialize empty state for this date
          this.currentLog = { partook: null, journal: '', mood: '' };
        }
        this.isLoading = false;
      });
  }

  togglePartook(value: boolean) {
    this.currentLog.partook = value;
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
      await this.dailyLogService.saveLog(
        this.currentUser.uid,
        this.selectedDateStr,
        {
          date: this.selectedDateStr,
          partook: this.currentLog.partook,
          mood: this.currentLog.mood,
          journal: this.currentLog.journal
        }
      );
    } catch (e) {
      console.error('Error saving log', e);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
