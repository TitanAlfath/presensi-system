import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Helper to format date strings nicely.
 */
const formatDate = (isoString) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\./g, ':');
  } catch (e) {
    return isoString;
  }
};

/**
 * Exports participant data to Excel (.xlsx) file.
 * Automatically handles formatting and auto-sizes column widths.
 * @param {Array} participants - List of participants from database.
 */
export const exportToExcel = (participants) => {
  if (!participants || participants.length === 0) return;

  // Map data to Indonesian-friendly spreadsheets
  const formattedData = participants.map((p, index) => ({
    'No': index + 1,
    'NIM': p.nim,
    'Nama Lengkap': p.name,
    'Kategori': p.category === 'Tamu' ? 'Tamu Undangan' : 'Peserta',
    'Fakultas / Program Studi': p.faculty,
    'Status Presensi': p.status,
    'Waktu Hadir': formatDate(p.scannedAt)
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Presensi');

  // Auto-size columns to prevent cropped cells
  const columnWidths = [];
  formattedData.forEach((row) => {
    Object.keys(row).forEach((key, colIndex) => {
      const val = row[key] ? row[key].toString() : '';
      const cellLength = val.length + 3; // buffer spacing
      const headerLength = key.length + 3;
      const maxLength = Math.max(cellLength, headerLength);
      
      if (!columnWidths[colIndex] || maxLength > columnWidths[colIndex]) {
        columnWidths[colIndex] = maxLength;
      }
    });
  });

  worksheet['!cols'] = columnWidths.map(w => ({ wch: w }));

  // Generate binary Excel file and trigger download
  XLSX.writeFile(workbook, 'Presensi_Workshop_KTI_BEM_FASTIKOM.xlsx');
};

/**
 * Exports participant data to PDF file using jsPDF and jsPDF-AutoTable.
 * Produces a high-quality, professional administrative report.
 * @param {Array} participants - List of participants from database.
 */
export const exportToPDF = (participants) => {
  if (!participants || participants.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Calculate statistics
  const total = participants.length;
  const present = participants.filter(p => p.status === 'Hadir').length;
  const absent = total - present;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  // 1. Draw Professional Cyan/Dark Blue Header Block
  doc.setFillColor(3, 7, 18); // brand-bg-dark
  doc.rect(0, 0, 210, 38, 'F');

  // Glowing indicator strip
  doc.setFillColor(6, 182, 212); // brand-cyan
  doc.rect(0, 37, 210, 1.2, 'F');

  // 2. Add Header Typography
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BEM FASTIKOM - DIES NATALIS 2026', 15, 13);
  
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(165, 180, 252); // light indigo
  doc.text('LAPORAN HASIL PRESENSI WORKSHOP KARYA TULIS ILMIAH', 15, 19);
  
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // gray
  doc.text(`Waktu Laporan: ${new Date().toLocaleString('id-ID')}`, 15, 25);
  doc.text('Tingkat Kehadiran Acara & Laporan Administratif', 15, 29);

  // 3. Stats Info Cards Grid (Placed inside elegant borders)
  doc.setFillColor(243, 244, 246); // light gray fill
  doc.setDrawColor(229, 231, 235); // border gray
  doc.roundedRect(15, 45, 180, 20, 2, 2, 'FD');

  // Add stats text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39); // dark slate
  doc.text('RINGKASAN STATISTIK KEHADIRAN:', 20, 51);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Total Peserta: ${total} Orang`, 20, 58);
  doc.text(`Jumlah Hadir: ${present} Orang`, 70, 58);
  doc.text(`Belum Hadir: ${absent} Orang`, 120, 58);
  
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(8, 145, 178); // cyan dark
  doc.text(`Persentase Kehadiran: ${percentage}%`, 160, 58);

  // 4. Generate Table Grid using AutoTable
  const tableData = participants.map((p, index) => [
    index + 1,
    p.nim,
    p.name,
    p.category === 'Tamu' ? 'Tamu Undangan' : 'Peserta',
    p.faculty,
    p.status,
    formatDate(p.scannedAt)
  ]);

  doc.autoTable({
    startY: 72,
    head: [['No', 'NIM', 'Nama Lengkap', 'Kategori', 'Fakultas / Program Studi', 'Status', 'Waktu Hadir']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // deep slate head
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [55, 65, 81]
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 24 },
      2: { cellWidth: 38 },
      3: { cellWidth: 26 },
      4: { cellWidth: 38 },
      5: { cellWidth: 18, fontStyle: 'bold' },
      6: { cellWidth: 26 }
    },
    didParseCell: function(data) {
      // Highlight "Hadir" status text with green, "Belum Hadir" with gray
      if (data.column.index === 5 && data.cell.section === 'body') {
        if (data.cell.raw === 'Hadir') {
          data.cell.styles.textColor = [16, 124, 65]; // Green
        } else {
          data.cell.styles.textColor = [107, 114, 128]; // Gray
        }
      }
    },
    margin: { left: 15, right: 15 },
    styles: { overflow: 'linebreak' }
  });

  // 5. Add Sign-off section at the end of document
  const finalY = doc.lastAutoTable.finalY + 12;
  const pageHeight = doc.internal.pageSize.height;
  
  if (finalY + 30 < pageHeight) {
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Mengetahui,', 145, finalY);
    doc.text('Panitia Pelaksana Diesnat BEM FASTIKOM', 130, finalY + 4);
    doc.text('_____________________________________', 130, finalY + 18);
    doc.text('Divisi Keanggotaan & Acara', 142, finalY + 22);
  }

  // 6. Draw Footer Page Numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(`Halaman ${i} dari ${pageCount}`, 175, 287);
    doc.text('Laporan Presensi Otomatis - Sistem Kehadiran FASTIKOM', 15, 287);
  }

  // Trigger file download
  doc.save('Presensi_Workshop_KTI_BEM_FASTIKOM.pdf');
};
