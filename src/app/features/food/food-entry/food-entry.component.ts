import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FoodLogService, FoodItem, DailyFoodLog } from '../../../core/services/food-log.service';

@Component({
  selector: 'app-food-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './food-entry.component.html',
  styleUrl: './food-entry.component.scss'
})
export class FoodEntryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private foodLogService = inject(FoodLogService);

  mealType: string = 'snacks';
  isSaving = false;

  newItem: FoodItem = {
    id: '',
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const type = params.get('mealType');
      if (type) {
        this.mealType = type;
      }
    });
  }

  async saveItem() {
    if (!this.newItem.name || this.newItem.calories < 0) return;
    
    this.isSaving = true;
    this.newItem.id = Date.now().toString();
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    try {
      await this.foodLogService.addFoodItem(
        todayStr, 
        this.mealType as keyof Omit<DailyFoodLog, 'date'>, 
        { ...this.newItem }
      );
      this.router.navigate(['/food']);
    } catch (error) {
      console.error("Error saving food:", error);
      this.isSaving = false;
    }
  }

  goBack() {
    this.router.navigate(['/food']);
  }
}
