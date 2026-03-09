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
          this.profile = { uid: user.uid, email: user.email, house: 'Unsorted' };
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
        house: this.profile.house,
        favoriteSpell: this.profile.favoriteSpell
      });
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      this.isSaving = false;
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
