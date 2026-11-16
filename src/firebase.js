import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB0NLaYHleMWhXKkngfU1hIsoyBWvis9-I',
  authDomain: 'tradetrack-3cdb8.firebaseapp.com',
  projectId: 'tradetrack-3cdb8',
  storageBucket: 'tradetrack-3cdb8.firebasestorage.app',
  messagingSenderId: '283197113861',
  appId: '1:283197113861:web:6b862f974a1d8d602c3e6c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const login = () => signInWithPopup(auth, new GoogleAuthProvider());
export const logout = () => signOut(auth);
