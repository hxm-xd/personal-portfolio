// Firebase Configuration
// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA48faYVm5GpZrD_oPNnjFfwO4hmeXz7B0",
  authDomain: "personal-portfolio-de316.firebaseapp.com",
  projectId: "personal-portfolio-de316",
  storageBucket: "personal-portfolio-de316.firebasestorage.app",
  messagingSenderId: "537969276209",
  appId: "1:537969276209:web:1b730632fd3fa489126c10"
};

// Wait for Firebase to be available
function initializeFirebase() {
  if (typeof firebase !== 'undefined') {
    try {
      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      
      // Log Firebase configuration for debugging
      console.log('Firebase initialized with project:', firebaseConfig.projectId);
      
      // Initialize Firebase services
      const db = firebase.firestore();
      const auth = firebase.auth();
      const storage = firebase.storage();
      
      // Export for use in other files
      window.db = db;
      window.auth = auth;
      window.storage = storage;
      
      console.log('Firebase services initialized successfully');
      
      // Dispatch custom event to notify that Firebase is ready
      window.dispatchEvent(new CustomEvent('firebaseReady'));
      
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  } else {
    console.log('Firebase not loaded yet, retrying in 100ms...');
    setTimeout(initializeFirebase, 100);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
  initializeFirebase();
}


