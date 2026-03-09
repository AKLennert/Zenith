// Copy this file to environment.ts and fill in your Firebase project values.
// NEVER commit environment.ts — it is listed in .gitignore.
// Get these values from: Firebase Console → Project Settings → Your Apps

export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  }
};
