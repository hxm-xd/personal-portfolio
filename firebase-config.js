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

// Initialize Firebase services
const db = firebase.firestore();

// Configure Firestore with more robust settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  merge: true
});

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
    
    // If it's an unavailable error, try to enable network
    if (error.code === 'unavailable') {
      console.log('Firebase unavailable, attempting to enable network...');
      try {
        await db.enableNetwork();
        console.log('Firebase network enabled');
        return true;
      } catch (networkError) {
        console.error('Failed to enable Firebase network:', networkError);
        return false;
      }
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
    
    // Ensure auth is properly initialized
    await auth.authStateReady();
    console.log('Firebase auth initialized successfully');
    
    // Run connection test
    await testFirebaseConnection();
    
    console.log('Firebase initialization complete');
    
    // Dispatch custom event to notify that Firebase is ready
    window.dispatchEvent(new CustomEvent('firebaseReady'));
    
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
}

// Start initialization
initializeFirebase();
