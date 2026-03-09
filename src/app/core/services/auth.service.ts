import { Injectable, inject } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  
  // Expose the raw authState observable
  readonly user$ = authState(this.auth);

  // Example convenience signal/subject if needed
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.user$.subscribe(user => {
      this.currentUserSubject.next(user);
    });
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async loginWithEmail(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  async registerWithEmail(email: string, pass: string) {
    return createUserWithEmailAndPassword(this.auth, email, pass);
  }

  async loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async logout() {
    return signOut(this.auth);
  }
}
