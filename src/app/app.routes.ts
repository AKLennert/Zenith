import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'journal',
    loadComponent: () => import('./features/journal/journal.component').then(m => m.JournalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'food',
    loadComponent: () => import('./features/food/food-dashboard/food-dashboard.component').then(m => m.FoodDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'food/add/:mealType',
    loadComponent: () => import('./features/food/food-entry/food-entry.component').then(m => m.FoodEntryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sleep',
    loadComponent: () => import('./features/sleep/sleep-placeholder/sleep-placeholder.component').then(m => m.SleepPlaceholderComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
