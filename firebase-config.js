// Firebase Configuration for EduMind
// ✅ CONFIGURED - Project: edumind-e85cf

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDp4jn8u3mwx1s19BOJasIt_3LGo3auOeQ",
    authDomain: "edumind-e85cf.firebaseapp.com",
    projectId: "edumind-e85cf",
    storageBucket: "edumind-e85cf.firebasestorage.app",
    messagingSenderId: "696639298468",
    appId: "1:696639298468:web:f9cfbd925df967236e3f31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Export for use in app.js
export {
    auth,
    db,
    storage,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    googleProvider,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    ref,
    uploadBytes,
    getDownloadURL,
    listAll,
    deleteObject
};

console.log("✅ Firebase initialized");
