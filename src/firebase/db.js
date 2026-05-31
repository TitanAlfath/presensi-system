import { 
  db, 
  isFirebaseConfigured 
} from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';

const MOCK_RECEIPT_URL = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80';

// ==========================================
// MOCK DATA SEED
// ==========================================
const MOCK_PARTICIPANTS = [
  { nim: '2201010001', name: 'Zahra Amalia', faculty: 'Fakultas Teknik', prodi: 'Teknik Sipil', phoneNumber: '6281234567891', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Lunas', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010002', name: 'Rian Hidayat', faculty: 'Fakultas Ilmu Komputer', prodi: 'Teknik Informatika', phoneNumber: '6285712345672', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Menunggu Verifikasi', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010003', name: 'Ahmad Syarif', faculty: 'Fakultas Ilmu Komputer', prodi: 'Sistem Informasi', phoneNumber: '6289912345673', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Lunas', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010004', name: 'Dinda Lestari', faculty: 'Fakultas Ekonomi', prodi: 'Manajemen', phoneNumber: '6281312345674', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Lunas', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010005', name: 'Fikri Haikal', faculty: 'Fakultas Teknik', prodi: 'Teknik Elektro', phoneNumber: '6282212345675', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Menunggu Verifikasi', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010006', name: 'Lia Anggraini', faculty: 'Fakultas Ilmu Komputer', prodi: 'Teknik Informatika', phoneNumber: '6281212345676', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Ditolak', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010007', name: 'Budi Prasetyo', faculty: 'Fakultas Ilmu Komputer', prodi: 'Sistem Informasi', phoneNumber: '6285612345677', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Lunas', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010008', name: 'Siti Rahma', faculty: 'Fakultas Kedokteran', prodi: 'Pendidikan Dokter', phoneNumber: '6287712345678', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Lunas', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010009', name: 'Adit Pratama', faculty: 'Fakultas Hukum', prodi: 'Ilmu Hukum', phoneNumber: '6281912345679', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Menunggu Verifikasi', status: 'Belum Hadir', scannedAt: null },
  { nim: '2201010010', name: 'Nabila Putri', faculty: 'Fakultas Keguruan', prodi: 'Pendidikan Bahasa Inggris', phoneNumber: '6281212345680', paymentReceipt: MOCK_RECEIPT_URL, paymentStatus: 'Lunas', status: 'Belum Hadir', scannedAt: null }
];

// ==========================================
// LOCAL STORAGE SIMULATION ENGINE
// ==========================================
const getLocalData = () => {
  const data = localStorage.getItem('presensi_participants');
  if (!data) {
    localStorage.setItem('presensi_participants', JSON.stringify(MOCK_PARTICIPANTS));
    return MOCK_PARTICIPANTS;
  }
  return JSON.parse(data);
};

const setLocalData = (data) => {
  try {
    localStorage.setItem('presensi_participants', JSON.stringify(data));
    window.dispatchEvent(new Event('local-db-update'));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882) {
      console.warn('LocalStorage quota exceeded! Compressing large receipt strings...');
      // Find and downsize any massive pre-existing base64 receipt strings to reclaim space
      const optimizedData = data.map(p => {
        if (p.paymentReceipt && p.paymentReceipt.length > 80000) {
          console.log(`Auto-downsizing large receipt for NIM ${p.nim} (${p.paymentReceipt.length} chars)`);
          return {
            ...p,
            paymentReceipt: MOCK_RECEIPT_URL // Replace with lightweight Unsplash image
          };
        }
        return p;
      });

      try {
        localStorage.setItem('presensi_participants', JSON.stringify(optimizedData));
        window.dispatchEvent(new Event('local-db-update'));
        console.log('Successfully saved optimized participants list after quota recovery.');
      } catch (retryErr) {
        console.error('Failed to save even after initial optimization. Applying aggressive cleanup...');
        // Aggressively clear payment receipts for already approved (Lunas) participants
        const superLightData = optimizedData.map(p => {
          return {
            ...p,
            paymentReceipt: MOCK_RECEIPT_URL
          };
        });

        try {
          localStorage.setItem('presensi_participants', JSON.stringify(superLightData));
          window.dispatchEvent(new Event('local-db-update'));
          console.log('Successfully saved super-light list.');
        } catch (finalErr) {
          alert('Penyimpanan lokal browser Anda penuh. Silakan tekan tombol "Seed DB" pada dashboard admin untuk merestart database simulasinya.');
        }
      }
    } else {
      throw e;
    }
  }
};

// ==========================================
// CORE PUBLIC DATABASE API
// ==========================================

/**
 * Seeds initial participant list if collection is empty.
 */
export const seedInitialData = async (force = false) => {
  if (!isFirebaseConfigured) {
    if (force || !localStorage.getItem('presensi_participants')) {
      setLocalData(MOCK_PARTICIPANTS);
      console.log('Seeded local storage database.');
    }
    return true;
  }

  try {
    const participantsCol = collection(db, 'participants');
    const snapshot = await getDocs(participantsCol);
    
    if (snapshot.empty || force) {
      console.log('Seeding firestore database...');
      const batch = writeBatch(db);
      
      MOCK_PARTICIPANTS.forEach((participant) => {
        const docRef = doc(participantsCol, participant.nim);
        batch.set(docRef, {
          nim: participant.nim,
          name: participant.name,
          faculty: participant.faculty,
          prodi: participant.prodi,
          phoneNumber: participant.phoneNumber,
          paymentReceipt: participant.paymentReceipt,
          paymentStatus: participant.paymentStatus,
          status: 'Belum Hadir',
          scannedAt: null
        });
      });
      
      await batch.commit();
      console.log('Seeding completed.');
    }
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

/**
 * Subscribes to the participant collection in realtime.
 */
export const listenToParticipants = (callback) => {
  if (!isFirebaseConfigured) {
    callback(getLocalData());
    
    const handleUpdate = () => {
      callback(getLocalData());
    };
    
    window.addEventListener('local-db-update', handleUpdate);
    return () => {
      window.removeEventListener('local-db-update', handleUpdate);
    };
  }

  const participantsCol = collection(db, 'participants');
  const q = query(participantsCol, orderBy('name', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        ...data,
        scannedAt: data.scannedAt ? data.scannedAt.toDate().toISOString() : null
      });
    });
    callback(list);
  }, (error) => {
    console.error("Realtime listener failed:", error);
  });
};

/**
 * Adds a new student participant manually (from admin dashboard).
 */
export const addCustomParticipant = async (nim, name, faculty, prodi = 'Teknik Informatika', phoneNumber = '6281234567890', category = 'Peserta') => {
  const cleanedNIM = nim.trim();
  const cleanedName = name.trim();
  const cleanedFaculty = faculty.trim();
  const cleanedProdi = prodi.trim();
  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const cleanedCategory = category.trim();

  if (!cleanedNIM || !cleanedName || !cleanedFaculty) {
    throw new Error('Semua data wajib diisi.');
  }

  if (!isFirebaseConfigured) {
    const data = getLocalData();
    if (data.some(p => p.nim === cleanedNIM)) {
      throw new Error(`Peserta dengan NIM ${cleanedNIM} sudah terdaftar.`);
    }
    const newParticipant = {
      nim: cleanedNIM,
      name: cleanedName,
      faculty: cleanedFaculty,
      prodi: cleanedProdi,
      phoneNumber: cleanedPhone,
      paymentReceipt: MOCK_RECEIPT_URL,
      paymentStatus: 'Menunggu Verifikasi', 
      status: 'Belum Hadir',
      scannedAt: null,
      category: cleanedCategory
    };
    setLocalData([...data, newParticipant]);
    return newParticipant;
  }

  const docRef = doc(db, 'participants', cleanedNIM);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    throw new Error(`Peserta dengan NIM ${cleanedNIM} sudah terdaftar.`);
  }

  const newParticipantData = {
    nim: cleanedNIM,
    name: cleanedName,
    faculty: cleanedFaculty,
    prodi: cleanedProdi,
    phoneNumber: cleanedPhone,
    paymentReceipt: MOCK_RECEIPT_URL,
    paymentStatus: 'Menunggu Verifikasi',
    status: 'Belum Hadir',
    scannedAt: null,
    category: cleanedCategory
  };

  await setDoc(docRef, newParticipantData);
  return newParticipantData;
};

/**
 * Registers a new participant from public form (requires Name, NIM, Prodi, Faculty, Phone Number, and Payment Receipt file).
 */
export const registerParticipant = async (nim, name, faculty, prodi, phoneNumber, receiptFileBase64, category = 'Peserta') => {
  const cleanedNIM = nim.trim();
  const cleanedName = name.trim();
  const cleanedFaculty = faculty.trim();
  const cleanedProdi = prodi.trim();
  const cleanedCategory = category.trim();
  
  // Clean phone number: remove non-digits, replace 08 with 628
  let cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanedPhone.startsWith('08')) {
    cleanedPhone = '628' + cleanedPhone.substring(2);
  }

  if (!cleanedNIM || !cleanedName || !cleanedFaculty || !cleanedProdi || !cleanedPhone || !receiptFileBase64) {
    throw new Error('Semua kolom formulir termasuk bukti pembayaran wajib diisi.');
  }

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const data = getLocalData();
    if (data.some(p => p.nim === cleanedNIM)) {
      throw new Error(`Pendaftaran Ditolak! NIM ${cleanedNIM} sudah terdaftar sebelumnya.`);
    }

    const newParticipant = {
      nim: cleanedNIM,
      name: cleanedName,
      faculty: cleanedFaculty,
      prodi: cleanedProdi,
      phoneNumber: cleanedPhone,
      paymentReceipt: receiptFileBase64,
      paymentStatus: 'Menunggu Verifikasi',
      status: 'Belum Hadir',
      scannedAt: null,
      category: cleanedCategory
    };

    setLocalData([...data, newParticipant]);
    return newParticipant;
  }

  const docRef = doc(db, 'participants', cleanedNIM);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    throw new Error(`Pendaftaran Ditolak! NIM ${cleanedNIM} sudah terdaftar sebelumnya.`);
  }

  const newParticipantData = {
    nim: cleanedNIM,
    name: cleanedName,
    faculty: cleanedFaculty,
    prodi: cleanedProdi,
    phoneNumber: cleanedPhone,
    paymentReceipt: receiptFileBase64,
    paymentStatus: 'Menunggu Verifikasi',
    status: 'Belum Hadir',
    scannedAt: null,
    category: cleanedCategory
  };

  await setDoc(docRef, newParticipantData);
  return newParticipantData;
};

/**
 * Imports an array of participant objects parsed from Excel sheet.
 */
export const importParticipantsFromExcel = async (rows) => {
  if (!rows || rows.length === 0) {
    throw new Error('Tidak ada data peserta yang ditemukan untuk diimpor.');
  }

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const data = getLocalData();
    const newData = [...data];
    let importCount = 0;

    rows.forEach((row) => {
      const cleanNim = row.nim.toString().trim();
      const cleanName = row.name.toString().trim();
      
      let cleanPhone = (row.phone || row.phoneNumber || row.whatsapp || '6281234567890').toString().replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('08')) {
        cleanPhone = '628' + cleanPhone.substring(2);
      }

      if (!cleanNim || !cleanName) return; 

      if (newData.some(p => p.nim === cleanNim)) return;

      newData.push({
        nim: cleanNim,
        name: cleanName,
        prodi: (row.prodi || 'Teknik Informatika').toString().trim(),
        faculty: (row.faculty || 'Fakultas Ilmu Komputer').toString().trim(),
        phoneNumber: cleanPhone,
        paymentReceipt: MOCK_RECEIPT_URL,
        paymentStatus: 'Lunas', 
        status: 'Belum Hadir',
        scannedAt: null,
        category: 'Peserta'
      });
      importCount++;
    });

    if (importCount === 0) {
      throw new Error('Semua data NIM dalam berkas Excel sudah terdaftar sebelumnya.');
    }

    setLocalData(newData);
    return importCount;
  }

  // Live Firestore Batch Write
  try {
    const participantsCol = collection(db, 'participants');
    const batch = writeBatch(db);
    let importCount = 0;

    const snapshot = await getDocs(participantsCol);
    const existingNims = new Set();
    snapshot.forEach(doc => existingNims.add(doc.id));

    rows.forEach((row) => {
      const cleanNim = row.nim.toString().trim();
      const cleanName = row.name.toString().trim();
      
      let cleanPhone = (row.phone || row.phoneNumber || row.whatsapp || '6281234567890').toString().replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('08')) {
        cleanPhone = '628' + cleanPhone.substring(2);
      }

      if (!cleanNim || !cleanName) return;
      if (existingNims.has(cleanNim)) return;

      const docRef = doc(participantsCol, cleanNim);
      batch.set(docRef, {
        nim: cleanNim,
        name: cleanName,
        prodi: (row.prodi || 'Teknik Informatika').toString().trim(),
        faculty: (row.faculty || 'Fakultas Ilmu Komputer').toString().trim(),
        phoneNumber: cleanPhone,
        paymentReceipt: MOCK_RECEIPT_URL,
        paymentStatus: 'Lunas',
        status: 'Belum Hadir',
        scannedAt: null,
        category: 'Peserta'
      });
      
      importCount++;
    });

    if (importCount === 0) {
      throw new Error('Semua data NIM dalam berkas Excel sudah terdaftar sebelumnya.');
    }

    await batch.commit();
    return importCount;
  } catch (error) {
    console.error('Excel batch write failed:', error);
    throw error;
  }
};

/**
 * Updates a participant completely (Edit CRUD Operation).
 */
export const updateParticipant = async (nim, originalNim, updatedData) => {
  const cleanedNim = nim.trim();
  
  if (!cleanedNim || !updatedData.name || !updatedData.faculty || !updatedData.prodi || !updatedData.phoneNumber || !updatedData.category) {
    throw new Error('Semua kolom data wajib diisi.');
  }

  // Clean phone
  let cleanPhone = updatedData.phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('08')) {
    cleanPhone = '628' + cleanPhone.substring(2);
  }
  updatedData.phoneNumber = cleanPhone;

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = getLocalData();
    
    if (cleanedNim !== originalNim && data.some(p => p.nim === cleanedNim)) {
      throw new Error(`Gagal mengubah data. NIM ${cleanedNim} sudah digunakan oleh peserta lain.`);
    }

    const index = data.findIndex(p => p.nim === originalNim);
    if (index === -1) throw new Error('Data peserta tidak ditemukan.');

    const updatedParticipant = {
      ...data[index],
      ...updatedData,
      nim: cleanedNim
    };

    const newData = [...data];
    if (cleanedNim !== originalNim) {
      newData.splice(index, 1);
      newData.push(updatedParticipant);
    } else {
      newData[index] = updatedParticipant;
    }

    setLocalData(newData);
    return updatedParticipant;
  }

  const originalDocRef = doc(db, 'participants', originalNim);
  const docSnap = await getDoc(originalDocRef);

  if (!docSnap.exists()) {
    throw new Error('Data peserta tidak ditemukan.');
  }

  const existingData = docSnap.data();
  const updatePayload = {
    ...existingData,
    ...updatedData,
    nim: cleanedNim
  };

  if (cleanedNim !== originalNim) {
    const newDocRef = doc(db, 'participants', cleanedNim);
    const newDocSnap = await getDoc(newDocRef);
    if (newDocSnap.exists()) {
      throw new Error(`Gagal mengubah data. NIM ${cleanedNim} sudah digunakan oleh peserta lain.`);
    }

    const batch = writeBatch(db);
    batch.delete(originalDocRef);
    batch.set(newDocRef, updatePayload);
    await batch.commit();
  } else {
    await updateDoc(originalDocRef, updatedData);
  }

  return updatePayload;
};

/**
 * Quick updates payment status.
 */
export const updatePaymentStatus = async (nim, status) => {
  if (!['Menunggu Verifikasi', 'Lunas', 'Ditolak'].includes(status)) {
    throw new Error('Status pembayaran tidak valid.');
  }

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const data = getLocalData();
    const index = data.findIndex(p => p.nim === nim);
    
    if (index === -1) throw new Error('Data peserta tidak ditemukan.');

    const updated = { ...data[index], paymentStatus: status };
    const newData = [...data];
    newData[index] = updated;
    
    setLocalData(newData);
    return updated;
  }

  const docRef = doc(db, 'participants', nim);
  await updateDoc(docRef, { paymentStatus: status });
  return { nim, paymentStatus: status };
};

/**
 * Deletes a participant completely.
 */
export const deleteParticipant = async (nim) => {
  if (!nim) throw new Error('NIM tidak valid.');

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const data = getLocalData();
    const filtered = data.filter(p => p.nim !== nim);
    setLocalData(filtered);
    return true;
  }

  const docRef = doc(db, 'participants', nim);
  await deleteDoc(docRef);
  return true;
};

/**
 * Self check-in from participant's phone.
 */
export const submitSelfAttendance = async (nim) => {
  const cleanedNIM = nim.trim();
  if (!cleanedNIM) {
    throw new Error('NIM wajib diisi.');
  }

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 600));

    const data = getLocalData();
    const index = data.findIndex(p => p.nim === cleanedNIM);
    
    if (index === -1) {
      throw new Error(`Presensi Gagal! NIM "${cleanedNIM}" tidak terdaftar sebagai peserta.`);
    }
    
    const participant = data[index];
    
    // Tamu Undangan: langsung bisa absen tanpa cek pembayaran
    if (participant.category !== 'Tamu') {
      if (participant.paymentStatus !== 'Lunas') {
        throw new Error(`Presensi Ditolak! Pembayaran Anda (${participant.name}) belum diverifikasi oleh panitia.`);
      }
    }
    
    if (participant.status === 'Hadir') {
      throw new Error(`Presensi Ditolak! Anda (${participant.name}) sudah melakukan presensi sebelumnya.`);
    }
    
    const updatedParticipant = {
      ...participant,
      status: 'Hadir',
      scannedAt: new Date().toISOString()
    };
    
    const newData = [...data];
    newData[index] = updatedParticipant;
    setLocalData(newData);
    return updatedParticipant;
  }

  const docRef = doc(db, 'participants', cleanedNIM);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`Presensi Gagal! NIM "${cleanedNIM}" tidak terdaftar sebagai peserta.`);
  }

  const participant = docSnap.data();
  
  // Tamu Undangan: langsung bisa absen tanpa cek pembayaran
  if (participant.category !== 'Tamu') {
    if (participant.paymentStatus !== 'Lunas') {
      throw new Error(`Presensi Ditolak! Pembayaran Anda (${participant.name}) belum diverifikasi oleh panitia.`);
    }
  }

  if (participant.status === 'Hadir') {
    throw new Error(`Presensi Ditolak! Anda (${participant.name}) sudah melakukan presensi sebelumnya.`);
  }

  const updatePayload = {
    status: 'Hadir',
    scannedAt: serverTimestamp()
  };
  await updateDoc(docRef, updatePayload);
  
  return {
    ...participant,
    status: 'Hadir',
    scannedAt: new Date().toISOString()
  };
};

/**
 * Resets all participant attendances back to absent.
 */
export const resetAttendance = async () => {
  if (!isFirebaseConfigured) {
    const data = getLocalData();
    const reset = data.map(p => ({ ...p, status: 'Belum Hadir', scannedAt: null }));
    setLocalData(reset);
    return true;
  }

  try {
    const participantsCol = collection(db, 'participants');
    const snapshot = await getDocs(participantsCol);
    const batch = writeBatch(db);
    
    snapshot.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'Belum Hadir',
        scannedAt: null
      });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Reset failed:', error);
    throw error;
  }
};

/**
 * Admin QR Scanner: mark attendance by NIM.
 * - Tamu Undangan: langsung bisa absen tanpa cek paymentStatus
 * - Peserta biasa: harus sudah Lunas
 */
export const markAttendance = async (nim) => {
  const cleanedNIM = nim.trim();
  if (!cleanedNIM) {
    throw new Error('QR Code tidak valid atau NIM kosong.');
  }

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const data = getLocalData();
    const index = data.findIndex(p => p.nim === cleanedNIM);

    if (index === -1) {
      throw new Error(`QR Tidak Dikenali! NIM "${cleanedNIM}" tidak terdaftar.`);
    }

    const participant = data[index];

    // Tamu Undangan: bebas absen tanpa verifikasi pembayaran
    if (participant.category !== 'Tamu') {
      if (participant.paymentStatus !== 'Lunas') {
        throw new Error(`Presensi Ditolak! Pembayaran "${participant.name}" belum diverifikasi admin.`);
      }
    }

    if (participant.status === 'Hadir') {
      throw new Error(`Sudah Tercatat! ${participant.name} (${participant.category === 'Tamu' ? 'Tamu Undangan' : 'Peserta'}) sudah presensi sebelumnya.`);
    }

    const updatedParticipant = {
      ...participant,
      status: 'Hadir',
      scannedAt: new Date().toISOString()
    };

    const newData = [...data];
    newData[index] = updatedParticipant;
    setLocalData(newData);
    return updatedParticipant;
  }

  // Firestore path
  const docRef = doc(db, 'participants', cleanedNIM);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(`QR Tidak Dikenali! NIM "${cleanedNIM}" tidak terdaftar.`);
  }

  const participant = docSnap.data();

  if (participant.category !== 'Tamu') {
    if (participant.paymentStatus !== 'Lunas') {
      throw new Error(`Presensi Ditolak! Pembayaran "${participant.name}" belum diverifikasi admin.`);
    }
  }

  if (participant.status === 'Hadir') {
    throw new Error(`Sudah Tercatat! ${participant.name} (${participant.category === 'Tamu' ? 'Tamu Undangan' : 'Peserta'}) sudah presensi sebelumnya.`);
  }

  await updateDoc(docRef, {
    status: 'Hadir',
    scannedAt: serverTimestamp()
  });

  return {
    ...participant,
    status: 'Hadir',
    scannedAt: new Date().toISOString()
  };
};

/**
 * On-the-spot self-registration + attendance check-in.
 * Creates/Updates participant record and sets status to 'Hadir', paymentStatus to 'Lunas'.
 */
export const registerAndMarkAttendance = async (nim, name, faculty, prodi, category) => {
  const cleanedNIM = nim.trim();
  const cleanedName = name.trim();
  const cleanedFaculty = faculty.trim();
  const cleanedProdi = prodi.trim();
  const cleanedCategory = category.trim();

  if (!cleanedNIM || !cleanedName || !cleanedFaculty || !cleanedProdi || !cleanedCategory) {
    throw new Error('Semua data wajib diisi.');
  }

  if (!isFirebaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 600));

    const data = getLocalData();
    const index = data.findIndex(p => p.nim === cleanedNIM);

    if (index !== -1 && data[index].status === 'Hadir') {
      throw new Error(`Anda (${data[index].name}) sudah melakukan presensi sebelumnya.`);
    }

    const newParticipant = {
      nim: cleanedNIM,
      name: cleanedName,
      faculty: cleanedFaculty,
      prodi: cleanedProdi,
      phoneNumber: '6281234567890',
      paymentReceipt: MOCK_RECEIPT_URL,
      paymentStatus: 'Lunas',
      status: 'Hadir',
      scannedAt: new Date().toISOString(),
      category: cleanedCategory
    };

    const newData = [...data];
    if (index !== -1) {
      newData[index] = newParticipant;
    } else {
      newData.push(newParticipant);
    }
    setLocalData(newData);
    return newParticipant;
  }

  const docRef = doc(db, 'participants', cleanedNIM);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists() && docSnap.data().status === 'Hadir') {
    throw new Error(`Anda (${docSnap.data().name}) sudah melakukan presensi sebelumnya.`);
  }

  const payload = {
    nim: cleanedNIM,
    name: cleanedName,
    faculty: cleanedFaculty,
    prodi: cleanedProdi,
    phoneNumber: '6281234567890',
    paymentReceipt: MOCK_RECEIPT_URL,
    paymentStatus: 'Lunas',
    status: 'Hadir',
    scannedAt: serverTimestamp(),
    category: cleanedCategory
  };

  await setDoc(docRef, payload);
  return {
    ...payload,
    scannedAt: new Date().toISOString()
  };
};


