import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAPtzUCG8u7dumadbctT92OMgN_TsO_5lI",
  authDomain: "gen-lang-client-0693468791.firebaseapp.com",
  projectId: "gen-lang-client-0693468791",
  storageBucket: "gen-lang-client-0693468791.firebasestorage.app",
  messagingSenderId: "348533821771",
  appId: "1:348533821771:web:c897e1c0b76505623518ce"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore. We use memoryLocalCache() instead of persistentLocalCache()
// to avoid IndexedDB corruption or permission blocks within the sandboxed iframe preview,
// which cause the "Cannot read properties of undefined (reading 'approximateByteSize')" error.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: memoryLocalCache()
}, "absensi-db-v2");


