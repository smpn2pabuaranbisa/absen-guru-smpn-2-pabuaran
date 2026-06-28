import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPtzUCG8u7dumadbctT92OMgN_TsO_5lI",
  authDomain: "gen-lang-client-0693468791.firebaseapp.com",
  projectId: "gen-lang-client-0693468791",
  storageBucket: "gen-lang-client-0693468791.firebasestorage.app",
  messagingSenderId: "348533821771",
  appId: "1:348533821771:web:c897e1c0b76505623518ce"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific non-default databaseId as the third argument
export const db = initializeFirestore(app, {}, "ai-studio-copyofabsensigur-e555e497-08a9-4618-b30f-e76dd5f2da65");
