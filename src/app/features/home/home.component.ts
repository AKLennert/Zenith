import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyLogService, DailyLog } from '../../core/services/daily-log.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { AuthService } from '../../core/services/auth.service';
import { firstValueFrom, take } from 'rxjs';

export interface DaySummary {
  date: Date;
  dateString: string;
  dayName: string;
  dayNumber: number;
  journeyLogged: boolean;
  journalLogged: boolean;
  foodLogged: boolean;
  sleepLogged: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private dailyLogService = inject(DailyLogService);
  private foodLogService = inject(FoodLogService);
  private authService = inject(AuthService);

  weekDays = signal<DaySummary[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.authService.user$.pipe(take(1)).subscribe(async (user) => {
      if (!user) {
        this.isLoading.set(false);
        return;
      }
      
      const days = this.generateLast7Days();
      const summaries: DaySummary[] = [];

      for (const day of days) {
        const dateString = this.formatDate(day.date);
        
        // Fetch Daily Log
        const dailyLog$ = this.dailyLogService.getLogByDate(user.uid, dateString);
        let dailyLog: DailyLog | undefined;
        try {
          dailyLog = await firstValueFrom(dailyLog$);
        } catch (e) {
          dailyLog = undefined;
        }
        
        // Fetch Food Log
        let foodLog = null;
        try {
          foodLog = await this.foodLogService.getLogByDate(dateString);
        } catch (e) {
          foodLog = null;
        }

        let journeyLogged = false;
        let journalLogged = false;
        let foodLogged = false;

        if (dailyLog) {
          journeyLogged = dailyLog.partook !== null && dailyLog.partook !== undefined;
          journalLogged = !!dailyLog.mood || !!dailyLog.journal;
        }

        if (foodLog) {
          const totalFoodItems = [
            ...(foodLog.breakfast || []), 
            ...(foodLog.lunch || []), 
            ...(foodLog.dinner || []), 
            ...(foodLog.snacks || []),
            ...(foodLog.medicine || [])
          ].length;
          foodLogged = totalFoodItems > 0;
        }

        summaries.push({
          date: day.date,
          dateString,
          dayName: day.dayName,
          dayNumber: day.date.getDate(),
          journeyLogged,
          journalLogged,
          foodLogged,
          sleepLogged: false, // Placeholder for future sleep tracking
          isToday: day.isToday
        });
      }

      this.weekDays.set(summaries);
      this.isLoading.set(false);
    });
  }

  private generateLast7Days() {
    const days = [];
    const today = new Date();
    // Generate chronological: 6 days ago up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isToday = i === 0;
      days.push({
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday
      });
    }
    return days;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
