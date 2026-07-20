/**
 * MODULE SINKRONISASI GOOGLE SHEETS VIA GOOGLE APPS SCRIPT (GAS)
 * 
 * Sistem ini menggunakan Google Sheets secara langsung sebagai database utama.
 * Menyediakan sinkronisasi hibrida: local-first (menyimpan di localStorage secara instan)
 * dan cloud-sync (menyinkronkan ke Google Sheets di latar belakang secara asinkron).
 */

// Mendapatkan URL Apps Script dari localStorage atau Pengaturan Sistem
export function getAppsScriptUrl(): string {
  // 1. Coba ambil dari Environment Variable (Sangat direkomendasikan untuk Vercel / Netlify)
  const envUrl = import.meta.env.VITE_APPS_SCRIPT_URL;
  if (envUrl) return envUrl;

  let localUrl = localStorage.getItem('appsScriptUrl');
  if (localUrl && (
    localUrl.includes('AKfycbyulNiQG-YcSXqe1SyaaQbfEg32BaNcdt7IaaNAY-DL2dZhhujnfjYMiYFy0Fwlc7M4sA') ||
    localUrl.includes('AKfycbz3jk_at9mWRFJ2Vmu7uSbR8mhAPAoTTYQToWCn42PbX_XZ583zZDdLahc5eS_2_GK3')
  )) {
    localUrl = null;
    localStorage.removeItem('appsScriptUrl');
  }
  if (localUrl) return localUrl;
  
  try {
    const settingsStr = localStorage.getItem('absensi_systemSettings');
    if (settingsStr) {
      const settingsList = JSON.parse(settingsStr);
      const settings = settingsList[0] || settingsList;
      if (settings && settings.appsScriptUrl) {
        if (
          settings.appsScriptUrl.includes('AKfycbyulNiQG-YcSXqe1SyaaQbfEg32BaNcdt7IaaNAY-DL2dZhhujnfjYMiYFy0Fwlc7M4sA') ||
          settings.appsScriptUrl.includes('AKfycbz3jk_at9mWRFJ2Vmu7uSbR8mhAPAoTTYQToWCn42PbX_XZ583zZDdLahc5eS_2_GK3')
        ) {
          settings.appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyJDEN5WXWQli5I919-3mcN5GoCzO4DRDMcTyEQSIHwZa8MZiKe25wPTXuriRPVtYlJ/exec';
          localStorage.setItem('absensi_systemSettings', JSON.stringify([settings]));
        } else {
          return settings.appsScriptUrl;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return 'https://script.google.com/macros/s/AKfycbyJDEN5WXWQli5I919-3mcN5GoCzO4DRDMcTyEQSIHwZa8MZiKe25wPTXuriRPVtYlJ/exec';
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

// Helper untuk menyinkronkan data dari awan secara aman (melindungi data lokal jika awan kosong)
function safeSyncCollection(key: string, cloudItems: any[]): void {
  if (!cloudItems) return;
  const localItems = getLocalCache(key, []);
  // Jika di awan ada data, ATAU jika di lokal belum ada data sama sekali, aman untuk memperbarui cache lokal
  if (cloudItems.length > 0 || localItems.length === 0) {
    saveLocalCache(key, cloudItems);
  } else {
    console.log(`Menjaga data lokal untuk [${key}] karena data awan kosong.`);
  }
}

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
      
      // Sinkronisasikan setiap tabel secara aman
      safeSyncCollection('teachers', allData.teachers);
      safeSyncCollection('students', allData.students);
      safeSyncCollection('studentRecords', allData.studentRecords);
      safeSyncCollection('teachingSessions', allData.teachingSessions);
      safeSyncCollection('izinRequests', allData.izinRequests);
      safeSyncCollection('teachingSchedule', allData.teachingSchedule);
      safeSyncCollection('attendanceRecords', allData.attendanceRecords);
      safeSyncCollection('holidays', allData.holidays);
      safeSyncCollection('piketSchedule', allData.piketSchedule);
      safeSyncCollection('classSubstitutions', allData.classSubstitutions);
      
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
          const cachedList = getLocalCache('systemSettings', []);
          const cachedSettings = cachedList[0] || cachedList;
          if (!cachedSettings || Object.keys(cachedSettings).length === 0) {
            saveLocalCache('systemSettings', [settings]);
          } else {
            // Gabungkan secara cerdas, dahulukan nilai dari Sheets yang aktif
            const merged = { ...cachedSettings, ...settings };
            saveLocalCache('systemSettings', [merged]);
          }
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

/**
 * Mengunggah semua data lokal yang ada di localStorage ke Google Sheets secara manual.
 * Berguna saat pertama kali menghubungkan Google Sheets agar data lokal tidak hilang dan langsung terisi di lembar bentang.
 */
export async function uploadAllLocalDataToGoogleSheets(onProgress?: (msg: string) => void): Promise<boolean> {
  const collections = [
    { key: 'teachers', name: 'Daftar Guru' },
    { key: 'students', name: 'Daftar Siswa' },
    { key: 'studentRecords', name: 'Presensi Siswa' },
    { key: 'teachingSessions', name: 'Sesi Mengajar KBM' },
    { key: 'izinRequests', name: 'Pengajuan Izin' },
    { key: 'teachingSchedule', name: 'Jadwal Mengajar' },
    { key: 'attendanceRecords', name: 'Presensi Guru' },
    { key: 'holidays', name: 'Kalender Akademik' },
    { key: 'piketSchedule', name: 'Jadwal Guru Piket' },
    { key: 'classSubstitutions', name: 'Substitusi Kelas' }
  ];

  try {
    for (const col of collections) {
      if (onProgress) {
        onProgress(`Mengunggah data: ${col.name}...`);
      }
      const data = getLocalCache(col.key, []);
      console.log(`Mengunggah batch untuk koleksi ${col.key}... (${data.length} item)`);
      const res = await callAppsScript({
        action: 'saveBatch',
        collection: col.key,
        data: data
      });
      if (!res || res.status !== 'success') {
        console.warn(`Gagal mengunggah koleksi ${col.key}:`, res);
        if (onProgress) {
          onProgress(`Gagal mengunggah ${col.name}. Periksa koneksi Anda.`);
        }
        return false;
      }
    }
    
    // Juga unggah pengaturan sistem jika ada
    if (onProgress) {
      onProgress('Mengunggah Pengaturan Sistem...');
    }
    const cachedList = getLocalCache('systemSettings', []);
    const cachedSettings = cachedList[0] || cachedList;
    if (cachedSettings && Object.keys(cachedSettings).length > 0) {
      const flatSettings = Object.keys(cachedSettings).map(key => {
        let val = cachedSettings[key];
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
          if (key === 'latitude' || key === 'longitude') {
            val = val.trim().replace(',', '.');
          }
        }
        return {
          kunci: key,
          nilai: val
        };
      });
      const res = await callAppsScript({
        action: 'saveSettings',
        data: flatSettings
      });
      if (!res || res.status !== 'success') {
        console.warn(`Gagal mengunggah pengaturan sistem:`, res);
        if (onProgress) {
          onProgress('Gagal mengunggah Pengaturan Sistem.');
        }
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Gagal mengunggah data lokal ke Google Sheets:', error);
    if (onProgress) {
      onProgress('Terjadi kesalahan saat mengunggah data.');
    }
    return false;
  }
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
  const currentList = getLocalCache('teachers', []);
  const mergedList = [...currentList];
  teachers.forEach(t => {
    const idx = mergedList.findIndex(existing => existing.nip === t.nip);
    if (idx >= 0) {
      mergedList[idx] = t;
    } else {
      mergedList.push(t);
    }
  });
  saveLocalCache('teachers', mergedList);
  
  callAppsScript({
    action: 'saveBatch',
    collection: 'teachers',
    data: mergedList
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
  const currentList = getLocalCache('students', []);
  const mergedList = [...currentList];
  students.forEach(s => {
    const idx = mergedList.findIndex(existing => existing.nis === s.nis);
    if (idx >= 0) {
      mergedList[idx] = s;
    } else {
      mergedList.push(s);
    }
  });
  saveLocalCache('students', mergedList);
  
  callAppsScript({
    action: 'saveBatch',
    collection: 'students',
    data: mergedList
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
    if (
      !merged.appsScriptUrl ||
      merged.appsScriptUrl.includes('AKfycbyulNiQG-YcSXqe1SyaaQbfEg32BaNcdt7IaaNAY-DL2dZhhujnfjYMiYFy0Fwlc7M4sA') ||
      merged.appsScriptUrl.includes('AKfycbz3jk_at9mWRFJ2Vmu7uSbR8mhAPAoTTYQToWCn42PbX_XZ583zZDdLahc5eS_2_GK3')
    ) {
      merged.appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyJDEN5WXWQli5I919-3mcN5GoCzO4DRDMcTyEQSIHwZa8MZiKe25wPTXuriRPVtYlJ/exec';
    }
    
    // Normalisasi koordinat, angka, dan boolean dari spreadsheet / cache lokal
    if (merged.latitude !== undefined) {
      merged.latitude = String(merged.latitude).trim().replace(',', '.');
    }
    if (merged.longitude !== undefined) {
      merged.longitude = String(merged.longitude).trim().replace(',', '.');
    }
    if (merged.maxRadius !== undefined) {
      merged.maxRadius = parseInt(String(merged.maxRadius).replace(',', '.')) || defaultSettings.maxRadius;
    }
    if (merged.lateTolerance !== undefined) {
      merged.lateTolerance = parseInt(String(merged.lateTolerance).replace(',', '.')) || defaultSettings.lateTolerance;
    }
    if (merged.waGatewayEnabled !== undefined) {
      merged.waGatewayEnabled = String(merged.waGatewayEnabled) === 'true';
    }
    if (merged.waAdminNotificationsEnabled !== undefined) {
      merged.waAdminNotificationsEnabled = String(merged.waAdminNotificationsEnabled) === 'true';
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
  const flatSettings = Object.keys(settings).map(key => {
    let val = settings[key];
    if (typeof val === 'object') {
      val = JSON.stringify(val);
    } else {
      val = String(val);
      // Ganti koma dengan titik untuk latitude/longitude agar tersimpan dengan format standar
      if (key === 'latitude' || key === 'longitude') {
        val = val.trim().replace(',', '.');
      }
    }
    return {
      kunci: key,
      nilai: val
    };
  });

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
