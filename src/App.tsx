import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  LogIn, LogOut, BookOpen, UserMinus, 
  CheckCircle2, Clock, User, Mail, Phone, MapPin, 
  LayoutDashboard, Bell, Search, Activity, Sparkles, Plus, Camera, X, Navigation,
  GraduationCap, ChevronDown, FileText, Coffee, Image as ImageIcon,
  Lock, Shield, QrCode, Users, Check, Trash2, Edit, AlertCircle, XCircle, Upload, Calendar, Download, FileSpreadsheet, Settings, Building, Hash, FolderDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getTeachersSync,
  saveTeacherSync,
  deleteTeacherSync,
  getStudentsSync,
  saveStudentSync,
  deleteStudentSync,
  getStudentRecordsSync,
  saveStudentRecordSync,
  getTeachingSessionsSync,
  saveTeachingSessionSync,
  getIzinRequestsSync,
  saveIzinRequestSync,
  getTeachingScheduleSync,
  saveTeachingScheduleSync,
  deleteTeachingScheduleSync,
  getAttendanceRecordsSync,
  saveAttendanceRecordSync
} from './lib/firebaseSync';

type AttendanceRecord = {
  id: string;
  type: string;
  date: string;
  time: string;
  color: string;
  bg: string;
  glow: string;
  iconName: string;
};

const attendanceButtons = [
  { id: 'datang', label: 'Absen Datang', icon: LogIn, iconName: 'LogIn', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', shadow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.4)]' },
  { id: 'pulang', label: 'Absen Pulang', icon: LogOut, iconName: 'LogOut', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', shadow: 'hover:shadow-[0_0_30px_rgba(251,113,133,0.3)]', glow: 'shadow-[0_0_15px_rgba(251,113,133,0.4)]' },
  { id: 'mengajar', label: 'Mulai Mengajar', icon: BookOpen, iconName: 'BookOpen', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', shadow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]' },
  { id: 'izin', label: 'Izin / Sakit', icon: UserMinus, iconName: 'UserMinus', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', shadow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.3)]', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.4)]' },
];

export default function App() {
  const [userRole, setUserRole] = useState<'guest' | 'guru' | 'siswa' | 'admin'>('guest');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Directory lists (Guru & Staff)
  const [teachers, setTeachers] = useState([
    { name: 'Tb. Saiful Bahri, S.Pd.', nip: '197601142005011004', role: 'Kepala Sekolah', mapel: 'PAI / Pembina', status: 'Aktif' },
    { name: 'Siti Aminah, M.Pd.', nip: '198203112009022003', role: 'Wakasek Kurikulum', mapel: 'Matematika', status: 'Aktif' },
    { name: 'Ahmad Fauzi, S.Pd.', nip: '198506152011011002', role: 'Guru Mapel', mapel: 'Bahasa Indonesia', status: 'Aktif' },
    { name: 'Dra. Herlina, M.Si.', nip: '197008121995032001', role: 'Guru Mapel', mapel: 'IPA', status: 'Aktif' },
    { name: 'Mulyadi, S.Kom.', nip: '198804102014021003', role: 'Staff Tata Usaha (TU)', mapel: 'Administrasi & Data', status: 'Aktif' },
    { name: 'Cecep Supriatna', nip: '199211052020081001', role: 'Penjaga Sekolah / OB', mapel: 'Sarana & Prasarana', status: 'Aktif' },
    { name: 'Suryana', nip: '198005122010041002', role: 'Petugas Keamanan (Satpam)', mapel: 'Keamanan Lingkungan', status: 'Aktif' },
  ]);

  const [students, setStudents] = useState([
    { name: 'Andi Wijaya', nis: '24001', kelas: 'VII - A', barcode: 'SIS-24001' },
    { name: 'Siti Rahma', nis: '24002', kelas: 'VII - A', barcode: 'SIS-24002' },
    { name: 'Rian Pratama', nis: '24003', kelas: 'VII - B', barcode: 'SIS-24003' },
    { name: 'Laras Hati', nis: '24004', kelas: 'VIII - A', barcode: 'SIS-24004' },
    { name: 'Bagus Sanjaya', nis: '24005', kelas: 'IX - C', barcode: 'SIS-24005' },
    { name: 'Dina Lestari', nis: '24006', kelas: 'VII - C', barcode: 'SIS-24006' },
    { name: 'Fahri Ramadhan', nis: '24007', kelas: 'VIII - B', barcode: 'SIS-24007' },
    { name: 'Gita Permata', nis: '24008', kelas: 'IX - A', barcode: 'SIS-24008' },
  ]);

  const [studentRecords, setStudentRecords] = useState([
    { id: 'sr1', name: 'Andi Wijaya', nis: '24001', kelas: 'VII - A', time: '07.12.04', status: 'Hadir' },
    { id: 'sr2', name: 'Siti Rahma', nis: '24002', kelas: 'VII - A', time: '07.15.19', status: 'Hadir' },
    { id: 'sr3', name: 'Laras Hati', nis: '24004', kelas: 'VIII - A', time: '07.28.55', status: 'Hadir' },
    { id: 'sr4', name: 'Fahri Ramadhan', nis: '24007', kelas: 'VIII - B', time: '07.42.10', status: 'Hadir' },
  ]);

  const [teachingSessionsToday, setTeachingSessionsToday] = useState([
    { id: 'ts1', name: 'Siti Aminah, M.Pd.', nip: '198203112009022003', mapel: 'Matematika', kelas: 'VIII - B', jam: '07.30 - 09.00', status: 'Selesai', timeStarted: '07.28.15', timeEnded: '09.00.00' },
    { id: 'ts2', name: 'Ahmad Fauzi, S.Pd.', nip: '198506152011011002', mapel: 'Bahasa Indonesia', kelas: 'VIII - A', jam: '09.15 - 10.45', status: 'Mengajar', timeStarted: '09.13.04', timeEnded: '-' },
    { id: 'ts3', name: 'Dra. Herlina, M.Si.', nip: '197008121995032001', mapel: 'IPA', kelas: 'IX - C', jam: '11.00 - 12.30', status: 'Belum Mulai', timeStarted: '-', timeEnded: '-' },
  ]);

  const [izinRequests, setIzinRequests] = useState([
    { id: 'iz1', name: 'Siti Aminah, M.Pd.', nip: '198203112009022003', tipe: 'Sakit', tanggalMulai: 'Senin, 29 Juni', tanggalSelesai: 'Selasa, 30 Juni', alasan: 'Sakit demam tinggi dan disarankan istirahat oleh dokter.', status: 'Pending', attachment: null },
    { id: 'iz2', name: 'Ahmad Fauzi, S.Pd.', nip: '198506152011011002', tipe: 'Dinas', tanggalMulai: 'Rabu, 01 Juli', tanggalSelesai: 'Rabu, 01 Juli', alasan: 'Mengikuti pelatihan kurikulum merdeka tingkat kabupaten.', status: 'Pending', attachment: null },
  ]);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [notification, setNotification] = useState<{ message: string; show: boolean; color: string }>({ message: '', show: false, color: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState<{ show: boolean; type: typeof attendanceButtons[0] | null }>({ show: false, type: null });
  const [location, setLocation] = useState<string>('Mencari lokasi...');
  const [nama, setNama] = useState('Tb. Saiful Bahri, S.Pd.');
  const [nip, setNip] = useState('197601142005011004');
  const [userJabatan, setUserJabatan] = useState('Kepala Sekolah');
  const isTeacherRole = userRole === 'admin' || (userJabatan === 'Guru Mapel' || userJabatan === 'Wakasek Kurikulum' || userJabatan === 'Kepala Sekolah');
  const [jamMulai, setJamMulai] = useState(() => {
    const now = new Date();
    const h = now.getHours();
    return `${String(h).padStart(2, '0')}.00`;
  });
  const [jamSelesai, setJamSelesai] = useState(() => {
    const now = new Date();
    const h = (now.getHours() + 2) % 24;
    return `${String(h).padStart(2, '0')}.00`;
  });
  const [ruangKelas, setRuangKelas] = useState('VII - A');
  const [mataPelajaran, setMataPelajaran] = useState('PAI');
  const [isSesiMengajarAktif, setIsSesiMengajarAktif] = useState(true);
  const [filterClassOnly, setFilterClassOnly] = useState(true);

  const isSessionTimeActive = () => {
    if (!isSesiMengajarAktif) return false;
    try {
      const now = currentTime;
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      const cleanJamSelesai = jamSelesai.replace(':', '.');
      const [endHourStr, endMinStr] = cleanJamSelesai.split('.');
      const endHour = parseInt(endHourStr, 10);
      const endMin = parseInt(endMinStr, 10);

      if (isNaN(endHour) || isNaN(endMin)) return true;

      if (currentHour > endHour) {
        return false;
      } else if (currentHour === endHour && currentMin >= endMin) {
        return false;
      }

      const cleanJamMulai = jamMulai.replace(':', '.');
      const [startHourStr, startMinStr] = cleanJamMulai.split('.');
      const startHour = parseInt(startHourStr, 10);
      const startMin = parseInt(startMinStr, 10);
      if (!isNaN(startHour) && !isNaN(startMin)) {
        if (currentHour < startHour) {
          return false;
        } else if (currentHour === startHour && currentMin < startMin) {
          return false;
        }
      }

      return true;
    } catch (e) {
      return true;
    }
  };
  const [izinType, setIzinType] = useState<'Izin' | 'Sakit' | 'Dinas'>('Izin');
  const [izinMulai, setIzinMulai] = useState('Senin, 29 Juni');
  const [izinSelesai, setIzinSelesai] = useState('Rabu, 01 Juli');
  const [izinAlasan, setIzinAlasan] = useState('');
  const [izinAttachment, setIzinAttachment] = useState<string | null>(null);
  
  // Schedule states
  const [teachingSchedule, setTeachingSchedule] = useState([
    { id: 1, day: 'Senin', time: '07:30 - 09:00', class: 'VII A', subject: 'Matematika' },
    { id: 2, day: 'Senin', time: '09:00 - 10:30', class: 'VIII B', subject: 'Matematika' },
    { id: 3, day: 'Senin', time: '11:00 - 12:30', class: 'IX C', subject: 'Matematika' },
    { id: 4, day: 'Selasa', time: '07:30 - 09:00', class: 'VIII A', subject: 'Matematika' },
    { id: 5, day: 'Rabu', time: '10:00 - 11:30', class: 'VII B', subject: 'Matematika' },
    { id: 6, day: 'Kamis', time: '08:30 - 10:00', class: 'IX A', subject: 'Matematika' },
    { id: 7, day: 'Jumat', time: '07:30 - 09:00', class: 'VIII C', subject: 'Matematika' }
  ]);
  const [scheduleDay, setScheduleDay] = useState('Senin');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{ id: number | null, day: string, time: string, class: string, subject: string }>({ id: null, day: 'Senin', time: '', class: '', subject: '' });

  // Class Attendance states
  const [selectedClassAttendance, setSelectedClassAttendance] = useState('VII A');
  const [attendanceDate, setAttendanceDate] = useState('2026-06-27');
  const [attendanceHistory] = useState([
    { id: 1, date: '2026-06-27', class: 'VII A', present: 28, absent: 2, sick: 1, permission: 1, total: 32 },
    { id: 2, date: '2026-06-26', class: 'VII A', present: 30, absent: 0, sick: 2, permission: 0, total: 32 },
    { id: 3, date: '2026-06-27', class: 'VIII B', present: 25, absent: 1, sick: 0, permission: 4, total: 30 }
  ]);
  const [teacherAttendanceHistory] = useState([
    { id: 1, date: '2026-06-27', time: '06:45', status: 'Hadir', location: 'Gerbang Utama' },
    { id: 2, date: '2026-06-26', time: '06:50', status: 'Hadir', location: 'Gerbang Utama' },
    { id: 3, date: '2026-06-25', time: '-', status: 'Sakit', location: '-' },
    { id: 4, date: '2026-06-24', time: '06:40', status: 'Hadir', location: 'Gerbang Utama' },
    { id: 5, date: '2026-06-23', time: '07:05', status: 'Terlambat', location: 'Gerbang Utama' },
  ]);
  const [classStudents] = useState([
    { name: 'Budi Santoso', nis: '24001', status: 'Hadir' },
    { name: 'Siti Aminah', nis: '24002', status: 'Sakit' },
    { name: 'Ahmad Faisal', nis: '24003', status: 'Hadir' },
    { name: 'Dewi Lestari', nis: '24004', status: 'Izin' },
    { name: 'Rudi Hermawan', nis: '24005', status: 'Alpa' },
  ]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Laporan Absensi Kelas ${selectedClassAttendance}`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Tanggal: ${attendanceDate}`, 14, 30);
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 36);

    const summary = attendanceHistory.find(h => h.class === selectedClassAttendance && h.date === attendanceDate);
    if (summary) {
      doc.text(`Hadir: ${summary.present} | Alpa: ${summary.absent} | Sakit: ${summary.sick} | Izin: ${summary.permission}`, 14, 44);
    }
    
    const tableColumn = ["No", "NIS", "Nama Siswa", "Status", "Waktu Absen"];
    const tableRows = classStudents.map((student, idx) => [
      (idx + 1).toString(),
      student.nis,
      student.name,
      student.status,
      student.status === 'Hadir' ? '07:15 AM' : '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY1 = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Pabuaran, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, finalY1 + 20);
    doc.text('Kepala Sekolah', 130, finalY1 + 28);
    doc.text('Drs. H. Ahmad Sunarya, M.Pd', 130, finalY1 + 50);
    doc.text('NIP. 196503121989021003', 130, finalY1 + 56);

    doc.save(`Rekap_Absensi_${selectedClassAttendance}_${attendanceDate}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = ['No', 'NIS', 'Nama Siswa', 'Status', 'Waktu Absen'];
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    classStudents.forEach((student, idx) => {
      const row = [
        idx + 1,
        student.nis,
        `"${student.name}"`,
        student.status,
        student.status === 'Hadir' ? '07:15 AM' : '-'
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Absensi_${selectedClassAttendance}_${attendanceDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMonthlyPDF = () => {
    const doc = new jsPDF();
    const month = new Date(attendanceDate).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    
    doc.setFontSize(16);
    doc.text(`Laporan Absensi Bulanan Kelas ${selectedClassAttendance}`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Bulan: ${month}`, 14, 30);
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 36);

    const tableColumn = ["No", "NIS", "Nama Siswa", "Hadir", "Sakit", "Izin", "Alpa", "Persentase"];
    const tableRows = classStudents.map((student, idx) => [
      (idx + 1).toString(),
      student.nis,
      student.name,
      student.status === 'Hadir' ? '22' : '20',
      student.status === 'Sakit' ? '1' : '0',
      student.status === 'Izin' ? '1' : '0',
      student.status === 'Alpa' ? '1' : '0',
      student.status === 'Hadir' ? '100%' : '90%'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY2 = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Pabuaran, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, finalY2 + 20);
    doc.text('Kepala Sekolah', 130, finalY2 + 28);
    doc.text('Drs. H. Ahmad Sunarya, M.Pd', 130, finalY2 + 50);
    doc.text('NIP. 196503121989021003', 130, finalY2 + 56);

    doc.save(`Rekap_Bulanan_${selectedClassAttendance}_${month.replace(' ', '_')}.pdf`);
  };

  const handleExportMonthlyExcel = () => {
    const month = new Date(attendanceDate).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const headers = ["No", "NIS", "Nama Siswa", "Hadir", "Sakit", "Izin", "Alpa", "Persentase Kehadiran"];
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    classStudents.forEach((student, idx) => {
      const row = [
        idx + 1,
        student.nis,
        `"${student.name}"`,
        student.status === 'Hadir' ? '22' : '20',
        student.status === 'Sakit' ? '1' : '0',
        student.status === 'Izin' ? '1' : '0',
        student.status === 'Alpa' ? '1' : '0',
        student.status === 'Hadir' ? '100%' : '90%'
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Bulanan_${selectedClassAttendance}_${month.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  // Student portal specific states
  const [selectedStudentCard, setSelectedStudentCard] = useState('24001');
  const [scannedStudent, setScannedStudent] = useState<typeof students[0] | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [manualNis, setManualNis] = useState('');
  const [isCameraScannerActive, setIsCameraScannerActive] = useState(false);
  const [cameraScannerError, setCameraScannerError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const startPromiseRef = useRef<Promise<any> | null>(null);
  const stopPromiseRef = useRef<Promise<any> | null>(null);
  const startTimeoutRef = useRef<any>(null);
  const scanTimeoutRef = useRef<any>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const fileInputGuruRef = useRef<HTMLInputElement>(null);
  const fileInputSiswaRef = useRef<HTMLInputElement>(null);

  // Admin specific states
  const [searchGuruQuery, setSearchGuruQuery] = useState('');
  const [searchSiswaQuery, setSearchSiswaQuery] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherNip, setNewTeacherNip] = useState('');
  const [newTeacherMapel, setNewTeacherMapel] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState('Guru Mapel');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNis, setNewStudentNis] = useState('');
  const [newStudentKelas, setNewStudentKelas] = useState('');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showStaffSelector, setShowStaffSelector] = useState(false);

  // Filter & Edit states for Admin "Daftar Guru & Siswa"
  const [filterGuruMapel, setFilterGuruMapel] = useState('');
  const [filterSiswaKelas, setFilterSiswaKelas] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  // Load initial data from Firebase on mount
  useEffect(() => {
    async function loadFirebaseData() {
      setIsLoading(true);
      try {
        const loadedTeachers = await getTeachersSync(teachers);
        setTeachers(loadedTeachers);

        const loadedStudents = await getStudentsSync(students);
        setStudents(loadedStudents);

        const loadedStudentRecords = await getStudentRecordsSync(studentRecords);
        setStudentRecords(loadedStudentRecords);

        const loadedSessions = await getTeachingSessionsSync(teachingSessionsToday);
        setTeachingSessionsToday(loadedSessions);

        const loadedIzinRequests = await getIzinRequestsSync(izinRequests);
        setIzinRequests(loadedIzinRequests);

        const loadedSchedule = await getTeachingScheduleSync(teachingSchedule);
        setTeachingSchedule(loadedSchedule);

        const loadedRecords = await getAttendanceRecordsSync();
        if (loadedRecords && loadedRecords.length > 0) {
          setRecords(loadedRecords);
        }
      } catch (err) {
        console.error("Failed to load Firebase data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFirebaseData();
  }, []);

  // Login Handlers
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const userLower = username.trim().toLowerCase();
    const passLower = password.trim().toLowerCase();

    if (userLower === 'admin' && passLower === 'admin') {
      setUserRole('admin');
      setActiveTab('analytics');
      showNotification('Berhasil masuk sebagai Administrator', 'text-purple-400');
    } else if (userLower === 'guru' && passLower === 'guru') {
      setUserRole('guru');
      setNama('Tb. Saiful Bahri, S.Pd.');
      setNip('197601142005011004');
      setUserJabatan('Kepala Sekolah');
      setActiveTab('dashboard');
      showNotification('Berhasil masuk sebagai Kepala Sekolah (Guru/Staff)', 'text-emerald-400');
    } else {
      setLoginError('Username atau password salah. Silakan periksa kembali kredensial Anda.');
    }
  };

  const handleQuickLogin = (role: 'guru' | 'admin') => {
    setLoginError('');
    setUsername('');
    setPassword('');
    setUserRole(role);
    if (role === 'admin') {
      setActiveTab('analytics');
      showNotification('Berhasil masuk sebagai Administrator', 'text-purple-400');
    } else if (role === 'guru') {
      setNama('Tb. Saiful Bahri, S.Pd.');
      setNip('197601142005011004');
      setUserJabatan('Kepala Sekolah');
      setActiveTab('dashboard');
      showNotification('Berhasil masuk sebagai Kepala Sekolah (Guru/Staff)', 'text-emerald-400');
    }
  };

  // Beep Audio Feedback for scanning simulation
  const playBeep = (type: 'success' | 'warning' | 'error' = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === 'success') {
        // High quality pleasant double-chime (ascending G5 to C6)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
        gain1.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.12);

        setTimeout(() => {
          try {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
            gain2.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.18);
          } catch (e) {}
        }, 80);
      } else if (type === 'warning') {
        // Two flat alert tones (warning already scanned)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gain1.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.1);

        setTimeout(() => {
          try {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
            gain2.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.1);
          } catch (e) {}
        }, 140);
      } else if (type === 'error') {
        // Dual-tone dissonant buzzer for "not found"
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        
        osc1.frequency.setValueAtTime(150, audioCtx.currentTime); 
        osc2.frequency.setValueAtTime(155, audioCtx.currentTime); // Dissonant beat frequency
        
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.3);
        osc2.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio feedback not supported', e);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', aspectRatio: 3/4 } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setCameraError("Akses kamera ditolak atau tidak tersedia.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setLocation('Lokasi tidak ditemukan');
        }
      );
    }
  };

  const openAttendanceModal = (btn: typeof attendanceButtons[0]) => {
    if (btn.id === 'datang' || btn.id === 'pulang' || btn.id === 'mengajar' || btn.id === 'izin') {
      setModalState({ show: true, type: btn });
      if (btn.id !== 'izin') {
        startCamera();
        getLocation();
      }
    } else {
      handleAttendance(btn);
    }
  };

  const closeAttendanceModal = () => {
    setModalState({ show: false, type: null });
    stopCamera();
    setLocation('Mencari lokasi...');
    setPhoto(null);
    setIzinAlasan('');
    setIzinAttachment(null);
  };

  const confirmAttendance = () => {
    if (modalState.type) {
      handleAttendance(modalState.type);
      closeAttendanceModal();
    }
  };

  // Simulate loading state on tab switch
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Auto-focus scan input when tab loading finishes
  useEffect(() => {
    if (!isLoading && activeTab === 'scan') {
      const focusTimer = setTimeout(() => {
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(focusTimer);
    }
  }, [isLoading, activeTab]);

  // Update live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAttendance = (btn: typeof attendanceButtons[0]) => {
    const now = new Date();
    
    const formattedDate = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const recordType = btn.id === 'mengajar' 
      ? `Mengajar Kelas ${ruangKelas} (${mataPelajaran})` 
      : btn.id === 'izin'
      ? `Pengajuan ${izinType}: ${izinAlasan || 'Tanpa keterangan'}`
      : btn.label;

    const newRecord: AttendanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type: recordType,
      date: formattedDate,
      time: formattedTime,
      color: btn.id === 'izin' ? (izinType === 'Sakit' ? 'text-red-400' : 'text-indigo-400') : btn.color,
      bg: btn.bg,
      glow: btn.glow,
      iconName: btn.iconName
    };

    setRecords((prev) => [newRecord, ...prev]);
    saveAttendanceRecordSync(newRecord);
    playBeep('success');
    if (btn.id === 'mengajar') {
      setIsSesiMengajarAktif(true);
      showNotification(`Sesi Mengajar Kelas ${ruangKelas} (${mataPelajaran}) telah dimulai!`, btn.color);
      
      const currentTeacherSession = {
        id: 'ts_self_' + Math.random().toString(36).substr(2, 9),
        name: nama,
        nip: nip,
        mapel: mataPelajaran,
        kelas: ruangKelas,
        jam: `${jamMulai} - ${jamSelesai}`,
        status: 'Mengajar',
        timeStarted: formattedTime,
        timeEnded: '-'
      };
      setTeachingSessionsToday(prev => [currentTeacherSession, ...prev]);
      saveTeachingSessionSync(currentTeacherSession);
    } else if (btn.id === 'izin') {
      const newRequest = {
        id: Math.random().toString(36).substr(2, 9),
        name: nama,
        nip: nip,
        tipe: izinType,
        tanggalMulai: izinMulai,
        tanggalSelesai: izinSelesai,
        alasan: izinAlasan || 'Tanpa keterangan',
        status: 'Pending',
        attachment: izinAttachment
      };
      setIzinRequests(prev => [newRequest, ...prev]);
      saveIzinRequestSync(newRequest);
      showNotification(`Pengajuan ${izinType} untuk ${nama} berhasil dikirim!`, btn.color);
    } else {
      showNotification(`Berhasil mencatat: ${btn.label} untuk ${nama}`, btn.color);
    }
  };

  const handleFileUploadGuru = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const lines = text.split('\n');
          const newTeachers = [];
          for (let i = 1; i < lines.length; i++) { // Skip header
            const line = lines[i].trim();
            if (line) {
              const parts = line.split(',');
              if (parts.length >= 3) {
                newTeachers.push({
                  name: parts[0].trim(),
                  nip: parts[1].trim(),
                  mapel: parts[2].trim(),
                  status: parts[3] ? parts[3].trim() : 'Aktif'
                });
              }
            }
          }
          if (newTeachers.length > 0) {
            setTeachers(prev => [...newTeachers, ...prev]);
            newTeachers.forEach(saveTeacherSync);
            showNotification(`Berhasil mengunggah ${newTeachers.length} data guru`, 'text-emerald-400');
          } else {
            showNotification('Gagal membaca data dari file CSV. Pastikan format: Nama,NIP,Mapel,Status', 'text-rose-400');
          }
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputGuruRef.current) {
      fileInputGuruRef.current.value = '';
    }
  };

  const handleFileUploadSiswa = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const lines = text.split('\n');
          const newStudents = [];
          for (let i = 1; i < lines.length; i++) { // Skip header
            const line = lines[i].trim();
            if (line) {
              const parts = line.split(',');
              if (parts.length >= 3) {
                newStudents.push({
                  name: parts[0].trim(),
                  nis: parts[1].trim(),
                  kelas: parts[2].trim()
                });
              }
            }
          }
          if (newStudents.length > 0) {
            setStudents(prev => [...newStudents, ...prev]);
            newStudents.forEach(saveStudentSync);
            showNotification(`Berhasil mengunggah ${newStudents.length} data siswa`, 'text-emerald-400');
          } else {
            showNotification('Gagal membaca data dari file CSV. Pastikan format: Nama,NIS,Kelas', 'text-rose-400');
          }
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputSiswaRef.current) {
      fileInputSiswaRef.current.value = '';
    }
  };

  const handleSaveSchedule = () => {
    if (!editingSchedule.time || !editingSchedule.class || !editingSchedule.subject) {
      showNotification('Lengkapi semua data jadwal!', 'text-amber-400');
      return;
    }

    if (editingSchedule.id) {
      setTeachingSchedule(prev => prev.map(s => s.id === editingSchedule.id ? { ...editingSchedule, id: s.id } as any : s));
      saveTeachingScheduleSync({ ...editingSchedule, id: editingSchedule.id });
      showNotification('Jadwal berhasil diperbarui!', 'text-emerald-400');
    } else {
      const newSchedule = {
        ...editingSchedule,
        id: Date.now()
      };
      setTeachingSchedule(prev => [...prev, newSchedule as any]);
      saveTeachingScheduleSync(newSchedule);
      showNotification('Jadwal baru berhasil ditambahkan!', 'text-emerald-400');
    }
    setShowScheduleModal(false);
  };

  const handleDeleteSchedule = (id: number) => {
    setTeachingSchedule(prev => prev.filter(s => s.id !== id));
    deleteTeachingScheduleSync(id);
    showNotification('Jadwal berhasil dihapus.', 'text-rose-400');
  };

  const openEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    setShowScheduleModal(true);
  };

  const showNotification = (message: string, color: string) => {
    setNotification({ message, show: true, color });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const getIcon = (name: string, className: string) => {
    switch (name) {
      case 'LogIn': return <LogIn className={className} />;
      case 'LogOut': return <LogOut className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'UserMinus': return <UserMinus className={className} />;
      default: return <Activity className={className} />;
    }
  };

  const startCameraScanning = async () => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
    }
    setIsCameraScannerActive(true);
    setCameraScannerError(null);
    
    // Allow small delay for React to mount the #camera-reader container
    startTimeoutRef.current = setTimeout(() => {
      try {
        // Explicitly list standard barcode and QR formats to guarantee maximum scanning sensitivity
        const formats = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF
        ];

        const html5QrCode = new Html5Qrcode("camera-reader", {
          formatsToSupport: formats,
          verbose: false
        });
        html5QrCodeRef.current = html5QrCode;
        
        const startPromise = html5QrCode.start(
          { facingMode: "environment" }, // back camera on mobile
          {
            fps: 15,
            qrbox: (width, height) => {
              // Wide rectangular box for barcodes rather than a square box
              const boxWidth = Math.min(width, 320) * 0.9;
              const boxHeight = boxWidth * 0.45; // wide aspect ratio (approx 2:1)
              return { width: boxWidth, height: boxHeight };
            },
            aspectRatio: 1.333333 // prefer standard 4:3 view for better focus
          },
          (decodedText) => {
            // Found NIS/Barcode!
            const success = executeStudentScan(decodedText);
            if (success) {
              showNotification(`Scan sukses: ${decodedText}`, 'text-emerald-400');
            }
          },
          () => {
            // silent frame error
          }
        );

        startPromiseRef.current = startPromise;

        startPromise.then(() => {
          if (startPromiseRef.current === startPromise) {
            startPromiseRef.current = null;
          }
        }).catch(err => {
          console.error("Camera start promise rejected:", err);
          if (startPromiseRef.current === startPromise) {
            startPromiseRef.current = null;
          }
          setCameraScannerError("Gagal mengakses Kamera HP. Pastikan Anda membuka aplikasi ini di Tab Baru (klik tombol panah kanan di pojok kanan atas) agar izin kamera aktif.");
          setIsCameraScannerActive(false);
        });
      } catch (e: any) {
        console.error("Camera creation failed:", e);
        setCameraScannerError(e.message || "Gagal membuat scanner kamera.");
        setIsCameraScannerActive(false);
      }
    }, 300);
  };

  const stopCameraScanning = async () => {
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }

    if (startPromiseRef.current) {
      try {
        await startPromiseRef.current;
      } catch (e) {
        // ignore start failures when waiting to stop
      }
      startPromiseRef.current = null;
    }

    if (stopPromiseRef.current) {
      try {
        await stopPromiseRef.current;
      } catch (e) {
        // ignore concurrent stop failures
      }
      return;
    }

    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          const stopPromise = html5QrCodeRef.current.stop();
          stopPromiseRef.current = stopPromise;
          await stopPromise;
        }
      } catch (err: any) {
        const errMsg = err ? (err.message || err.toString()) : "";
        if (errMsg && errMsg.includes("already under transition")) {
          console.warn("Camera stop ignored: already under transition state.");
        } else {
          console.error("Error stopping camera scan:", err);
        }
      } finally {
        stopPromiseRef.current = null;
        html5QrCodeRef.current = null;
      }
    }
    setIsCameraScannerActive(false);
  };

  useEffect(() => {
    if (activeTab !== 'scan') {
      stopCameraScanning();
    }
    return () => {
      // Cleanup on unmount - call the fully guarded stopCameraScanning
      stopCameraScanning();
    };
  }, [activeTab]);

  const executeStudentScan = (inputVal: string) => {
    const trimmed = inputVal.trim();
    if (!trimmed) return false;

    // Find student by NIS, Barcode, or exact Name (case insensitive)
    const found = students.find(s => 
      s.nis === trimmed || 
      (s.barcode && s.barcode.toUpperCase() === trimmed.toUpperCase()) ||
      s.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      setScannedStudent(found);
      setScanSuccess(true);

      const now = new Date();
      const recordTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Avoid duplication
      const isAlreadyScanned = studentRecords.some(rec => rec.nis === found.nis);
      if (isAlreadyScanned) {
        playBeep('warning');
        showNotification(`${found.name} sudah melakukan presensi hari ini.`, 'text-amber-400');
      } else {
        playBeep('success');
        const newRec = {
          id: Math.random().toString(36).substr(2, 9),
          name: found.name,
          nis: found.nis,
          kelas: found.kelas,
          time: recordTimeStr,
          status: 'Hadir'
        };
        setStudentRecords(prev => [newRec, ...prev]);
        saveStudentRecordSync(newRec);
        showNotification(`Presensi barcode ${found.name} berhasil tercatat!`, 'text-emerald-400');
      }

      // Auto-focus input again
      setTimeout(() => {
        if (scanInputRef.current) {
          scanInputRef.current.focus();
        }
      }, 50);

      // Handle scanner overlay transition
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      scanTimeoutRef.current = setTimeout(() => {
        setScannedStudent(null);
      }, 3000);

      return true;
    } else {
      playBeep('error');
      showNotification(`Siswa dengan NIS/Barcode "${trimmed}" tidak ditemukan!`, 'text-rose-400');
      return false;
    }
  };

  if (userRole === 'guest') {
    return (
      <div className="min-h-screen bg-[#05050A] text-gray-100 font-sans flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-500/30 animate-[fadeIn_0.5s_ease-out]">
        {/* Background Ambient Glows */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Card Wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_15px_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl border border-white/10 shadow-lg mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-normal text-white tracking-tight">SMPN 2 Pabuaran</h1>
              <p className="text-sm text-gray-400 mt-1 font-normal">Sistem Absensi Integrasi Sekolah</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              {loginError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-normal flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1.5 uppercase tracking-wider">Username / NIP</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username (admin/guru)"
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-normal"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-normal"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-normal transition-all shadow-[0_4px_25px_rgba(37,99,235,0.3)] active:scale-95 text-sm cursor-pointer"
              >
                Masuk ke Portal
              </button>
            </form>


          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A] text-gray-100 font-sans flex overflow-hidden selection:bg-blue-500/30">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[120px]"></div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-white/[0.02] backdrop-blur-2xl border-r border-white/5 h-screen sticky top-0 z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-50"></div>
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center border border-white/20">
              <Activity className="text-white w-7 h-7" />
            </div>
          </div>
          <div>
            <h1 className="font-normal text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">SMPN 2 Pabuaran</h1>
            <p className="text-xs text-blue-400 font-normal tracking-wider uppercase mt-0.5">Premium Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {userRole === 'guru' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-normal">{isTeacherRole ? 'Dashboard Guru' : 'Dashboard Staff'}</span>
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'schedule' 
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-normal">{isTeacherRole ? 'Jadwal Mengajar' : 'Jadwal Tugas / Shift'}</span>
              </button>
              <button
                onClick={() => setActiveTab('class-attendance')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'class-attendance' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-normal">{isTeacherRole ? 'Riwayat Absensi Kelas' : 'Laporan Absensi Siswa'}</span>
              </button>
              <button
                onClick={() => setActiveTab('teacher-attendance')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'teacher-attendance' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="font-normal">Riwayat Absen Pribadi</span>
              </button>
              <button
                onClick={() => setActiveTab('scan')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'scan' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="font-normal">Scan Barcode Siswa</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-normal">{isTeacherRole ? 'Profil Guru' : 'Profil Staff'}</span>
              </button>
            </>
          )}

          {userRole === 'siswa' && (
            <>
              <button
                onClick={() => setActiveTab('scan')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'scan' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="font-normal">Absen Barcode</span>
              </button>
              <button
                onClick={() => setActiveTab('card')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'card' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-normal">Kartu Siswa</span>
              </button>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'analytics' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span className="font-normal">Analisis Data</span>
              </button>
              <button
                onClick={() => setActiveTab('izin')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'izin' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Coffee className="w-5 h-5" />
                  <span className="font-normal">Persetujuan Izin</span>
                </div>
                {izinRequests.filter(r => r.status === 'Pending').length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-normal bg-amber-500 text-[#05050A] rounded-full">
                    {izinRequests.filter(r => r.status === 'Pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'users' 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-normal">Daftar Guru & Siswa</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20 shadow-[0_0_20px_rgba(100,116,139,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-normal">Pengaturan Sistem</span>
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'export' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <FolderDown className="w-5 h-5" />
                <span className="font-normal">Pusat Laporan</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
                {userRole === 'admin' ? (
                  <Shield className="w-5 h-5 text-white" />
                ) : userRole === 'siswa' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-normal text-white truncate">
                  {userRole === 'admin' ? 'Administrator' : userRole === 'siswa' ? 'Siswa Portal' : nama}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                  {userRole === 'admin' ? 'Full Access' : userRole === 'siswa' ? 'Absen Barcode' : userJabatan}
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowLogoutConfirm(true);
            }}
            className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20 flex items-center justify-center gap-2 font-normal cursor-pointer"
          >
            <LogOut className="w-5 h-5" /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[#05050A]/80 backdrop-blur-xl border-b border-white/5 px-6 sm:px-10 py-5 flex items-center justify-between">
          <div className="md:hidden flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            <h1 className="font-normal text-lg">SMPN 2 Pabuaran</h1>
          </div>
          <div className="hidden md:block">
            <h2 className="text-xl font-normal capitalize text-gray-100">
              {activeTab === 'dashboard' && (isTeacherRole ? 'Dashboard Guru' : 'Dashboard Staff')}
              {activeTab === 'schedule' && (isTeacherRole ? 'Jadwal Mengajar' : 'Jadwal Tugas / Shift')}
              {activeTab === 'class-attendance' && (isTeacherRole ? 'Riwayat Absensi Kelas' : 'Laporan Absensi Siswa')}
              {activeTab === 'teacher-attendance' && 'Riwayat Absensi Pribadi'}
              {activeTab === 'profile' && (isTeacherRole ? 'Profil Guru' : 'Profil Staff')}
              {activeTab === 'scan' && 'Portal Absensi Barcode'}
              {activeTab === 'card' && 'Kartu Anggota Virtual'}
              {activeTab === 'analytics' && 'Analisis Data Presensi'}
              {activeTab === 'izin' && 'Persetujuan Izin & Sakit'}
              {activeTab === 'users' && 'Manajemen Guru & Siswa'}
              {activeTab === 'settings' && 'Pengaturan Sistem Sekolah'}
              {activeTab === 'export' && 'Pusat Laporan Menyeluruh'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-32 text-gray-200 placeholder-gray-500" />
            </div>

            <button
              onClick={() => {
                setShowLogoutConfirm(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/15 transition-all cursor-pointer text-xs font-normal active:scale-95"
              title="Keluar dari Akun"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">Keluar</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 sm:p-10 max-w-6xl w-full mx-auto pb-32 md:pb-10">
          
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Greeting & Clock */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-3xl font-normal tracking-tight text-white">Selamat Datang,</h2>
                      {isSessionTimeActive() && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-normal tracking-wider bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                          {ruangKelas} • {mataPelajaran}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-normal mt-1 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                      {nama || 'Guru'}
                    </div>
                    <p className="text-gray-400 text-sm">Pilih tindakan kehadiran Anda untuk hari ini.</p>
                  </div>
                  <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 font-normal mb-0.5">Waktu Server</div>
                      <div className="font-mono text-xl font-normal tracking-wider text-gray-100">
                        {currentTime.toLocaleTimeString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-36 rounded-2xl bg-white/5 border border-white/5 animate-pulse relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                      </div>
                    ))
                  ) : (
                    <>
                      {attendanceButtons.map((btn) => (
                        <motion.button
                          key={btn.id}
                          whileHover={{ scale: 1.02, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openAttendanceModal(btn)}
                          className={`group relative ${btn.bg} backdrop-blur-md border ${btn.border} p-4 sm:p-6 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden h-32 sm:h-36 ${btn.shadow}`}
                        >
                          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${btn.bg} blur-2xl group-hover:opacity-70 opacity-30 transition-opacity`}></div>
                          <div className={`p-2.5 sm:p-3 rounded-xl bg-[#05050A]/50 border border-white/5 shadow-inner ${btn.glow}`}>
                            {getIcon(btn.iconName, `w-5 h-5 sm:w-6 sm:h-6 ${btn.color}`)}
                          </div>
                          <div className="flex flex-col items-center gap-1 z-10 text-center">
                            <span className={`font-normal text-sm sm:text-base ${btn.color} tracking-wide leading-snug`}>
                              {btn.id === 'mengajar' ? (isTeacherRole ? 'Mulai Mengajar' : 'Mulai Tugas / Shift') : btn.label}
                            </span>
                            {btn.id === 'mengajar' && isSessionTimeActive() && (
                              <span className="text-[10px] font-normal text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full mt-0.5">
                                {ruangKelas} • {mataPelajaran}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                      <motion.button
                        key="riwayat-absensi"
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('teacher-attendance')}
                        className={`group relative bg-purple-400/10 backdrop-blur-md border border-purple-400/30 p-4 sm:p-6 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden h-32 sm:h-36 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]`}
                      >
                        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-purple-400/10 blur-2xl group-hover:opacity-70 opacity-30 transition-opacity`}></div>
                        <div className={`p-2.5 sm:p-3 rounded-xl bg-[#05050A]/50 border border-white/5 shadow-inner shadow-[0_0_15px_rgba(168,85,247,0.4)]`}>
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                        </div>
                        <div className="flex flex-col items-center gap-1 z-10 text-center">
                          <span className={`font-normal text-sm sm:text-base text-purple-400 tracking-wide leading-snug`}>
                            Riwayat Absensi
                          </span>
                        </div>
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-normal text-white">{isTeacherRole ? 'Jadwal Mengajar' : 'Jadwal Tugas / Shift Kerja'}</h2>
                    <p className="text-gray-400 text-sm mt-1">{isTeacherRole ? 'Manajemen jadwal mengajar mingguan dan harian Anda.' : 'Manajemen jadwal tugas, patroli, atau shift kerja harian Anda.'}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                      onClick={() => {
                        setEditingSchedule({ id: null, day: scheduleDay, time: '', class: '', subject: '' });
                        setShowScheduleModal(true);
                      }}
                      className="px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors flex items-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Tambah Jadwal</span>
                    </button>
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((day) => (
                        <button
                          key={day}
                          onClick={() => setScheduleDay(day)}
                          className={`px-4 py-2 rounded-lg text-sm font-normal transition-all ${
                            scheduleDay === day 
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teachingSchedule.filter(s => s.day === scheduleDay).length > 0 ? (
                    teachingSchedule.filter(s => s.day === scheduleDay).map((schedule, idx) => (
                      <div key={schedule.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:scale-150"></div>
                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <div className="flex items-center gap-2 text-orange-400 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="font-normal text-sm">{schedule.time}</span>
                            </div>
                            <h3 className="text-xl font-normal text-white">{schedule.subject}</h3>
                            <div className="flex items-center gap-2 text-gray-400 mt-2">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-normal">{isTeacherRole ? `Kelas ${schedule.class}` : `Lokasi: ${schedule.class}`}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => openEditSchedule(schedule)} className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteSchedule(schedule.id)} className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                      <Calendar className="w-12 h-12 text-gray-500 mb-3" />
                      <p className="text-gray-400 font-normal">Tidak ada {isTeacherRole ? 'jadwal mengajar' : 'jadwal tugas / shift kerja'} pada hari {scheduleDay}.</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <Sparkles className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-normal text-lg mb-1">Ringkasan Mingguan</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Anda memiliki total <span className="text-white font-normal">{teachingSchedule.length} {isTeacherRole ? 'sesi mengajar' : 'tugas harian'}</span> minggu ini. Pastikan untuk mengisi absensi tepat waktu 15 menit sebelum setiap sesi dimulai.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'teacher-attendance' && (
              <motion.div 
                key="teacher-attendance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-normal text-white">Riwayat Absensi Pribadi</h2>
                    <p className="text-gray-400 text-sm mt-1">Rekapitulasi kehadiran Anda di sekolah.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <select 
                        className="w-full sm:w-auto appearance-none bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                        defaultValue="06-2026"
                      >
                        <option value="06-2026">Juni 2026</option>
                        <option value="05-2026">Mei 2026</option>
                        <option value="04-2026">April 2026</option>
                      </select>
                      <Calendar className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.setFontSize(16);
                          doc.text('Laporan Absensi Bulanan', 14, 22);
                          doc.setFontSize(11);
                          doc.text(`Nama : ${nama}`, 14, 32);
                          doc.text(`NIP  : ${nip}`, 14, 38);
                          doc.text(`Bulan: Juni 2026`, 14, 44);
                          doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 50);
                          
                          const tableData = teacherAttendanceHistory.map(h => [
                            h.date,
                            h.time,
                            h.status,
                            h.location
                          ]);
                          
                          autoTable(doc, {
                            startY: 56,
                            head: [['Tanggal', 'Jam Masuk', 'Status', 'Lokasi Absen']],
                            body: tableData,
                            theme: 'grid',
                            headStyles: { fillColor: [168, 85, 247] },
                          });
                          
                          const finalY3 = (doc as any).lastAutoTable.finalY || 100;
                          doc.text(`Pabuaran, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, finalY3 + 20);
                          doc.text('Kepala Sekolah', 130, finalY3 + 28);
                          doc.text('Drs. H. Ahmad Sunarya, M.Pd', 130, finalY3 + 50);
                          doc.text('NIP. 196503121989021003', 130, finalY3 + 56);

                          doc.save(`Riwayat_Absen_${nama.replace(/[^a-zA-Z0-9]/g, '_')}_Juni_2026.pdf`);
                          showNotification('Laporan PDF berhasil diunduh!', 'text-emerald-400');
                        }}
                        className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF Bulanan</span>
                        <span className="sm:hidden">PDF</span>
                      </button>
                      <button 
                        onClick={() => {
                          const headers = ['Tanggal', 'Jam Masuk', 'Status', 'Lokasi Absen'];
                          const csvContent = [
                            headers.join(','),
                            ...teacherAttendanceHistory.map(h => `${h.date},${h.time},${h.status},${h.location}`)
                          ].join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = 'Riwayat_Absen_Bulanan.csv';
                          link.click();
                          showNotification('Laporan Excel (CSV) berhasil diunduh!', 'text-emerald-400');
                        }}
                        className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="hidden sm:inline">Excel Bulanan</span>
                        <span className="sm:hidden">Excel</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                    <p className="text-emerald-400 text-sm mb-1">Hadir</p>
                    <p className="text-2xl font-normal text-white">
                      {teacherAttendanceHistory.filter(h => h.status === 'Hadir' || h.status === 'Terlambat').length}
                    </p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
                    <p className="text-rose-400 text-sm mb-1">Alpa</p>
                    <p className="text-2xl font-normal text-white">
                      {teacherAttendanceHistory.filter(h => h.status === 'Alpa').length}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
                    <p className="text-yellow-400 text-sm mb-1">Sakit</p>
                    <p className="text-2xl font-normal text-white">
                      {teacherAttendanceHistory.filter(h => h.status === 'Sakit').length}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                    <p className="text-blue-400 text-sm mb-1">Izin</p>
                    <p className="text-2xl font-normal text-white">
                      {teacherAttendanceHistory.filter(h => h.status === 'Izin').length}
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="py-4 px-6 text-xs font-normal text-gray-400 uppercase tracking-wider">Tanggal</th>
                          <th className="py-4 px-6 text-xs font-normal text-gray-400 uppercase tracking-wider">Jam Masuk</th>
                          <th className="py-4 px-6 text-xs font-normal text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="py-4 px-6 text-xs font-normal text-gray-400 uppercase tracking-wider">Lokasi Absen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {teacherAttendanceHistory.map((history) => (
                          <tr key={history.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6 text-white font-normal">{history.date}</td>
                            <td className="py-4 px-6 text-gray-300 font-mono">{history.time}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-normal ${
                                history.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                history.status === 'Terlambat' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                                history.status === 'Sakit' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                history.status === 'Izin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {history.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-400 text-sm">{history.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'class-attendance' && (
              <motion.div 
                key="class-attendance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-normal text-white">Riwayat Absensi Kelas</h2>
                    <p className="text-gray-400 text-sm mt-1">Rekapitulasi presensi siswa per kelas.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <select 
                        value={selectedClassAttendance}
                        onChange={(e) => setSelectedClassAttendance(e.target.value)}
                        className="w-full sm:w-auto appearance-none bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                      >
                        <option value="VII A">Kelas VII A</option>
                        <option value="VII B">Kelas VII B</option>
                        <option value="VIII A">Kelas VIII A</option>
                        <option value="VIII B">Kelas VIII B</option>
                        <option value="VIII C">Kelas VIII C</option>
                        <option value="IX A">Kelas IX A</option>
                        <option value="IX B">Kelas IX B</option>
                        <option value="IX C">Kelas IX C</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full sm:w-auto bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                    <p className="text-emerald-400 text-sm mb-1">Hadir</p>
                    <p className="text-2xl font-normal text-white">
                      {attendanceHistory.find(h => h.class === selectedClassAttendance && h.date === attendanceDate)?.present || 0}
                    </p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
                    <p className="text-rose-400 text-sm mb-1">Alpa</p>
                    <p className="text-2xl font-normal text-white">
                      {attendanceHistory.find(h => h.class === selectedClassAttendance && h.date === attendanceDate)?.absent || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
                    <p className="text-yellow-400 text-sm mb-1">Sakit</p>
                    <p className="text-2xl font-normal text-white">
                      {attendanceHistory.find(h => h.class === selectedClassAttendance && h.date === attendanceDate)?.sick || 0}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                    <p className="text-blue-400 text-sm mb-1">Izin</p>
                    <p className="text-2xl font-normal text-white">
                      {attendanceHistory.find(h => h.class === selectedClassAttendance && h.date === attendanceDate)?.permission || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden mt-6">
                  <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-normal text-white">Daftar Siswa</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 sm:flex-none">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Cari siswa..." 
                          className="bg-black/20 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30 w-full sm:w-64"
                        />
                      </div>
                      <div className="flex bg-white/5 rounded-lg border border-white/10 p-0.5">
                        <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer">
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">PDF Harian</span>
                        </button>
                        <button onClick={handleExportMonthlyPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer border-l border-white/10">
                          <span className="hidden sm:inline">Bulanan</span>
                        </button>
                      </div>
                      <div className="flex bg-emerald-500/10 rounded-lg border border-emerald-500/20 p-0.5">
                        <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors cursor-pointer">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Excel Harian</span>
                        </button>
                        <button onClick={handleExportMonthlyExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors cursor-pointer border-l border-emerald-500/20">
                          <span className="hidden sm:inline">Bulanan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-gray-400 text-sm">
                          <th className="py-3 px-5 font-normal">NIS</th>
                          <th className="py-3 px-5 font-normal">Nama Siswa</th>
                          <th className="py-3 px-5 font-normal">Status</th>
                          <th className="py-3 px-5 font-normal">Waktu Absen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student, idx) => (
                          <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-5 text-gray-300 text-sm">{student.nis}</td>
                            <td className="py-3 px-5 text-white text-sm">{student.name}</td>
                            <td className="py-3 px-5">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${
                                student.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                student.status === 'Alpa' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                student.status === 'Sakit' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-gray-400 text-sm">
                              {student.status === 'Hadir' ? '07:15 AM' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                {isLoading ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-10 animate-pulse">
                    <div className="flex flex-col items-center">
                      <div className="w-28 h-28 rounded-full bg-white/5 mb-6"></div>
                      <div className="w-48 h-6 bg-white/5 rounded mb-3"></div>
                      <div className="w-32 h-4 bg-white/5 rounded mb-4"></div>
                      <div className="w-24 h-6 bg-white/5 rounded-full"></div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    <div className="relative h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/5 overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    </div>
                    <div className="px-10 pb-10 relative">
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                        <div className="w-32 h-32 rounded-full p-2 bg-[#05050A] border border-white/10 shadow-2xl relative">
                          <div className="absolute inset-0 rounded-full border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-[spin_10s_linear_infinite]"></div>
                          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-full flex items-center justify-center">
                            <User className="w-12 h-12 text-blue-200" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-20 text-center">
                        <h2 className="text-3xl font-normal text-white tracking-tight mb-1">{nama}</h2>
                        <p className="text-blue-400 font-mono text-sm mb-4">NIP: {nip}</p>
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Guru Mapel Aktif
                        </span>
                      </div>

                      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Email Resmi</p>
                              <p className="text-sm font-normal text-gray-200">tb.saiful@smpn1pabuaran.sch.id</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Telepon</p>
                              <p className="text-sm font-normal text-gray-200">+62 877 6542 1209</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Satuan Kerja</p>
                              <p className="text-sm font-normal text-gray-200">SMPN 2 Pabuaran</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Mata Pelajaran Utama</p>
                              <p className="text-sm font-normal text-gray-200">Pendidikan Agama Islam (PAI)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'scan' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-3xl">
                  <div>
                    <h3 className="text-2xl font-normal text-white tracking-tight">Portal Absensi Mandiri Siswa</h3>
                    <p className="text-sm text-gray-400 mt-1">Gunakan Barcode atau ketik NIS untuk mencatat kehadiran siswa hari ini.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="font-mono font-normal text-blue-400">{currentTime.toLocaleTimeString('id-ID')}</span>
                  </div>
                </div>

                {isSessionTimeActive() ? (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-normal tracking-wider uppercase">Sesi Mengajar Aktif</p>
                        <p className="text-sm font-normal text-white">Kelas {ruangKelas} • {mataPelajaran}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-400">Jam Mengajar:</span>
                      <span className="font-mono font-normal text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-md">{jamMulai} - {jamSelesai}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-500/10 rounded-lg animate-pulse">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-normal tracking-wider uppercase">Sesi Mengajar Selesai / Tidak Aktif</p>
                        <p className="text-sm font-normal text-white">Silakan mulai sesi baru untuk mengaktifkan filter & otomatisasi</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('dashboard');
                        showNotification("Silakan klik 'Mulai Mengajar' di dashboard.", "text-amber-400");
                      }}
                      className="text-xs font-normal text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 rounded-xl border border-amber-500/20 cursor-pointer active:scale-95 transition-all"
                    >
                      Mulai Sesi Mengajar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column */}
                  <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative flex flex-col justify-between">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    
                    <div className="mb-4">
                      <h4 className="font-normal text-lg text-white mb-1">Scanner Presensi Barcode & QR</h4>
                      <p className="text-xs text-gray-400">Posisikan barcode kartu pelajar siswa di depan kamera atau ketik NIS secara manual.</p>
                    </div>

                    <div className="relative w-full aspect-[4/3] max-w-md mx-auto rounded-2xl bg-black border border-white/10 overflow-hidden flex flex-col items-center justify-center group mb-5">
                      {isCameraScannerActive && (
                        <div id="camera-reader" className="absolute inset-0 w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_canvas]:absolute [&_canvas]:inset-0 [&_canvas]:w-full [&_canvas]:h-full [&_canvas]:object-cover"></div>
                      )}

                      <div className="absolute left-0 right-0 h-0.5 bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,1)] top-1/2 animate-[bounce_3s_infinite] z-10"></div>
                      
                      <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-md"></div>
                      <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-md"></div>
                      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-md"></div>
                      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-md"></div>

                      <div className="text-center p-6 z-10 relative">
                        {scannedStudent ? (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-500/90 backdrop-blur-md border border-emerald-400 p-6 rounded-2xl max-w-xs mx-auto shadow-2xl"
                          >
                            <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-3 animate-bounce" />
                            <h5 className="font-normal text-white truncate text-base">{scannedStudent.name}</h5>
                            <p className="text-xs text-white/80 mt-1">NIS: {scannedStudent.nis} • Kelas {scannedStudent.kelas}</p>
                            <span className="inline-block mt-3 px-3 py-1 bg-white text-emerald-600 font-normal text-[10px] rounded-full uppercase tracking-wider">Hadir Terdaftar</span>
                          </motion.div>
                        ) : (
                          <>
                            {!isCameraScannerActive ? (
                              <>
                                <QrCode className="w-16 h-16 text-blue-500/40 mx-auto mb-3 animate-pulse" />
                                <p className="text-xs font-normal text-gray-500 uppercase tracking-widest">Scanner Siaga</p>
                              </>
                            ) : (
                              <div className="bg-black/40 backdrop-blur-xs px-4 py-2 rounded-lg text-white text-[11px] font-normal uppercase tracking-widest">
                                Kamera Sedang Memindai...
                              </div>
                            )}
                          </>
                        )}
                        {cameraScannerError && (
                          <div className="bg-rose-500/90 backdrop-blur-md border border-rose-400 p-4 rounded-xl max-w-xs mx-auto text-white text-xs font-normal mt-2">
                            {cameraScannerError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          ref={scanInputRef}
                          type="text"
                          placeholder="Arahkan barcode / ketik NIS atau Nama lalu Enter..."
                          value={manualNis}
                          onChange={(e) => setManualNis(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              executeStudentScan(manualNis);
                              setManualNis('');
                            }
                          }}
                          className="w-full pl-12 pr-28 py-4 bg-[#05050A]/80 border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                        />
                        <button
                          onClick={() => {
                            executeStudentScan(manualNis);
                            setManualNis('');
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-normal text-xs rounded-xl transition-all cursor-pointer"
                        >
                          Absen
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-500 text-center leading-normal">
                        💡 Scanner ini <span className="text-blue-400 font-normal">Selalu Siaga</span>. Ketik NIS siswa di atas untuk merekam presensi.
                      </p>

                      <div className="flex justify-center pt-1 pb-2">
                        {isCameraScannerActive ? (
                          <button
                            type="button"
                            onClick={stopCameraScanning}
                            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/20"
                          >
                            <Camera className="w-4 h-4 text-rose-400 animate-pulse" /> Nonaktifkan Kamera HP
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startCameraScanning}
                            className="px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-950/20"
                          >
                            <Camera className="w-4 h-4 text-blue-400" /> Aktifkan Kamera HP Guru
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative">
                      <h4 className="font-normal text-lg text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" /> Log Presensi Siswa Hari Ini
                      </h4>
                      
                      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                        {studentRecords.length === 0 ? (
                          <div className="text-center py-10">
                            <UserMinus className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Belum ada siswa absen hari ini.</p>
                          </div>
                        ) : (
                          studentRecords.map(rec => (
                            <div key={rec.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all animate-[fadeIn_0.3s_ease-out]">
                              <div>
                                <p className="text-sm font-normal text-white">{rec.name}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">NIS {rec.nis} • Kelas {rec.kelas}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-mono font-normal text-blue-400">{rec.time}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-normal rounded ${
                                  rec.status === 'Hadir' || rec.status === 'Tepat Waktu' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {rec.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'card' && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div>
                    <h3 className="font-normal text-lg text-white">Kartu Pelajar Digital</h3>
                    <p className="text-xs text-gray-400 mt-1">Pilih siswa untuk menghasilkan visual ID card dengan barcode-nya.</p>
                  </div>
                  <select
                    value={selectedStudentCard}
                    onChange={(e) => setSelectedStudentCard(e.target.value)}
                    className="px-4 py-2.5 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white focus:outline-none"
                  >
                    {students.map(s => (
                      <option key={s.nis} value={s.nis}>{s.name} ({s.kelas})</option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const s = students.find(x => x.nis === selectedStudentCard) || students[0];
                  return (
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-br from-[#121225] via-[#0A0A16] to-[#121225] border border-white/15 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative group"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>

                      <div className="p-8">
                        <div className="flex justify-between items-start border-b border-white/10 pb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl">
                              <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="text-base font-normal text-white tracking-wide">SMPN 2 Pabuaran</h4>
                              <p className="text-[9px] text-blue-400 uppercase tracking-widest font-normal mt-0.5">Kabupaten Serang</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-normal px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">KARTU PELAJAR</span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 py-8">
                          <div className="w-28 h-36 rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10 overflow-hidden shrink-0 mx-auto flex items-center justify-center relative">
                            <User className="w-14 h-14 text-white/20" />
                            <div className="absolute bottom-2 inset-x-2 py-1 text-[9px] font-normal bg-blue-600 text-white rounded text-center">AKTIF</div>
                          </div>
                          
                          <div className="flex-1 space-y-4 text-center sm:text-left">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-normal tracking-wider mb-1">Nama Lengkap</p>
                              <h5 className="text-xl font-normal text-white">{s.name}</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-normal tracking-wider mb-1">NIS (Nomor Induk)</p>
                                <p className="font-mono text-sm font-normal text-gray-200">{s.nis}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-normal tracking-wider mb-1">Tingkat / Kelas</p>
                                <p className="text-sm font-normal text-gray-200">{s.kelas}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-white/10 pt-6 flex flex-col items-center">
                          <p className="text-[10px] text-gray-500 font-normal uppercase tracking-widest mb-3">Barcode Scan Terintegrasi</p>
                          
                          <div className="p-3 bg-white rounded-xl shadow-lg flex flex-col items-center">
                            <div className="flex items-center justify-center gap-[2px] h-12 w-64 bg-white px-2">
                              {Array.from({ length: 32 }).map((_, i) => {
                                const widths = [1, 2, 3, 4];
                                const width = widths[Math.floor(Math.sin(i * 123) * 2 + 2)];
                                return (
                                  <div 
                                    key={i} 
                                    className="bg-black h-full" 
                                    style={{ width: `${width}px` }}
                                  />
                                );
                              })}
                            </div>
                            <span className="font-mono text-[10px] text-black font-normal mt-1.5 tracking-[6px] pl-[6px]">
                              {s.barcode}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              playBeep('success');
                              const now = new Date();
                              const recordTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                              
                              const newRec = {
                                id: Math.random().toString(36).substr(2, 9),
                                name: s.name,
                                nis: s.nis,
                                kelas: s.kelas,
                                time: recordTimeStr,
                                status: 'Hadir'
                              };
                              setStudentRecords(prev => [newRec, ...prev]);
                              saveStudentRecordSync(newRec);
                              showNotification(`Kehadiran ${s.name} terabsen sukses!`, 'text-emerald-400');
                            }}
                            className="mt-6 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-normal text-white flex items-center gap-2 transition-all cursor-pointer hover:border-blue-500/30"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Ketuk untuk Cek-In Cepat
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl"></div>
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl inline-flex mb-3 text-emerald-400">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Guru Mengajar Aktif</p>
                    <p className="text-2xl font-normal text-white mt-1">4 / 4</p>
                    <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">100% Kehadiran</p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl"></div>
                    <div className="p-2.5 bg-blue-500/10 rounded-xl inline-flex mb-3 text-blue-400">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Siswa Hadir Hari Ini</p>
                    <p className="text-2xl font-normal text-white mt-1">{studentRecords.length} / {students.length}</p>
                    <p className="text-[10px] text-blue-400 mt-2">
                      {Math.round((studentRecords.length / students.length) * 100)}% Partisipasi
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl"></div>
                    <div className="p-2.5 bg-amber-500/10 rounded-xl inline-flex mb-3 text-amber-400">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Guru Cuti / Izin</p>
                    <p className="text-2xl font-normal text-white mt-1">
                      {izinRequests.filter(r => r.status === 'Disetujui').length}
                    </p>
                    <p className="text-[10px] text-amber-400 mt-2">
                      {izinRequests.filter(r => r.status === 'Pending').length} Pending Persetujuan
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl"></div>
                    <div className="p-2.5 bg-purple-500/10 rounded-xl inline-flex mb-3 text-purple-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-500 font-normal">Total Akun Terdaftar</p>
                    <p className="text-2xl font-normal text-white mt-1">
                      {teachers.length + students.length}
                    </p>
                    <p className="text-[10px] text-purple-400 mt-2">Sistem Terintegrasi</p>
                  </div>
                </div>



                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Sesi Mengajar Hari Ini */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-5 h-5 text-cyan-400" />
                        <h4 className="font-normal text-lg text-white">{isTeacherRole ? 'Sesi Mengajar Hari Ini' : 'Sesi Tugas & Pekerjaan Hari Ini'}</h4>
                      </div>
                      <span className="text-[11px] text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20 font-normal">
                        Live Update
                      </span>
                    </div>

                    <div className="space-y-4">
                      {teachingSessionsToday.map(session => (
                        <div key={session.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-all duration-300">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-normal text-xs ${
                              session.status === 'Mengajar' ? 'bg-cyan-500/10 text-cyan-400' :
                              session.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {session.name.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-normal text-white">{session.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {isTeacherRole ? (
                                  <>Mapel: <span className="text-gray-300">{session.mapel}</span> • Kelas: <span className="text-gray-300">{session.kelas}</span></>
                                ) : (
                                  <>Tugas: <span className="text-gray-300">{session.mapel}</span> • Lokasi: <span className="text-gray-300">{session.kelas}</span></>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-gray-500">
                                <span>Rencana: {session.jam}</span>
                                {session.timeStarted !== '-' && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-cyan-400/80">Mulai: {session.timeStarted}</span>
                                  </>
                                )}
                                {session.timeEnded !== '-' && (
                                  <>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-emerald-400/80">Selesai: {session.timeEnded}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-normal border ${
                              session.status === 'Mengajar' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                              session.status === 'Selesai' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                              'bg-gray-500/15 text-gray-400 border-white/10'
                            }`}>
                              {session.status === 'Mengajar' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                              )}
                              {session.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Konsolidasi Kehadiran Terkini */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <h4 className="font-normal text-lg text-white">Konsolidasi Kehadiran Terkini</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {studentRecords.slice(0, 3).map(rec => (
                        <div key={rec.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-normal text-xs">
                              S
                            </div>
                            <div>
                              <p className="text-sm font-normal text-white">{rec.name} (Siswa)</p>
                              <p className="text-[11px] text-gray-400">Absen Barcode Kelas {rec.kelas} • NIS {rec.nis}</p>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-normal text-gray-400">{rec.time}</span>
                        </div>
                      ))}
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-normal text-xs">
                            G
                          </div>
                          <div>
                            <p className="text-sm font-normal text-white">Tb. Saiful Bahri, S.Pd. (Guru)</p>
                            <p className="text-[11px] text-gray-400 font-normal">Mulai Mengajar • Mapel PAI Kelas VII - A</p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-normal text-gray-400">08.53.12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'izin' && (
              <motion.div
                key="izin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl mb-4">
                  <h3 className="text-2xl font-normal text-white tracking-tight">Persetujuan Absen Guru (Izin / Sakit)</h3>
                  <p className="text-sm text-gray-400 mt-1">Review, setujui, atau tolak surat pengajuan izin dan dinas luar dari para guru.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {izinRequests.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-center">
                      <Coffee className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-pulse" />
                      <p className="text-gray-400 font-normal">Semua pengajuan perizinan guru telah diselesaikan.</p>
                    </div>
                  ) : (
                    izinRequests.map(req => (
                      <motion.div
                        key={req.id}
                        layoutId={`req-card-${req.id}`}
                        className="p-6 bg-white/[0.02] border border-white/10 rounded-3xl relative overflow-hidden"
                      >
                        <div className="absolute top-6 right-6">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-normal uppercase tracking-wider ${
                            req.tipe === 'Sakit' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                            req.tipe === 'Izin' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                          }`}>
                            {req.tipe}
                          </span>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-5">
                          <div className="p-3.5 bg-white/5 rounded-2xl text-gray-300">
                            <FileText className="w-8 h-8" />
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div>
                              <h4 className="font-normal text-lg text-white">{req.name}</h4>
                              <p className="text-xs font-mono text-gray-400">NIP: {req.nip}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 max-w-md bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                              <div>
                                <span className="text-[10px] uppercase font-normal text-gray-500">Tanggal Mulai</span>
                                <p className="text-xs font-normal text-gray-300 mt-0.5">{req.tanggalMulai}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-normal text-gray-500">Tanggal Selesai</span>
                                <p className="text-xs font-normal text-gray-300 mt-0.5">{req.tanggalSelesai}</p>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-normal text-gray-500 block">Alasan Pengajuan</span>
                              <p className="text-sm text-gray-300 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                "{req.alasan}"
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-normal text-gray-500">Status:</span>
                                <span className={`px-3 py-1 text-xs font-normal rounded-lg ${
                                  req.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                                  req.status === 'Disetujui' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                  'bg-red-500/10 text-red-400 border border-red-500/10'
                                } border`}>
                                  {req.status}
                                </span>
                              </div>

                              {req.status === 'Pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setIzinRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'Ditolak' } : p));
                                      saveIzinRequestSync({ ...req, status: 'Ditolak' });
                                      showNotification(`Pengajuan ${req.name} ditolak.`, 'text-red-400');
                                    }}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-normal rounded-xl border border-red-500/20 transition-all cursor-pointer"
                                  >
                                    Tolak
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIzinRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'Disetujui' } : p));
                                      saveIzinRequestSync({ ...req, status: 'Disetujui' });
                                      showNotification(`Pengajuan ${req.name} disetujui!`, 'text-emerald-400');
                                    }}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#05050A] text-xs font-normal rounded-xl transition-all cursor-pointer"
                                  >
                                    Setujui Izin
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Guru */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-normal text-lg text-white flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-emerald-400" /> Direktori Guru ({teachers.length})
                      </h4>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept=".csv" 
                          className="hidden" 
                          ref={fileInputGuruRef}
                          onChange={handleFileUploadGuru}
                        />
                        <button
                          onClick={() => fileInputGuruRef.current?.click()}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal text-xs rounded-lg flex items-center gap-1 hover:bg-emerald-500/20 transition-all cursor-pointer"
                          title="Upload Data Guru dari CSV"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Data
                        </button>
                        <button
                          onClick={() => {
                            setNewTeacherName('');
                            setNewTeacherNip('');
                            setNewTeacherMapel('');
                            setShowAddTeacherModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-500 text-black font-normal text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Guru
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Cari guru..."
                          value={searchGuruQuery}
                          onChange={(e) => setSearchGuruQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#05050A] border border-white/5 rounded-xl text-xs text-white outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={filterGuruMapel}
                          onChange={(e) => setFilterGuruMapel(e.target.value)}
                          className="w-full appearance-none pl-4 pr-10 py-2.5 bg-[#05050A] border border-white/5 rounded-xl text-xs text-white outline-none focus:border-emerald-500/50"
                        >
                          <option value="">Semua Mata Pelajaran</option>
                          {Array.from(new Set(teachers.map(t => t.mapel))).filter(Boolean).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 mb-2">
                      <span>Daftar Guru</span>
                      <button 
                        onClick={() => {
                          const csvContent = "Nama,NIP,Mapel\nTb. Saiful Bahri S.Pd.,197601142005011004,PAI\nSiti Aminah M.Pd.,198203112009022003,Matematika\nAhmad Fauzi S.Pd.,198506152011011002,Bahasa Indonesia";
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = 'Template_Upload_Guru.csv';
                          link.click();
                          showNotification('Template CSV Guru berhasil diunduh!', 'text-emerald-400');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none transition-colors"
                      >
                        <Download className="w-3 h-3" /> Unduh Template CSV
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                      {teachers
                        .filter(t => {
                          const matchQuery = t.name.toLowerCase().includes(searchGuruQuery.toLowerCase()) || t.nip.includes(searchGuruQuery);
                          const matchMapel = !filterGuruMapel || t.mapel === filterGuruMapel;
                          return matchQuery && matchMapel;
                        })
                        .map((t, idx) => (
                          <div key={idx} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.03] transition-all">
                            <div>
                              <p className="text-sm font-normal text-white">{t.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">NIP: {t.nip} • Mapel {t.mapel}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingTeacher(t);
                                  setShowEditTeacherModal(true);
                                }}
                                className="p-2 text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer"
                                title="Edit Data Guru"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setTeachers(prev => prev.filter(x => x.nip !== t.nip));
                                  deleteTeacherSync(t.nip);
                                  showNotification(`Guru ${t.name} dihapus.`, 'text-red-400');
                                }}
                                className="p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                title="Hapus Guru"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right Column: Siswa */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-normal text-lg text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" /> Roster Siswa ({students.length})
                      </h4>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept=".csv" 
                          className="hidden" 
                          ref={fileInputSiswaRef}
                          onChange={handleFileUploadSiswa}
                        />
                        <button
                          onClick={() => fileInputSiswaRef.current?.click()}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-normal text-xs rounded-lg flex items-center gap-1 hover:bg-blue-500/20 transition-all cursor-pointer"
                          title="Upload Data Siswa dari CSV"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Data
                        </button>
                        <button
                          onClick={() => {
                            setNewStudentName('');
                            setNewStudentNis('');
                            setNewStudentKelas('');
                            setShowAddStudentModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white font-normal text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Siswa
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Cari siswa..."
                          value={searchSiswaQuery}
                          onChange={(e) => setSearchSiswaQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-[#05050A] border border-white/5 rounded-xl text-xs text-white outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={filterSiswaKelas}
                          onChange={(e) => setFilterSiswaKelas(e.target.value)}
                          className="w-full appearance-none pl-4 pr-10 py-2.5 bg-[#05050A] border border-white/5 rounded-xl text-xs text-white outline-none focus:border-blue-500/50"
                        >
                          <option value="">Semua Kelas</option>
                          {Array.from(new Set(students.map(s => s.kelas))).filter(Boolean).map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 mb-2">
                      <span>Daftar Roster</span>
                      <button 
                        onClick={() => {
                          const csvContent = "Nama,NIS,Kelas\nAndi Wijaya,24001,VII - A\nSiti Rahma,24002,VII - A\nRian Pratama,24003,VII - B";
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = 'Template_Upload_Siswa.csv';
                          link.click();
                          showNotification('Template CSV Siswa berhasil diunduh!', 'text-blue-400');
                        }}
                        className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none transition-colors"
                      >
                        <Download className="w-3 h-3" /> Unduh Template CSV
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                      {students
                        .filter(s => {
                          const matchQuery = s.name.toLowerCase().includes(searchSiswaQuery.toLowerCase()) || s.nis.includes(searchSiswaQuery);
                          const matchKelas = !filterSiswaKelas || s.kelas === filterSiswaKelas;
                          return matchQuery && matchKelas;
                        })
                        .map((s, idx) => (
                          <div key={idx} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.03] transition-all">
                            <div>
                              <p className="text-sm font-normal text-white">{s.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">NIS: {s.nis} • Kelas {s.kelas}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingStudent(s);
                                  setShowEditStudentModal(true);
                                }}
                                className="p-2 text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer"
                                title="Edit Data Siswa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setStudents(prev => prev.filter(x => x.nis !== s.nis));
                                  deleteStudentSync(s.nis);
                                  showNotification(`Siswa ${s.name} dihapus.`, 'text-red-400');
                                }}
                                className="p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>


              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Profil Sekolah */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 lg:col-span-2">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center">
                        <Building className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-normal text-white">Profil Sekolah</h3>
                        <p className="text-sm text-gray-400 mt-1">Kelola informasi identitas institusi.</p>
                      </div>
                    </div>

                    <form className="space-y-5" onSubmit={(e) => {
                      e.preventDefault();
                      showNotification('Pengaturan sistem berhasil disimpan!', 'text-emerald-400');
                    }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">Nama Sekolah</label>
                          <input 
                            type="text" 
                            defaultValue="SMPN 2 Pabuaran"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-slate-500/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">Tahun Ajaran Aktif</label>
                          <input 
                            type="text" 
                            defaultValue="2026/2027"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-slate-500/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">Nama Kepala Sekolah</label>
                          <input 
                            type="text" 
                            defaultValue="Drs. H. Ahmad Sunarya, M.Pd"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-slate-500/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">NIP Kepala Sekolah</label>
                          <input 
                            type="text" 
                            defaultValue="196503121989021003"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-slate-500/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 ml-1">Alamat Lengkap</label>
                        <textarea 
                          defaultValue="Jl. Raya Pabuaran No. 45, Kec. Pabuaran, Kab. Serang, Banten 42163"
                          rows={2}
                          className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-slate-500/50 resize-none"
                        />
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit"
                          className="w-full py-3.5 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                        >
                          Simpan Profil
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Pengaturan Jam Kerja */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-normal text-white">Pengaturan Jam Kerja</h3>
                        <p className="text-sm text-gray-400 mt-1">Batas waktu absensi harian.</p>
                      </div>
                    </div>

                    <form className="space-y-5" onSubmit={(e) => {
                      e.preventDefault();
                      showNotification('Pengaturan jam kerja berhasil disimpan!', 'text-emerald-400');
                    }}>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">Batas Jam Masuk</label>
                          <input 
                            type="time" 
                            defaultValue="07:00"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">Batas Jam Pulang</label>
                          <input 
                            type="time" 
                            defaultValue="15:00"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 ml-1">Toleransi Keterlambatan (Menit)</label>
                        <input 
                          type="number" 
                          defaultValue="15"
                          min="0"
                          className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-blue-500/50"
                        />
                        <p className="text-[10px] text-gray-500 ml-1 mt-1">Siswa/Guru dianggap terlambat jika absen melebihi batas jam masuk + toleransi.</p>
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit"
                          className="w-full py-3.5 bg-blue-500/10 text-blue-400 font-medium rounded-xl hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
                        >
                          Simpan Jam Kerja
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Pengaturan Geofencing */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-normal text-white">Lokasi & Geofencing</h3>
                        <p className="text-sm text-gray-400 mt-1">Koordinat dan radius absensi.</p>
                      </div>
                    </div>

                    <form className="space-y-5" onSubmit={(e) => {
                      e.preventDefault();
                      showNotification('Pengaturan lokasi berhasil disimpan!', 'text-emerald-400');
                    }}>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">Latitude</label>
                          <input 
                            type="text" 
                            defaultValue="-6.123456"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-amber-500/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-gray-400 ml-1">Longitude</label>
                          <input 
                            type="text" 
                            defaultValue="106.123456"
                            className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-amber-500/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 ml-1">Radius Maksimal (Meter)</label>
                        <input 
                          type="number" 
                          defaultValue="100"
                          min="10"
                          className="w-full px-4 py-3 bg-[#05050A] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-amber-500/50"
                        />
                        <p className="text-[10px] text-gray-500 ml-1 mt-1">Jarak maksimum dari titik koordinat sekolah agar bisa melakukan absensi online.</p>
                      </div>

                      <div className="pt-2">
                        <button 
                          type="submit"
                          className="w-full py-3.5 bg-amber-500/10 text-amber-400 font-medium rounded-xl hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer"
                        >
                          Simpan Geofencing
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <FolderDown className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-normal text-white">Pusat Laporan Menyeluruh</h3>
                      <p className="text-sm text-gray-400 mt-1">Unduh rekapitulasi data absensi seluruh guru dan siswa.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Guru Export Card */}
                    <div className="bg-[#05050A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
                      
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                            <Users className="w-5 h-5 text-purple-400" />
                          </div>
                          <h4 className="text-lg font-medium text-white mb-1">Laporan Absensi Guru</h4>
                          <p className="text-sm text-gray-400">Rekap kehadiran seluruh guru, termasuk status izin, sakit, dan tanpa keterangan.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          <select className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors">
                            <option value="06-2026">Juni 2026</option>
                            <option value="05-2026">Mei 2026</option>
                            <option value="04-2026">April 2026</option>
                            <option value="all">Semua Data (Tahun Ajaran Aktif)</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              const doc = new jsPDF();
                              doc.setFontSize(16);
                              doc.text('Laporan Rekapitulasi Absensi Guru', 14, 22);
                              doc.setFontSize(11);
                              doc.text(`Periode: Juni 2026`, 14, 30);
                              doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 36);
                              
                              autoTable(doc, {
                                startY: 45,
                                head: [['No', 'Nama Guru', 'NIP', 'Kehadiran (%)', 'Izin', 'Sakit', 'Alpa']],
                                body: [
                                  ['1', 'Tb. Saiful Bahri, S.Pd.', '197601142005011004', '95%', '1', '0', '0'],
                                  ['2', 'Siti Aminah, M.Pd.', '198003122008012005', '98%', '0', '1', '0'],
                                  ['3', 'Budi Santoso, S.Kom.', '198505212010011002', '92%', '2', '0', '1'],
                                ],
                                theme: 'grid',
                                headStyles: { fillColor: [168, 85, 247] },
                              });
                              
                              const finalY4 = (doc as any).lastAutoTable.finalY || 100;
                              doc.text(`Pabuaran, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, finalY4 + 20);
                              doc.text('Kepala Sekolah', 130, finalY4 + 28);
                              doc.text('Drs. H. Ahmad Sunarya, M.Pd', 130, finalY4 + 50);
                              doc.text('NIP. 196503121989021003', 130, finalY4 + 56);

                              doc.save('Rekap_Absen_Guru_Juni_2026.pdf');
                              showNotification('Laporan Guru (PDF) berhasil diunduh!', 'text-emerald-400');
                            }}
                            className="flex-1 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>PDF</span>
                          </button>
                          <button 
                            onClick={() => {
                              const headers = ['No', 'Nama Guru', 'NIP', 'Kehadiran (%)', 'Izin', 'Sakit', 'Alpa'];
                              const data = [
                                ['1', 'Tb. Saiful Bahri, S.Pd.', '197601142005011004', '95%', '1', '0', '0'],
                                ['2', 'Siti Aminah, M.Pd.', '198003122008012005', '98%', '0', '1', '0'],
                                ['3', 'Budi Santoso, S.Kom.', '198505212010011002', '92%', '2', '0', '1'],
                              ];
                              const csvContent = [
                                headers.join(','),
                                ...data.map(row => row.join(','))
                              ].join('\n');
                              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = 'Rekap_Absen_Guru_Juni_2026.csv';
                              link.click();
                              showNotification('Laporan Guru (Excel/CSV) berhasil diunduh!', 'text-emerald-400');
                            }}
                            className="flex-1 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Excel</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Siswa Export Card */}
                    <div className="bg-[#05050A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
                      
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                            <GraduationCap className="w-5 h-5 text-blue-400" />
                          </div>
                          <h4 className="text-lg font-medium text-white mb-1">Laporan Absensi Siswa</h4>
                          <p className="text-sm text-gray-400">Rekap kehadiran siswa per kelas atau seluruh siswa secara kumulatif.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <select className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
                              <option value="all">Semua Kelas</option>
                              <option value="7A">Kelas 7A</option>
                              <option value="7B">Kelas 7B</option>
                              <option value="8A">Kelas 8A</option>
                              <option value="9A">Kelas 9A</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          <div className="relative">
                            <select className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
                              <option value="06-2026">Juni 2026</option>
                              <option value="05-2026">Mei 2026</option>
                              <option value="04-2026">April 2026</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              const doc = new jsPDF();
                              doc.setFontSize(16);
                              doc.text('Laporan Rekapitulasi Absensi Siswa', 14, 22);
                              doc.setFontSize(11);
                              doc.text(`Kelas: Semua Kelas`, 14, 30);
                              doc.text(`Periode: Juni 2026`, 14, 36);
                              doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 42);
                              
                              autoTable(doc, {
                                startY: 50,
                                head: [['No', 'Nama Siswa', 'NIS', 'Kelas', 'H', 'I', 'S', 'A']],
                                body: [
                                  ['1', 'Ahmad Rizki', '24001', '7A', '20', '0', '0', '0'],
                                  ['2', 'Budi Santoso', '24002', '7A', '18', '1', '1', '0'],
                                  ['3', 'Citra Kirana', '24003', '7B', '19', '0', '1', '0'],
                                  ['4', 'Dewi Lestari', '24004', '8A', '20', '0', '0', '0'],
                                ],
                                theme: 'grid',
                                headStyles: { fillColor: [59, 130, 246] },
                              });
                              
                              const finalY5 = (doc as any).lastAutoTable.finalY || 100;
                              doc.text(`Pabuaran, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 130, finalY5 + 20);
                              doc.text('Kepala Sekolah', 130, finalY5 + 28);
                              doc.text('Drs. H. Ahmad Sunarya, M.Pd', 130, finalY5 + 50);
                              doc.text('NIP. 196503121989021003', 130, finalY5 + 56);

                              doc.save('Rekap_Absen_Siswa_Juni_2026.pdf');
                              showNotification('Laporan Siswa (PDF) berhasil diunduh!', 'text-emerald-400');
                            }}
                            className="flex-1 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>PDF</span>
                          </button>
                          <button 
                            onClick={() => {
                              const headers = ['No', 'Nama Siswa', 'NIS', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alpa'];
                              const data = [
                                ['1', 'Ahmad Rizki', '24001', '7A', '20', '0', '0', '0'],
                                ['2', 'Budi Santoso', '24002', '7A', '18', '1', '1', '0'],
                                ['3', 'Citra Kirana', '24003', '7B', '19', '0', '1', '0'],
                                ['4', 'Dewi Lestari', '24004', '8A', '20', '0', '0', '0'],
                              ];
                              const csvContent = [
                                headers.join(','),
                                ...data.map(row => row.join(','))
                              ].join('\n');
                              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                              const link = document.createElement('a');
                              link.href = URL.createObjectURL(blob);
                              link.download = 'Rekap_Absen_Siswa_Juni_2026.csv';
                              link.click();
                              showNotification('Laporan Siswa (Excel/CSV) berhasil diunduh!', 'text-emerald-400');
                            }}
                            className="flex-1 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Excel</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#05050A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-50 flex justify-around items-center shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        {userRole === 'guru' && (
          <>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 mb-1 ${activeTab === 'dashboard' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'schedule' 
                  ? 'bg-orange-500/10 text-orange-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Calendar className={`w-5 h-5 mb-1 ${activeTab === 'schedule' ? 'drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Jadwal</span>
            </button>
            <button
              onClick={() => setActiveTab('class-attendance')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'class-attendance' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FileText className={`w-5 h-5 mb-1 ${activeTab === 'class-attendance' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Riwayat</span>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'scan' 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <QrCode className={`w-5 h-5 mb-1 ${activeTab === 'scan' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Scan Siswa</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'profile' 
                  ? 'bg-purple-500/10 text-purple-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <User className={`w-5 h-5 mb-1 ${activeTab === 'profile' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Profile</span>
            </button>
          </>
        )}

        {userRole === 'siswa' && (
          <>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'scan' 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <QrCode className={`w-5 h-5 mb-1 ${activeTab === 'scan' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Absen</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'card' 
                  ? 'bg-purple-500/10 text-purple-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <User className={`w-5 h-5 mb-1 ${activeTab === 'card' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Kartu</span>
            </button>
          </>
        )}

        {userRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 mb-1 ${activeTab === 'analytics' ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Analisis</span>
            </button>
            <button
              onClick={() => setActiveTab('izin')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'izin' 
                  ? 'bg-amber-500/10 text-amber-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Coffee className={`w-5 h-5 mb-1 ${activeTab === 'izin' ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Izin</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'users' 
                  ? 'bg-purple-500/10 text-purple-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Users className={`w-5 h-5 mb-1 ${activeTab === 'users' ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Daftar</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'settings' 
                  ? 'bg-slate-500/10 text-slate-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Settings className={`w-5 h-5 mb-1 ${activeTab === 'settings' ? 'drop-shadow-[0_0_8px_rgba(100,116,139,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Sistem</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                activeTab === 'export' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FolderDown className={`w-5 h-5 mb-1 ${activeTab === 'export' ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
              <span className="text-[10px] font-normal">Laporan</span>
            </button>
          </>
        )}
      </nav>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#05050A]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className={`p-1 rounded-full bg-[#05050A] shadow-inner ${notification.color}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-normal text-sm text-gray-100">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Edit/Add Schedule */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[105] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0D0D19] border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <h5 className="font-normal text-white text-lg mb-4">{editingSchedule.id ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</h5>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">HARI</label>
                <select 
                  value={editingSchedule.day} 
                  onChange={(e) => setEditingSchedule({...editingSchedule, day: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-orange-500 appearance-none"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">{isTeacherRole ? 'JAM MENGAJAR' : 'JAM TUGAS'}</label>
                <input type="text" value={editingSchedule.time} onChange={(e) => setEditingSchedule({...editingSchedule, time: e.target.value})} placeholder={isTeacherRole ? "Contoh: 07:30 - 09:00" : "Contoh: 08:00 - 16:00"} className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">{isTeacherRole ? 'MATA PELAJARAN' : 'URAIAN TUGAS'}</label>
                <input type="text" value={editingSchedule.subject} onChange={(e) => setEditingSchedule({...editingSchedule, subject: e.target.value})} placeholder={isTeacherRole ? "Contoh: Matematika" : "Contoh: Administrasi TU / Patroli"} className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">{isTeacherRole ? 'KELAS' : 'AREA / LOKASI TUGAS'}</label>
                <input type="text" value={editingSchedule.class} onChange={(e) => setEditingSchedule({...editingSchedule, class: e.target.value})} placeholder={isTeacherRole ? "Contoh: VII A" : "Contoh: Kantor TU / Gerbang Depan"} className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowScheduleModal(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-sm transition-colors cursor-pointer border border-white/10">Batal</button>
                <button onClick={handleSaveSchedule} className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer">Simpan Jadwal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Adding data */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[105] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0D0D19] border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <h5 className="font-normal text-white text-lg mb-4">Form Tambah Guru / Staff Baru</h5>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NAMA LENGKAP PEGAWAI</label>
                <input type="text" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} placeholder="Contoh: Tb. Saiful Bahri, S.Pd." className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NIP (NOMOR INDUK PEGAWAI)</label>
                <input type="text" value={newTeacherNip} onChange={(e) => setNewTeacherNip(e.target.value)} placeholder="Contoh: 198501142010..." className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">JABATAN / ROLE</label>
                <select 
                  value={newTeacherRole} 
                  onChange={(e) => setNewTeacherRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-emerald-500 appearance-none"
                >
                  <option value="Guru Mapel">Guru Mapel</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Wakasek Kurikulum">Wakasek Kurikulum</option>
                  <option value="Staff Tata Usaha (TU)">Staff Tata Usaha (TU)</option>
                  <option value="Penjaga Sekolah / OB">Penjaga Sekolah / OB</option>
                  <option value="Petugas Keamanan (Satpam)">Petugas Keamanan (Satpam)</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">BIDANG TUGAS / MAPEL</label>
                <input type="text" value={newTeacherMapel} onChange={(e) => setNewTeacherMapel(e.target.value)} placeholder="Contoh: Matematika / Administrasi" className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddTeacherModal(false)} className="px-4 py-2 text-gray-400 hover:text-white text-xs font-normal cursor-pointer">Batal</button>
              <button
                onClick={() => {
                  if (!newTeacherName || !newTeacherNip) return;
                  const newTeacher = { name: newTeacherName, nip: newTeacherNip, role: newTeacherRole, mapel: newTeacherMapel || 'Umum', status: 'Aktif' };
                  setTeachers(prev => [newTeacher, ...prev]);
                  saveTeacherSync(newTeacher);
                  showNotification(`Pegawai ${newTeacherName} berhasil didaftarkan!`, 'text-emerald-400');
                  setNewTeacherName('');
                  setNewTeacherNip('');
                  setNewTeacherMapel('');
                  setNewTeacherRole('Guru Mapel');
                  setShowAddTeacherModal(false);
                }}
                className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-xs font-normal cursor-pointer"
              >
                Simpan Pegawai
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[105] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0D0D19] border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <h5 className="font-normal text-white text-lg mb-4">Form Tambah Siswa Baru</h5>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NAMA LENGKAP SISWA</label>
                <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Contoh: Ahmad Zakaria" className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NIS (NOMOR INDUK SISWA)</label>
                <input type="text" value={newStudentNis} onChange={(e) => setNewStudentNis(e.target.value)} placeholder="Contoh: 24009" className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">KELAS</label>
                <input type="text" value={newStudentKelas} onChange={(e) => setNewStudentKelas(e.target.value)} placeholder="Contoh: VII - B" className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddStudentModal(false)} className="px-4 py-2 text-gray-400 hover:text-white text-xs font-normal cursor-pointer">Batal</button>
              <button
                onClick={() => {
                  if (!newStudentName || !newStudentNis) return;
                  const newStudent = { name: newStudentName, nis: newStudentNis, kelas: newStudentKelas || 'VII - A', barcode: `SIS-${newStudentNis}` };
                  setStudents(prev => [newStudent, ...prev]);
                  saveStudentSync(newStudent);
                  showNotification(`Siswa ${newStudentName} berhasil didaftarkan!`, 'text-blue-400');
                  setNewStudentName('');
                  setNewStudentNis('');
                  setNewStudentKelas('');
                  setShowAddStudentModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-normal cursor-pointer"
              >
                Simpan Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditTeacherModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[105] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0D0D19] border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <h5 className="font-normal text-white text-lg mb-4">Edit Data Guru / Staff</h5>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NAMA LENGKAP PEGAWAI</label>
                <input 
                  type="text" 
                  value={editingTeacher.name} 
                  onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})} 
                  placeholder="Contoh: Tb. Saiful Bahri, S.Pd." 
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NIP (NOMOR INDUK PEGAWAI)</label>
                <input 
                  type="text" 
                  value={editingTeacher.nip} 
                  disabled
                  title="NIP tidak dapat diubah"
                  className="w-full px-4 py-2.5 bg-white/5 opacity-50 rounded-xl text-sm border border-white/10 text-gray-400 outline-none cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">JABATAN / ROLE</label>
                <select 
                  value={editingTeacher.role || 'Guru Mapel'} 
                  onChange={(e) => setEditingTeacher({...editingTeacher, role: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-emerald-500 appearance-none"
                >
                  <option value="Guru Mapel">Guru Mapel</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="Wakasek Kurikulum">Wakasek Kurikulum</option>
                  <option value="Staff Tata Usaha (TU)">Staff Tata Usaha (TU)</option>
                  <option value="Penjaga Sekolah / OB">Penjaga Sekolah / OB</option>
                  <option value="Petugas Keamanan (Satpam)">Petugas Keamanan (Satpam)</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">BIDANG TUGAS / MAPEL</label>
                <input 
                  type="text" 
                  value={editingTeacher.mapel} 
                  onChange={(e) => setEditingTeacher({...editingTeacher, mapel: e.target.value})} 
                  placeholder="Contoh: Matematika" 
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-emerald-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowEditTeacherModal(false); setEditingTeacher(null); }} className="px-4 py-2 text-gray-400 hover:text-white text-xs font-normal cursor-pointer">Batal</button>
              <button
                onClick={() => {
                  if (!editingTeacher.name) return;
                  setTeachers(prev => prev.map(t => t.nip === editingTeacher.nip ? editingTeacher : t));
                  saveTeacherSync(editingTeacher);
                  showNotification(`Data Pegawai ${editingTeacher.name} berhasil diperbarui!`, 'text-emerald-400');
                  setShowEditTeacherModal(false);
                  setEditingTeacher(null);
                }}
                className="px-4 py-2 bg-emerald-500 text-black rounded-lg text-xs font-normal cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[105] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0D0D19] border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <h5 className="font-normal text-white text-lg mb-4">Edit Data Siswa</h5>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NAMA LENGKAP SISWA</label>
                <input 
                  type="text" 
                  value={editingStudent.name} 
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} 
                  placeholder="Contoh: Ahmad Zakaria" 
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">NIS (NOMOR INDUK SISWA)</label>
                <input 
                  type="text" 
                  value={editingStudent.nis} 
                  disabled
                  title="NIS tidak dapat diubah"
                  className="w-full px-4 py-2.5 bg-white/5 opacity-50 rounded-xl text-sm border border-white/10 text-gray-400 outline-none cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-gray-400 mb-1">KELAS</label>
                <input 
                  type="text" 
                  value={editingStudent.kelas} 
                  onChange={(e) => setEditingStudent({...editingStudent, kelas: e.target.value})} 
                  placeholder="Contoh: VII - B" 
                  className="w-full px-4 py-2.5 bg-white/5 rounded-xl text-sm border border-white/10 text-white focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowEditStudentModal(false); setEditingStudent(null); }} className="px-4 py-2 text-gray-400 hover:text-white text-xs font-normal cursor-pointer">Batal</button>
              <button
                onClick={() => {
                  if (!editingStudent.name) return;
                  setStudents(prev => prev.map(s => s.nis === editingStudent.nis ? editingStudent : s));
                  saveStudentSync(editingStudent);
                  showNotification(`Data Siswa ${editingStudent.name} berhasil diperbarui!`, 'text-blue-400');
                  setShowEditStudentModal(false);
                  setEditingStudent(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-normal cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[#0a0a0f] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-6 relative"
            >
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors backdrop-blur-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 shadow-[0_0_30px_rgba(244,63,94,0.15)] animate-pulse">
                  <LogOut className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-normal text-white tracking-tight">Konfirmasi Keluar</h3>
                <p className="text-sm text-gray-400 mt-2.5 leading-relaxed">
                  Apakah Anda yakin ingin keluar dari akun ini? Anda harus memasukkan kredensial kembali untuk mengakses portal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-normal transition-all border border-white/5 text-sm cursor-pointer active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setUserRole('guest');
                    showNotification('Berhasil keluar (logout) dari aplikasi', 'text-rose-400');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-normal transition-all shadow-[0_4px_25px_rgba(225,29,72,0.3)] text-sm cursor-pointer active:scale-[0.98]"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Modal */}
      <AnimatePresence>
        {modalState.show && modalState.type && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full ${modalState.type.id === 'mengajar' || modalState.type.id === 'izin' ? 'max-w-[420px]' : 'max-w-sm'} bg-[#0a0a0f] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative transition-all duration-300`}
            >
              {/* Close Button */}
              <button 
                onClick={closeAttendanceModal}
                className="absolute top-5 right-5 z-20 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>

              {modalState.type.id === 'izin' ? (
                /* CUSTOM HEADER FOR PENGAJUAN IZIN */
                <div className="p-6 pb-2 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h3 className="font-normal text-2xl text-white tracking-tight">Pengajuan Izin</h3>
                </div>
              ) : modalState.type.id === 'mengajar' ? (
                /* CUSTOM HEADER FOR SESI MENGAJAR */
                <div className="p-6 pb-2 flex items-center gap-3">
                  <GraduationCap className="w-7 h-7 text-amber-500" />
                  <h3 className="font-normal text-2xl text-white tracking-tight">Sesi Mengajar</h3>
                </div>
              ) : (
                /* REGULAR HEADER FOR ABSEN */
                <div className="p-5 border-b border-white/10 bg-white/5 flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-black/50 ${modalState.type.glow}`}>
                    <modalState.type.icon className={`w-5 h-5 ${modalState.type.color}`} />
                  </div>
                  <div>
                    <h3 className="font-normal text-lg text-white">{modalState.type.label}</h3>
                    <p className="text-xs text-gray-400">Verifikasi kehadiran Anda</p>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
                {modalState.type.id === 'mengajar' ? (
                  /* =======================================================
                     SESI MENGAJAR FORM
                     ======================================================= */
                  <>
                    {/* Read-Only Identity Card Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center min-h-[72px]">
                        <span className="text-[10px] tracking-wider uppercase font-normal text-gray-500">IDENTITAS GURU</span>
                        <span className="text-sm font-normal text-white truncate mt-1">{nama}</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center min-h-[72px]">
                        <span className="text-[10px] tracking-wider uppercase font-normal text-gray-500">NIP (VERIFIED)</span>
                        <span className="text-sm font-normal font-mono text-white truncate mt-1">{nip}</span>
                      </div>
                    </div>

                    {/* Time fields (Jam Mulai / Jam Selesai) Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-blue-400 font-normal tracking-wider text-[10px] uppercase">
                          <Clock className="w-3.5 h-3.5" />
                          <span>JAM MULAI</span>
                        </div>
                        <div className="relative">
                          <select 
                            value={jamMulai} 
                            onChange={(e) => setJamMulai(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-10 py-3.5 text-xl font-normal text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                          >
                            {["07.00", "07.30", "08.00", "08.30", "08.53", "09.00", "09.30", "10.00", "10.30", "11.00", "11.30", "12.00", "12.30", "13.00", "13.30", "14.00"].map((t) => (
                              <option key={t} value={t} className="bg-[#0a0a0f] text-white font-normal">{t}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-blue-400 font-normal tracking-wider text-[10px] uppercase">
                          <Clock className="w-3.5 h-3.5" />
                          <span>JAM SELESAI</span>
                        </div>
                        <div className="relative">
                          <select 
                            value={jamSelesai} 
                            onChange={(e) => setJamSelesai(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-10 py-3.5 text-xl font-normal text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                          >
                            {["07.30", "08.00", "08.30", "09.00", "09.30", "09.53", "10.00", "10.30", "11.00", "11.30", "12.00", "12.30", "13.00", "13.30", "14.00", "14.30", "15.00"].map((t) => (
                              <option key={t} value={t} className="bg-[#0a0a0f] text-white font-normal">{t}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Room and Subject (Ruang Kelas / Mata Pelajaran) Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-blue-400 font-normal tracking-wider text-[10px] uppercase">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>RUANG / KELAS</span>
                        </div>
                        <div className="relative">
                          <select 
                            value={ruangKelas} 
                            onChange={(e) => setRuangKelas(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-10 py-3 text-base font-normal text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                          >
                            {["VII - A", "VII - B", "VII - C", "VIII - A", "VIII - B", "VIII - C", "IX - A", "IX - B", "IX - C"].map((r) => (
                              <option key={r} value={r} className="bg-[#0a0a0f] text-white font-normal">{r}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-blue-400 font-normal tracking-wider text-[10px] uppercase">
                          <FileText className="w-3.5 h-3.5" />
                          <span>MATA PELAJARAN</span>
                        </div>
                        <div className="relative">
                          <select 
                            value={mataPelajaran} 
                            onChange={(e) => setMataPelajaran(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-10 py-3 text-base font-normal text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                          >
                            {["PAI", "Matematika", "Bahasa Indonesia", "Bahasa Inggris", "IPA", "IPS", "PJOK", "Seni Budaya", "PPKn"].map((m) => (
                              <option key={m} value={m} className="bg-[#0a0a0f] text-white font-normal">{m}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Camera Photo section with floating pill button "BUKTI NGAJAR" */}
                    <div className="space-y-1">
                      <div className="relative rounded-[28px] overflow-hidden bg-black aspect-[3/4] border border-white/10 flex flex-col items-center justify-center text-center shadow-lg">
                        {photo ? (
                          <img src={photo} alt="Bukti Mengajar" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            {!stream && !cameraError && (
                              <div className="flex flex-col items-center gap-2">
                                <Camera className="w-8 h-8 text-gray-600 animate-pulse" />
                                <p className="text-xs text-gray-500">Menghubungkan kamera...</p>
                              </div>
                            )}
                            {cameraError && (
                              <div className="flex flex-col items-center gap-2 p-4">
                                <Camera className="w-8 h-8 text-red-500/50" />
                                <p className="text-xs text-red-400 font-normal">{cameraError}</p>
                              </div>
                            )}
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              muted 
                              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${stream ? 'opacity-100' : 'opacity-0'}`}
                            />
                          </>
                        )}
                        
                        {/* Elegant Guide border overlay */}
                        <div className="absolute inset-4 border border-amber-500/20 rounded-[20px] pointer-events-none"></div>

                        {/* Floating BUKTI NGAJAR Button overlay */}
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-full px-6 flex justify-center">
                          {photo ? (
                            <button 
                              type="button"
                              onClick={retakePhoto}
                              className="py-3 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-xs uppercase tracking-wider font-normal shadow-[0_4px_20px_rgba(245,158,11,0.4)] flex items-center gap-2 transition-all active:scale-95"
                            >
                              <Camera className="w-4 h-4 shrink-0" /> Ulangi Bukti Ngajar
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={takePhoto}
                              disabled={!stream}
                              className="py-3 px-6 rounded-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-400 text-black text-xs uppercase tracking-wider font-normal shadow-[0_4px_20px_rgba(245,158,11,0.4)] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Camera className="w-4 h-4 shrink-0" /> Bukti Ngajar
                            </button>
                          )}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    </div>

                    {/* Bottom orange-yellow action button */}
                    <button
                      onClick={confirmAttendance}
                      disabled={!photo}
                      className="w-full py-4 mt-2 rounded-[20px] bg-[#F59E0B] hover:bg-amber-500 text-black font-normal transition-all shadow-[0_4px_25px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-base active:scale-[0.98]"
                    >
                      Konfirmasi Sesi Mengajar
                    </button>
                  </>
                ) : modalState.type.id === 'izin' ? (
                  /* =======================================================
                     PENGAJUAN IZIN FORM (Izin / Sakit / Dinas)
                     ======================================================= */
                  <>
                    {/* Read-Only Identity Card Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center min-h-[72px]">
                        <span className="text-[10px] tracking-wider uppercase font-normal text-gray-500">IDENTITAS GURU</span>
                        <span className="text-sm font-normal text-white truncate mt-1">{nama}</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col justify-center min-h-[72px]">
                        <span className="text-[10px] tracking-wider uppercase font-normal text-gray-500">NIP (VERIFIED)</span>
                        <span className="text-sm font-normal font-mono text-white truncate mt-1">{nip}</span>
                      </div>
                    </div>

                    {/* Type selection: Izin, Sakit, Dinas */}
                    <div className="grid grid-cols-3 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
                      {(['Izin', 'Sakit', 'Dinas'] as const).map((tab) => {
                        const isActive = izinType === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setIzinType(tab)}
                            className={`py-2.5 rounded-xl text-sm font-normal tracking-wide transition-all ${
                              isActive 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>

                    {/* Dropdowns for dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-normal tracking-wider text-gray-500 uppercase">TANGGAL MULAI</span>
                        <div className="relative">
                          <select 
                            value={izinMulai} 
                            onChange={(e) => setIzinMulai(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-normal text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                          >
                            {["Senin, 29 Juni", "Selasa, 30 Juni", "Rabu, 01 Juli", "Kamis, 02 Juli", "Jumat, 03 Juli", "Sabtu, 04 Juli"].map((d) => (
                              <option key={d} value={d} className="bg-[#0a0a0f] text-white font-normal">{d}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-normal tracking-wider text-gray-500 uppercase">TANGGAL SELESAI</span>
                        <div className="relative">
                          <select 
                            value={izinSelesai} 
                            onChange={(e) => setIzinSelesai(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-normal text-white focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                          >
                            {["Senin, 29 Juni", "Selasa, 30 Juni", "Rabu, 01 Juli", "Kamis, 02 Juli", "Jumat, 03 Juli", "Sabtu, 04 Juli", "Senin, 06 Juli"].map((d) => (
                              <option key={d} value={d} className="bg-[#0a0a0f] text-white font-normal">{d}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Alasan Textarea */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-normal tracking-wider text-gray-500 uppercase">ALASAN PENGAJUAN</span>
                      <textarea
                        value={izinAlasan}
                        onChange={(e) => setIzinAlasan(e.target.value)}
                        placeholder="Tuliskan detail alasan..."
                        rows={4}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-normal resize-none"
                      />
                    </div>

                    {/* Lampiran Upload (Optional) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-normal tracking-wider text-indigo-400 uppercase">LAMPIRAN (OPTIONAL)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="izin-file-input" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setIzinAttachment(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="izin-file-input"
                        className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-indigo-500/40 bg-white/[0.02] hover:bg-white/[0.04] p-6 rounded-2xl cursor-pointer transition-all gap-2 group min-h-[140px]"
                      >
                        {izinAttachment ? (
                          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
                            <img src={izinAttachment} alt="Lampiran" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-normal text-white bg-black/60 px-3 py-1.5 rounded-full">Ganti File</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-white/5 rounded-full text-gray-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-gray-400 font-normal group-hover:text-gray-300">Klik untuk pilih foto dari galeri</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={confirmAttendance}
                      className="w-full py-4 rounded-[20px] bg-indigo-600 hover:bg-indigo-500 text-white font-normal transition-all shadow-[0_4px_25px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 text-base active:scale-[0.98] mt-2"
                    >
                      Kirim Pengajuan
                    </button>
                  </>
                ) : (
                  /* =======================================================
                     REGULAR ATTENDANCE FORM (ABSEN DATANG / ABSEN PULANG)
                     ======================================================= */
                  <>
                    {/* Form Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-normal text-gray-400 mb-1">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input 
                            type="text" 
                            value={nama} 
                            onChange={(e) => setNama(e.target.value)} 
                            placeholder="Masukkan nama lengkap" 
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-normal"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-normal text-gray-400 mb-1">NIP</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-normal font-mono text-gray-500">NIP</div>
                          <input 
                            type="text" 
                            value={nip} 
                            onChange={(e) => setNip(e.target.value)} 
                            placeholder="Masukkan NIP" 
                            className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono font-normal"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live GPS Info */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-gray-400">Live GPS</span>
                        <button 
                          type="button"
                          onClick={getLocation}
                          className="text-[10px] font-normal text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          <Navigation className="w-2.5 h-2.5" /> Perbarui GPS
                        </button>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="relative flex-shrink-0">
                          <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono font-normal text-gray-200 truncate">{location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Live Selfie Section */}
                    <div className="space-y-1">
                      <span className="text-xs font-normal text-gray-400 block">Live Selfie</span>
                      <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] border border-white/10 flex flex-col items-center justify-center text-center">
                        {photo ? (
                          <img src={photo} alt="Foto Absen" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            {!stream && !cameraError && (
                              <div className="flex flex-col items-center gap-1">
                                <Camera className="w-6 h-6 text-gray-600 animate-pulse" />
                                <p className="text-[10px] text-gray-500">Kamera dinonaktifkan</p>
                              </div>
                            )}
                            {cameraError && (
                              <div className="flex flex-col items-center gap-1 p-2">
                                <Camera className="w-6 h-6 text-red-500/50" />
                                <p className="text-[10px] text-red-400 font-normal">{cameraError}</p>
                              </div>
                            )}
                            <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              muted 
                              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${stream ? 'opacity-100' : 'opacity-0'}`}
                            />
                          </>
                        )}
                        {/* Overlay Guides */}
                        <div className="absolute inset-0 border-[2px] border-white/20 rounded-2xl m-3 pointer-events-none"></div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>

                      {/* Photo Actions */}
                      <div className="flex justify-center pt-1.5">
                        {photo ? (
                          <button 
                            type="button"
                            onClick={retakePhoto}
                            className="py-1.5 px-3.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-normal text-white transition-colors border border-white/5 flex items-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" /> Ulangi Foto
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={takePhoto}
                            disabled={!stream}
                            className="py-1.5 px-3.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs font-normal text-blue-400 transition-colors border border-blue-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Camera className="w-3.5 h-3.5" /> Ambil Selfie
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={confirmAttendance}
                      disabled={!photo || !nama.trim() || !nip.trim()}
                      className={`w-full py-3 rounded-xl font-normal text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        modalState.type.id === 'datang' 
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' 
                          : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Kirim Kehadiran
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

