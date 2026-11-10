// firebase-config.js

// Konfigurasi Firebase Tryout TKA Online
const firebaseConfig = {
    apiKey: "AIzaSyAk4SgTso8ZjPdyNRNL07OZ1JIxKQlJ1Ok",
    authDomain: "lms-tka-18e1e.firebaseapp.com",
    projectId: "lms-tka-18e1e",
    storageBucket: "lms-tka-18e1e.firebasestorage.app",
    messagingSenderId: "530605119207",
    appId: "1:530605119207:web:f80317e0e00da03fe4f442",
    measurementId: "G-GE5H0MLLTJ"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Inisialisasi Firestore (Database)
const db = firebase.firestore();