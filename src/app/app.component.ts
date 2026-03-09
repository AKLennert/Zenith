import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { WeekDateSelectorComponent } from './components/week-date-selector/week-date-selector.component';
import { PillToggleComponent } from './components/pill-toggle/pill-toggle.component';
import { DashboardCardComponent } from './components/dashboard-card/dashboard-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    BottomNavComponent,
    WeekDateSelectorComponent,
    PillToggleComponent,
    DashboardCardComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'zenith';
}
