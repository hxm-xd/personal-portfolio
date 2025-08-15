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
// Set the correct region for Firestore
db.settings({
  region: 'nam5' // North America 5 region
});

const auth = firebase.auth();
const storage = firebase.storage();

// Export for use in other files
window.db = db;
window.auth = auth;
window.storage = storage;
