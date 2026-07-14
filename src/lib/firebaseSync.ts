import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to sync collection
async function seedCollectionIfEmpty<T extends { id?: string | number; nip?: string; nis?: string }>(
  collectionName: string,
  defaultData: T[],
  getId: (item: T) => string
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is empty. Returning empty list.`);
      return [];
    } else {
      const data: T[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as T);
      });
      return data;
    }
  } catch (error) {
    console.error(`Error syncing collection ${collectionName}:`, error);
    return [];
  }
}

// 1. Teachers Sync
export async function getTeachersSync(defaultTeachers: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('teachers', defaultTeachers, (item) => item.nip);
}

export async function saveTeacherSync(teacher: any): Promise<void> {
  const docId = String(teacher.nip).replace(/\//g, '_');
  await setDoc(doc(db, 'teachers', docId), teacher);
}

export async function saveTeachersSyncBatch(teachers: any[]): Promise<void> {
  const chunkSize = 500;
  for (let i = 0; i < teachers.length; i += chunkSize) {
    const chunk = teachers.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(teacher => {
      const docId = String(teacher.nip).replace(/\//g, '_');
      const docRef = doc(db, 'teachers', docId);
      batch.set(docRef, teacher);
    });
    await batch.commit();
  }
}

export async function deleteTeacherSync(nip: string): Promise<void> {
  const docId = String(nip).replace(/\//g, '_');
  await deleteDoc(doc(db, 'teachers', docId));
}

// 2. Students Sync
export async function getStudentsSync(defaultStudents: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('students', defaultStudents, (item) => item.nis);
}

export async function saveStudentSync(student: any): Promise<void> {
  const docId = String(student.nis).replace(/\//g, '_');
  await setDoc(doc(db, 'students', docId), student);
}

export async function saveStudentsSyncBatch(students: any[]): Promise<void> {
  const chunkSize = 500;
  for (let i = 0; i < students.length; i += chunkSize) {
    const chunk = students.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(student => {
      const docId = String(student.nis).replace(/\//g, '_');
      const docRef = doc(db, 'students', docId);
      batch.set(docRef, student);
    });
    await batch.commit();
  }
}

export async function deleteStudentSync(nis: string): Promise<void> {
  const docId = String(nis).replace(/\//g, '_');
  await deleteDoc(doc(db, 'students', docId));
}

// 3. Student Records Sync (Scan Presensi)
export async function getStudentRecordsSync(defaultRecords: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('studentRecords', defaultRecords, (item) => item.id);
}

export async function saveStudentRecordSync(record: any): Promise<void> {
  await setDoc(doc(db, 'studentRecords', record.id), record);
}

// 4. Teaching Sessions Today Sync
export async function getTeachingSessionsSync(defaultSessions: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('teachingSessions', defaultSessions, (item) => item.id);
}

export async function saveTeachingSessionSync(session: any): Promise<void> {
  await setDoc(doc(db, 'teachingSessions', session.id), session);
}

// 5. Izin Requests Sync
export async function getIzinRequestsSync(defaultRequests: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('izinRequests', defaultRequests, (item) => item.id);
}

export async function saveIzinRequestSync(request: any): Promise<void> {
  await setDoc(doc(db, 'izinRequests', request.id), request);
}

// 6. Teaching Schedule Sync
export async function getTeachingScheduleSync(defaultSchedule: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('teachingSchedule', defaultSchedule, (item) => String(item.id));
}

export async function saveTeachingScheduleSync(schedule: any): Promise<void> {
  await setDoc(doc(db, 'teachingSchedule', String(schedule.id)), schedule);
}

export async function deleteTeachingScheduleSync(id: string | number): Promise<void> {
  await deleteDoc(doc(db, 'teachingSchedule', String(id)));
}

// 7. Teacher Attendance Records Sync (Absen Datang/Pulang)
export async function getAttendanceRecordsSync(): Promise<any[]> {
  try {
    const colRef = collection(db, 'attendanceRecords');
    const snapshot = await getDocs(colRef);
    const data: any[] = [];
    snapshot.forEach((doc) => {
      data.push(doc.data());
    });
    return data;
  } catch (error) {
    console.error('Error getting attendance records:', error);
    return [];
  }
}

export async function saveAttendanceRecordSync(record: any): Promise<void> {
  await setDoc(doc(db, 'attendanceRecords', record.id), record);
}

export async function clearCollectionSync(collectionName: string): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error(`Error clearing collection ${collectionName}:`, error);
    throw error;
  }
}

// 9. Academic Calendar (Holidays) Sync
export async function getHolidaysSync(): Promise<any[]> {
  try {
    const colRef = collection(db, 'holidays');
    const snapshot = await getDocs(colRef);
    const data: any[] = [];
    snapshot.forEach((doc) => {
      data.push(doc.data());
    });
    return data;
  } catch (error) {
    console.error('Error getting holidays:', error);
    return [];
  }
}

export async function saveHolidaySync(holiday: any): Promise<void> {
  await setDoc(doc(db, 'holidays', holiday.id), holiday);
}

export async function deleteHolidaySync(id: string): Promise<void> {
  await deleteDoc(doc(db, 'holidays', id));
}

export async function getSystemSettingsSync(defaultSettings: any): Promise<any> {
  try {
    const docRef = doc(db, 'systemSettings', 'school');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultSettings, ...docSnap.data() };
    } else {
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting system settings:', error);
    return defaultSettings;
  }
}

export async function saveSystemSettingsSync(settings: any): Promise<void> {
  try {
    await setDoc(doc(db, 'systemSettings', 'school'), settings);
  } catch (error) {
    console.error('Error saving system settings:', error);
  }
}

// 10. Piket Schedule Sync
export async function getPiketScheduleSync(defaultSchedule: any[]): Promise<any[]> {
  try {
    const colRef = collection(db, 'piketSchedule');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      // If empty, let's seed it with the default schedule
      for (const item of defaultSchedule) {
        await setDoc(doc(db, 'piketSchedule', item.id), item);
      }
      return defaultSchedule;
    } else {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data());
      });
      return data;
    }
  } catch (error) {
    console.error('Error getting piket schedule:', error);
    return defaultSchedule;
  }
}

export async function savePiketScheduleSync(piketDay: any): Promise<void> {
  await setDoc(doc(db, 'piketSchedule', piketDay.id), piketDay);
}

// 11. Class Substitution Sync
export async function getClassSubstitutionsSync(): Promise<any[]> {
  try {
    const colRef = collection(db, 'classSubstitutions');
    const snapshot = await getDocs(colRef);
    const data: any[] = [];
    snapshot.forEach((doc) => {
      data.push(doc.data());
    });
    return data;
  } catch (error) {
    console.error('Error getting class substitutions:', error);
    return [];
  }
}

export async function saveClassSubstitutionSync(substitution: any): Promise<void> {
  await setDoc(doc(db, 'classSubstitutions', substitution.id), substitution);
}

export async function deleteClassSubstitutionSync(id: string): Promise<void> {
  await deleteDoc(doc(db, 'classSubstitutions', id));
}
