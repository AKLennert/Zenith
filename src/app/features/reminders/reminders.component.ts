import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RemindersService, Reminder } from '../../core/services/reminders.service';
import { AuthService } from '../../core/services/auth.service';
import { Subject, takeUntil, Subscription } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminders.component.html',
  styleUrl: './reminders.component.scss'
})
export class RemindersComponent implements OnInit, OnDestroy {
  private remindersService = inject(RemindersService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private remindersSub: Subscription | null = null;

  currentUser: User | null = null;
  dates: Date[] = [];
  selectedDate!: Date;
  selectedDateStr: string = '';
  
  reminders: Reminder[] = [];
  newReminderText: string = '';
  isLoading = false;

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user && this.selectedDateStr) {
        this.loadReminders();
      }
    });

    this.generateDateCarousel();
  }

  generateDateCarousel() {
    const today = new Date();
    // Generate dates: Today, Tomorrow, ... +5 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      this.dates.push(d);
    }
    
    // Default select Tomorrow (index 1) 
    this.selectDate(this.dates[1]);
  }

  formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getDisplayDay(date: Date): string {
    const todayStr = this.formatDate(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = this.formatDate(tomorrow);
    
    const dateStr = this.formatDate(date);
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tmrw';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  getDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.selectedDateStr = this.formatDate(date);
    this.loadReminders();
  }

  loadReminders() {
    if (!this.currentUser) return;
    this.isLoading = true;
    
    this.remindersSub?.unsubscribe();
    this.remindersSub = this.remindersService.getRemindersByDate(this.currentUser.uid, this.selectedDateStr)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Sort: incomplete first, then complete
        this.reminders = data.sort((a, b) => {
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        });
        this.isLoading = false;
      });
  }

  async addReminder() {
    const text = this.newReminderText.trim();
    if (!text || !this.currentUser) return;
    
    this.newReminderText = ''; // Optimistic clear
    try {
      await this.remindersService.addReminder(this.currentUser.uid, this.selectedDateStr, text);
    } catch (e) {
      console.error('Error adding reminder', e);
      this.newReminderText = text; // Restore on error
    }
  }

  async toggleCompletion(reminder: Reminder) {
    if (!this.currentUser || !reminder.id) return;
    
    const newStatus = !reminder.completed;
    try {
      await this.remindersService.updateReminder(this.currentUser.uid, reminder.id, { completed: newStatus });
    } catch (e) {
      console.error('Error toggling reminder', e);
    }
  }

  async deleteReminder(reminder: Reminder) {
    if (!this.currentUser || !reminder.id) return;
    
    try {
      await this.remindersService.deleteReminder(this.currentUser.uid, reminder.id);
    } catch (e) {
      console.error('Error deleting reminder', e);
    }
  }

  ngOnDestroy() {
    this.remindersSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
