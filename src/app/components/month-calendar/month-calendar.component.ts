import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  dateStr: string;
  day: number;
  isToday: boolean;
  status: 'clean' | 'ripped' | 'none' | 'future';
  mood?: string;
}

@Component({
  selector: 'app-month-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './month-calendar.component.html',
  styleUrl: './month-calendar.component.scss'
})
export class MonthCalendarComponent implements OnChanges {
  @Input() logs: { [dateStr: string]: { partook: boolean | null, mood?: string } } = {};
  @Input() selectedDateStr: string = '';
  @Output() daySelected = new EventEmitter<string>();

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: (CalendarDay | null)[] = [];
  monthLabel: string = '';

  ngOnChanges() {
    this.buildCalendar();
  }

  buildCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const todayStr = this.formatDate(today);

    this.monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (CalendarDay | null)[] = [];

    // Fill leading empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const logValue = this.logs[dateStr];

      let status: CalendarDay['status'];
      let mood: string | undefined;

      if (isFuture) {
        status = 'future';
      } else if (logValue) {
        if (logValue.partook === false) {
          status = 'clean';
        } else if (logValue.partook === true) {
          status = 'ripped';
        } else {
          status = 'none';
        }
        mood = logValue.mood;
      } else {
        status = 'none';
      }

      days.push({ dateStr, day: d, isToday, status, mood });
    }

    this.calendarDays = days;
  }

  formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  selectDay(dayObj: CalendarDay | null) {
    if (!dayObj || dayObj.status === 'future') return;
    this.daySelected.emit(dayObj.dateStr);
  }
}
