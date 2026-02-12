import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyChqxs-gx2t_TzsBKpinQvZgreVJ45Ug2g",
    authDomain: "edem-worship.firebaseapp.com",
    projectId: "edem-worship",
    storageBucket: "edem-worship.firebasestorage.app",
    messagingSenderId: "1036129226457",
    appId: "1:1036129226457:web:a89fc71bf7d305ba2638c8"
};

const isConfigured = true;

let app;
let dbExport;

if (isConfigured) {
    app = initializeApp(firebaseConfig);
    dbExport = getFirestore(app);

    // Enable offline persistence
    enableIndexedDbPersistence(dbExport).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Firebase persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Firebase persistence not supported in this browser');
        }
    });
} else {
    console.warn("Firebase not configured. Using local mode.");
    dbExport = null;
}

export const db = dbExport;
export const isFirebaseEnabled = isConfigured;
