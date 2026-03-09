import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private router = inject(Router);

  isLoginMode = true;
  authForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  constructor() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = null;
    this.authForm.reset();
  }

  async onSubmit() {
    if (this.authForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.authForm.value;

    try {
      if (this.isLoginMode) {
        await this.authService.loginWithEmail(email, password);
      } else {
        const cred = await this.authService.registerWithEmail(email, password);
        // Create a default profile document for new wizards
        await this.userProfileService.createUserProfile({
          uid: cred.user.uid,
          email: cred.user.email,
          house: 'Unsorted',
          theme: 'dark'
        });
      }
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    this.errorMessage = null;
    try {
      const cred = await this.authService.loginWithGoogle();
      // Check if profile exists, if not create one
      const existingProfile = await this.userProfileService.getUserProfile(cred.user.uid);
      if (!existingProfile) {
         await this.userProfileService.createUserProfile({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          house: 'Unsorted',
          theme: 'dark'
        });
      }
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }
}
