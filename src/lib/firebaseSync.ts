import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to seed if empty
async function seedCollectionIfEmpty<T extends { id?: string | number; nip?: string; nis?: string }>(
  collectionName: string,
  defaultData: T[],
  getId: (item: T) => string
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      console.log(`Seeding collection ${collectionName} with default data...`);
      for (const item of defaultData) {
        const id = getId(item);
        await setDoc(doc(db, collectionName, id), item as any);
      }
      return defaultData;
    } else {
      const data: T[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as T);
      });
      return data;
    }
  } catch (error) {
    console.error(`Error syncing collection ${collectionName}:`, error);
    return defaultData;
  }
}

// 1. Teachers Sync
export async function getTeachersSync(defaultTeachers: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('teachers', defaultTeachers, (item) => item.nip);
}

export async function saveTeacherSync(teacher: any): Promise<void> {
  await setDoc(doc(db, 'teachers', teacher.nip), teacher);
}

export async function deleteTeacherSync(nip: string): Promise<void> {
  await deleteDoc(doc(db, 'teachers', nip));
}

// 2. Students Sync
export async function getStudentsSync(defaultStudents: any[]): Promise<any[]> {
  return seedCollectionIfEmpty('students', defaultStudents, (item) => item.nis);
}

export async function saveStudentSync(student: any): Promise<void> {
  await setDoc(doc(db, 'students', student.nis), student);
}

export async function deleteStudentSync(nis: string): Promise<void> {
  await deleteDoc(doc(db, 'students', nis));
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
