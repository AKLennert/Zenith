import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService, UserProfile } from '../../core/services/user-profile.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);

  profile: UserProfile | null = null;
  isLoading = true;
  isSaving = false;

  async ngOnInit() {
    this.authService.user$.subscribe(async user => {
      if (user) {
        this.profile = await this.userProfileService.getUserProfile(user.uid);
        if (!this.profile) {
          // If no profile exists, initialize a minimum one
          this.profile = { 
            uid: user.uid, 
            email: user.email,
            dailyReminder: false,
            defaultQuestDuration: 7
          };
        } else {
          // Set defaults if they don't exist
          this.profile.dailyReminder = this.profile.dailyReminder ?? false;
          this.profile.defaultQuestDuration = this.profile.defaultQuestDuration ?? 7;
        }
      }
      this.isLoading = false;
    });
  }

  async saveProfile() {
    if (!this.profile) return;
    this.isSaving = true;
    try {
      await this.userProfileService.updateUserProfile(this.profile.uid, {
        displayName: this.profile.displayName,
        dailyReminder: this.profile.dailyReminder,
        defaultQuestDuration: this.profile.defaultQuestDuration
      });
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      this.isSaving = false;
    }
  }

  async exportData() {
    // In a real app, this would generate a JSON or CSV of the user's logs
    alert("Data export magical scroll generation is under construction!");
  }

  async deleteAccount() {
    if (confirm("Are you sure you want to banish your account into the void? This cannot be undone.")) {
      // Logic to delete Firebase Auth user and Firestore data goes here
      alert("Account deletion banishing ritual is under construction.");
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
