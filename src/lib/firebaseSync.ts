/**
 * MODULE SINKRONISASI GOOGLE SHEETS VIA GOOGLE APPS SCRIPT (GAS)
 * 
 * Sistem ini menggantikan Firebase Firestore dengan Google Sheets secara langsung.
 * Menyediakan sinkronisasi hibrida: local-first (menyimpan di localStorage secara instan)
 * dan cloud-sync (menyinkronkan ke Google Sheets di latar belakang secara asinkron).
 */

// Mendapatkan URL Apps Script dari localStorage atau Pengaturan Sistem
export function getAppsScriptUrl(): string {
  const localUrl = localStorage.getItem('appsScriptUrl');
  if (localUrl) return localUrl;
  
  try {
    const settingsStr = localStorage.getItem('absensi_systemSettings');
    if (settingsStr) {
      const settingsList = JSON.parse(settingsStr);
      const settings = settingsList[0] || settingsList;
      if (settings && settings.appsScriptUrl) {
        return settings.appsScriptUrl;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'https://script.google.com/macros/s/AKfycbyulNiQG-YcSXqe1SyaaQbfEg32BaNcdt7IaaNAY-DL2dZhhujnfjYMiYFy0Fwlc7M4sA/exec';
}

// Fungsi pembantu untuk memanggil API Google Apps Script secara asinkron
async function callAppsScript(payload: any): Promise<any> {
  const url = getAppsScriptUrl();
  if (!url) return null;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Menghindari isu preflight CORS di beberapa server GAS
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } catch (error) {
    console.warn('Google Sheets sync request failed:', error);
    return null;
  }
}

// Helper Cache Lokal (localStorage)
function getLocalCache<T>(key: string, defaultValue: T[]): T[] {
  try {
    const data = localStorage.getItem(`absensi_${key}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn(`Gagal membaca cache lokal untuk ${key}:`, e);
  }
  saveLocalCache(key, defaultValue);
  return defaultValue;
}

function saveLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`absensi_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Gagal menulis cache lokal untuk ${key}:`, e);
  }
}

// Pencatat status apakah inisiasi sinkronisasi penuh sudah selesai
let isInitialSyncDone = false;

/**
 * Melakukan sinkronisasi penuh dengan Google Sheets di awal aplikasi dimuat.
 * Mengambil seluruh koleksi data sekaligus dalam satu request (SANGAT CEPAT!)
 * lalu memperbarui cache lokal localStorage agar performa aplikasi sangat mulus.
 */
export async function initialSyncWithGoogleSheets(): Promise<boolean> {
  const url = getAppsScriptUrl();
  if (!url) {
    console.log('Google Sheets URL tidak dikonfigurasi. Berjalan dalam mode Local Cache.');
    return false;
  }
  if (isInitialSyncDone) return true;
  
  try {
    console.log('Memulai sinkronisasi awal penuh dengan Google Sheets...');
    const result = await callAppsScript({ action: 'getAll' });
    if (result && result.status === 'success' && result.data) {
      const allData = result.data;
      if (allData.teachers) saveLocalCache('teachers', allData.teachers);
      if (allData.students) saveLocalCache('students', allData.students);
      if (allData.studentRecords) saveLocalCache('studentRecords', allData.studentRecords);
      if (allData.teachingSessions) saveLocalCache('teachingSessions', allData.teachingSessions);
      if (allData.izinRequests) saveLocalCache('izinRequests', allData.izinRequests);
      if (allData.teachingSchedule) saveLocalCache('teachingSchedule', allData.teachingSchedule);
      if (allData.attendanceRecords) saveLocalCache('attendanceRecords', allData.attendanceRecords);
      if (allData.holidays) saveLocalCache('holidays', allData.holidays);
      if (allData.piketSchedule) saveLocalCache('piketSchedule', allData.piketSchedule);
      if (allData.classSubstitutions) saveLocalCache('classSubstitutions', allData.classSubstitutions);
      
      if (allData.systemSettings) {
        // Gabungkan kembali pengaturan dari Google Sheets
        const settings: any = {};
        allData.systemSettings.forEach((item: any) => {
          try {
            settings[item.kunci] = JSON.parse(item.nilai);
          } catch (e) {
            settings[item.kunci] = item.nilai;
          }
        });
        if (Object.keys(settings).length > 0) {
          saveLocalCache('systemSettings', [settings]);
        }
      }
      isInitialSyncDone = true;
      console.log('Sinkronisasi penuh Google Sheets berhasil!');
      return true;
    }
  } catch (error) {
    console.warn('Gagal melakukan sinkronisasi awal penuh:', error);
  }
  return false;
}

// 1. Sinkronisasi Data Guru
export async function getTeachersSync(defaultTeachers: any[]): Promise<any[]> {
  return getLocalCache('teachers', defaultTeachers);
}

export async function saveTeacherSync(teacher: any): Promise<void> {
  const list = getLocalCache('teachers', []);
  const index = list.findIndex(t => t.nip === teacher.nip);
  if (index >= 0) {
    list[index] = teacher;
  } else {
    list.push(teacher);
  }
  saveLocalCache('teachers', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'teachers',
    key: 'nip',
    data: teacher
  });
}

export async function saveTeachersSyncBatch(teachers: any[]): Promise<void> {
  saveLocalCache('teachers', teachers);
  callAppsScript({
    action: 'saveBatch',
    collection: 'teachers',
    data: teachers
  });
}

export async function deleteTeacherSync(nip: string): Promise<void> {
  const list = getLocalCache('teachers', []);
  const filtered = list.filter(t => t.nip !== nip);
  saveLocalCache('teachers', filtered);
  
  callAppsScript({
    action: 'deleteItem',
    collection: 'teachers',
    key: 'nip',
    id: nip
  });
}

// 2. Sinkronisasi Data Siswa
export async function getStudentsSync(defaultStudents: any[]): Promise<any[]> {
  return getLocalCache('students', defaultStudents);
}

export async function saveStudentSync(student: any): Promise<void> {
  const list = getLocalCache('students', []);
  const index = list.findIndex(s => s.nis === student.nis);
  if (index >= 0) {
    list[index] = student;
  } else {
    list.push(student);
  }
  saveLocalCache('students', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'students',
    key: 'nis',
    data: student
  });
}

export async function saveStudentsSyncBatch(students: any[]): Promise<void> {
  saveLocalCache('students', students);
  callAppsScript({
    action: 'saveBatch',
    collection: 'students',
    data: students
  });
}

export async function deleteStudentSync(nis: string): Promise<void> {
  const list = getLocalCache('students', []);
  const filtered = list.filter(s => s.nis !== nis);
  saveLocalCache('students', filtered);
  
  callAppsScript({
    action: 'deleteItem',
    collection: 'students',
    key: 'nis',
    id: nis
  });
}

// 3. Sinkronisasi Presensi Barcode Siswa (Scan Presensi)
export async function getStudentRecordsSync(defaultRecords: any[]): Promise<any[]> {
  return getLocalCache('studentRecords', defaultRecords);
}

export async function saveStudentRecordSync(record: any): Promise<void> {
  const list = getLocalCache('studentRecords', []);
  const index = list.findIndex(r => r.id === record.id);
  if (index >= 0) {
    list[index] = record;
  } else {
    list.push(record);
  }
  saveLocalCache('studentRecords', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'studentRecords',
    key: 'id',
    data: record
  });
}

// 4. Sinkronisasi Sesi Mengajar Hari Ini (KBM Hari Ini)
export async function getTeachingSessionsSync(defaultSessions: any[]): Promise<any[]> {
  return getLocalCache('teachingSessions', defaultSessions);
}

export async function saveTeachingSessionSync(session: any): Promise<void> {
  const list = getLocalCache('teachingSessions', []);
  const index = list.findIndex(s => s.id === session.id);
  if (index >= 0) {
    list[index] = session;
  } else {
    list.push(session);
  }
  saveLocalCache('teachingSessions', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'teachingSessions',
    key: 'id',
    data: session
  });
}

// 5. Sinkronisasi Surat Pengajuan Izin
export async function getIzinRequestsSync(defaultRequests: any[]): Promise<any[]> {
  return getLocalCache('izinRequests', defaultRequests);
}

export async function saveIzinRequestSync(request: any): Promise<void> {
  const list = getLocalCache('izinRequests', []);
  const index = list.findIndex(r => r.id === request.id);
  if (index >= 0) {
    list[index] = request;
  } else {
    list.push(request);
  }
  saveLocalCache('izinRequests', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'izinRequests',
    key: 'id',
    data: request
  });
}

// 6. Sinkronisasi Jadwal Mengajar Guru
export async function getTeachingScheduleSync(defaultSchedule: any[]): Promise<any[]> {
  return getLocalCache('teachingSchedule', defaultSchedule);
}

export async function saveTeachingScheduleSync(schedule: any): Promise<void> {
  const list = getLocalCache('teachingSchedule', []);
  const index = list.findIndex(s => s.id === schedule.id);
  if (index >= 0) {
    list[index] = schedule;
  } else {
    list.push(schedule);
  }
  saveLocalCache('teachingSchedule', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'teachingSchedule',
    key: 'id',
    data: schedule
  });
}

export async function deleteTeachingScheduleSync(id: string | number): Promise<void> {
  const list = getLocalCache('teachingSchedule', []);
  const filtered = list.filter(s => String(s.id) !== String(id));
  saveLocalCache('teachingSchedule', filtered);
  
  callAppsScript({
    action: 'deleteItem',
    collection: 'teachingSchedule',
    key: 'id',
    id: String(id)
  });
}

// 7. Sinkronisasi Presensi Datang/Pulang Guru
export async function getAttendanceRecordsSync(): Promise<any[]> {
  return getLocalCache('attendanceRecords', []);
}

export async function saveAttendanceRecordSync(record: any): Promise<void> {
  const list = getLocalCache('attendanceRecords', []);
  const index = list.findIndex(r => r.id === record.id);
  if (index >= 0) {
    list[index] = record;
  } else {
    list.push(record);
  }
  saveLocalCache('attendanceRecords', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'attendanceRecords',
    key: 'id',
    data: record
  });
}

// 8. Pembersihan Koleksi Data
export async function clearCollectionSync(collectionName: string): Promise<void> {
  saveLocalCache(collectionName, []);
  
  callAppsScript({
    action: 'clearCollection',
    collection: collectionName
  });
}

// 9. Kalender Akademik (Hari Libur)
export async function getHolidaysSync(): Promise<any[]> {
  return getLocalCache('holidays', []);
}

export async function saveHolidaySync(holiday: any): Promise<void> {
  const list = getLocalCache('holidays', []);
  const index = list.findIndex(h => h.id === holiday.id);
  if (index >= 0) {
    list[index] = holiday;
  } else {
    list.push(holiday);
  }
  saveLocalCache('holidays', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'holidays',
    key: 'id',
    data: holiday
  });
}

export async function deleteHolidaySync(id: string): Promise<void> {
  const list = getLocalCache('holidays', []);
  const filtered = list.filter(h => h.id !== id);
  saveLocalCache('holidays', filtered);
  
  callAppsScript({
    action: 'deleteItem',
    collection: 'holidays',
    key: 'id',
    id: id
  });
}

// 10. Pengaturan Sistem
export async function getSystemSettingsSync(defaultSettings: any): Promise<any> {
  const cachedList = getLocalCache('systemSettings', []);
  const cachedSettings = cachedList[0] || cachedList;
  if (cachedSettings && Object.keys(cachedSettings).length > 0) {
    const merged = { ...defaultSettings, ...cachedSettings };
    if (!merged.appsScriptUrl) {
      merged.appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyulNiQG-YcSXqe1SyaaQbfEg32BaNcdt7IaaNAY-DL2dZhhujnfjYMiYFy0Fwlc7M4sA/exec';
    }
    return merged;
  }
  return defaultSettings;
}

export async function saveSystemSettingsSync(settings: any): Promise<void> {
  saveLocalCache('systemSettings', [settings]);
  
  // Update langsung URL Google Apps Script ke top-level localStorage agar pencarian URL instan
  if (settings.appsScriptUrl) {
    localStorage.setItem('appsScriptUrl', settings.appsScriptUrl);
  } else {
    localStorage.removeItem('appsScriptUrl');
  }

  // Format ke pasangan Kunci-Nilai untuk lembar bentang Google Sheets
  const flatSettings = Object.keys(settings).map(key => ({
    kunci: key,
    nilai: typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : String(settings[key])
  }));

  callAppsScript({
    action: 'saveSettings',
    data: flatSettings
  });
}

// 11. Jadwal Piket
export async function getPiketScheduleSync(defaultSchedule: any[]): Promise<any[]> {
  return getLocalCache('piketSchedule', defaultSchedule);
}

export async function savePiketScheduleSync(piketDay: any): Promise<void> {
  const list = getLocalCache('piketSchedule', []);
  const index = list.findIndex(p => p.id === piketDay.id);
  if (index >= 0) {
    list[index] = piketDay;
  } else {
    list.push(piketDay);
  }
  saveLocalCache('piketSchedule', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'piketSchedule',
    key: 'id',
    data: piketDay
  });
}

// 12. Substitusi Kelas / Inval
export async function getClassSubstitutionsSync(): Promise<any[]> {
  return getLocalCache('classSubstitutions', []);
}

export async function saveClassSubstitutionSync(substitution: any): Promise<void> {
  const list = getLocalCache('classSubstitutions', []);
  const index = list.findIndex(s => s.id === substitution.id);
  if (index >= 0) {
    list[index] = substitution;
  } else {
    list.push(substitution);
  }
  saveLocalCache('classSubstitutions', list);
  
  callAppsScript({
    action: 'saveItem',
    collection: 'classSubstitutions',
    key: 'id',
    data: substitution
  });
}

export async function deleteClassSubstitutionSync(id: string): Promise<void> {
  const list = getLocalCache('classSubstitutions', []);
  const filtered = list.filter(s => s.id !== id);
  saveLocalCache('classSubstitutions', filtered);
  
  callAppsScript({
    action: 'deleteItem',
    collection: 'classSubstitutions',
    key: 'id',
    id: id
  });
}
