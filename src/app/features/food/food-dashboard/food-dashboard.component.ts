import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';
import { FoodLogService, DailyFoodLog, FoodItem } from '../../../core/services/food-log.service';

@Component({
  selector: 'app-food-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './food-dashboard.component.html',
  styleUrl: './food-dashboard.component.scss'
})
export class FoodDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private foodLogService = inject(FoodLogService);
  private router = inject(Router);

  isLoading = true;
  profile: UserProfile | null = null;
  needsSetup = false;
  
  // Setup Form
  setupData = {
    weight: 70, // kg
    height: 170, // cm
    age: 25,
    gender: 'male' as 'male' | 'female',
    activityLevel: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'
  };

  // Daily Log
  todayStr = new Date().toISOString().split('T')[0];
  dailyLog: DailyFoodLog = {
    date: this.todayStr,
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    medicine: []
  };

  // Calculation
  totalConsumed = 0;
  totalProtein = 0;
  totalCarbs = 0;
  totalFats = 0;

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadProfile(user.uid);
      } else {
        this.isLoading = false;
      }
    });
  }

  async loadProfile(uid: string) {
    this.isLoading = true;
    this.profile = await this.userProfileService.getUserProfile(uid);
    if (!this.profile || !this.profile.maintenanceCalories) {
      this.needsSetup = true;
    } else {
      this.needsSetup = false;
      await this.loadDailyLog();
    }
    this.isLoading = false;
  }

  async loadDailyLog() {
    const log = await this.foodLogService.getLogByDate(this.todayStr);
    if (log) {
      this.dailyLog = log;
    }
    this.calculateTotals();
  }

  calculateTotals() {
    this.totalConsumed = 0;
    this.totalProtein = 0;
    this.totalCarbs = 0;
    this.totalFats = 0;

    const allItems = [
      ...this.dailyLog.breakfast,
      ...this.dailyLog.lunch,
      ...this.dailyLog.dinner,
      ...this.dailyLog.snacks
    ];

    for (let item of allItems) {
      this.totalConsumed += item.calories;
      this.totalProtein += item.protein;
      this.totalCarbs += item.carbs;
      this.totalFats += item.fats;
    }
  }

  calculateMaintenance(): number {
    // Mifflin-St Jeor Equation
    // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    let bmr = (10 * this.setupData.weight) + (6.25 * this.setupData.height) - (5 * this.setupData.age);
    bmr += this.setupData.gender === 'male' ? 5 : -161;

    let multiplier = 1.2;
    switch(this.setupData.activityLevel) {
      case 'sedentary': multiplier = 1.2; break;
      case 'lightly_active': multiplier = 1.375; break;
      case 'moderately_active': multiplier = 1.55; break;
      case 'very_active': multiplier = 1.725; break;
      case 'extra_active': multiplier = 1.9; break;
    }
    return Math.round(bmr * multiplier);
  }

  async finishSetup() {
    if (!this.profile) return;
    
    const cals = this.calculateMaintenance();
    
    const updates: Partial<UserProfile> = {
      weight: this.setupData.weight,
      height: this.setupData.height,
      age: this.setupData.age,
      gender: this.setupData.gender,
      activityLevel: this.setupData.activityLevel,
      maintenanceCalories: cals
    };

    await this.userProfileService.updateUserProfile(this.profile.uid, updates);
    this.profile = { ...this.profile, ...updates };
    this.needsSetup = false;
    await this.loadDailyLog();
  }

  addFood(mealType: string) {
    this.router.navigate(['/food/add', mealType]);
  }

  getMealTotal(items: FoodItem[]): number {
    return items.reduce((sum, current) => sum + current.calories, 0);
  }
}
