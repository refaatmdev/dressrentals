import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
    // TODO: Replace with actual config from Firebase Console
    apiKey: "AIzaSyD2vdyBQHGeXziphSjb0kIICXucrAaiuII",
    authDomain: "remamulla.firebaseapp.com",
    databaseURL: "https://remamulla-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "remamulla",
    storageBucket: "remamulla.firebasestorage.app",
    messagingSenderId: "334887945046",
    appId: "1:334887945046:web:3d521a5b10604c07664cf7",
    measurementId: "G-EJKQFGBYJJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
