import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sleep-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sleep-placeholder.component.html',
  styleUrl: './sleep-placeholder.component.scss'
})
export class SleepPlaceholderComponent {
  private router = inject(Router);

  goBack() {
    this.router.navigate(['/home']);
  }
}
