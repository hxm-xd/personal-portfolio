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


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Log Firebase configuration for debugging
console.log('Firebase initialized with project:', firebaseConfig.projectId);

// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Test Firebase connection on initialization
async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test basic connectivity
    const testDoc = await db.collection('_test').doc('connection').get();
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.warn('Firebase connection test failed:', error.message);
    
    // If it's a permissions error, that's actually good - it means we can connect
    if (error.code === 'permission-denied') {
      console.log('Firebase connection successful (permission denied is expected for test collection)');
      return true;
    }
    
    // If it's an unavailable error, log it but don't try to enable network
    if (error.code === 'unavailable') {
      console.log('Firebase unavailable, but continuing...');
      return false;
    }
    
    return false;
  }
}

// Export for use in other files
window.db = db;
window.auth = auth;
window.storage = storage;
window.testFirebaseConnection = testFirebaseConnection;

// Initialize Firebase services and run connection test
async function initializeFirebase() {
  try {
    console.log('Initializing Firebase services...');
    
    // Simple initialization without authStateReady for now
    console.log('Firebase services initialized');
    
    // Dispatch custom event to notify that Firebase is ready
    window.dispatchEvent(new CustomEvent('firebaseReady'));
    
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    // Still dispatch event even if there's an error
    window.dispatchEvent(new CustomEvent('firebaseReady'));
  }
}

// Start initialization
initializeFirebase();
