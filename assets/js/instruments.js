/**
 * SISPA — Definisi Instrumen LK1 & LK2
 */

const INSTRUMEN_LK1 = [
  { kode:'A1', section:'A. Perencanaan dan Kesiapan Pembelajaran Digital', teks:'Tujuan pembelajaran dirumuskan jelas dan selaras dengan pemanfaatan media/platform digital yang dipilih.' },
  { kode:'A2', section:'A. Perencanaan dan Kesiapan Pembelajaran Digital', teks:'Media/platform digital yang dipilih sesuai dengan karakteristik materi dan capaian pembelajaran.' },
  { kode:'A3', section:'A. Perencanaan dan Kesiapan Pembelajaran Digital', teks:'Guru menunjukkan penguasaan teknis terhadap perangkat dan aplikasi yang digunakan.' },
  { kode:'B1', section:'B. Pemanfaatan Platform dan Media Digital', teks:'Murid menggunakan berbagai fitur platform digital secara bermakna untuk mengkonstruksi pemahaman dan berkolaborasi.' },
  { kode:'B2', section:'B. Pemanfaatan Platform dan Media Digital', teks:'Konten digital yang ditampilkan relevan, akurat, dan mendukung pemahaman konsep murid.' },
  { kode:'B3', section:'B. Pemanfaatan Platform dan Media Digital', teks:'Guru mampu mengatasi kendala teknis dengan cepat tanpa mengganggu alur pembelajaran secara signifikan.' },
  { kode:'C1', section:'C. Interaksi dan Keterlibatan Murid', teks:'Murid terlibat aktif berinteraksi dengan media digital, bukan hanya menyimak secara pasif.' },
  { kode:'C2', section:'C. Interaksi dan Keterlibatan Murid', teks:'Murid menerima umpan balik secara langsung atas progres dan hasil kerjanya melalui media digital.' },
  { kode:'C3', section:'C. Interaksi dan Keterlibatan Murid', teks:'Terdapat variasi aktivitas digital yang mendorong kolaborasi antar murid.' },
  { kode:'C4', section:'C. Interaksi dan Keterlibatan Murid', teks:'Murid aktif bertanya dan berpendapat melalui kanal digital yang tersedia.' },
  { kode:'D1', section:'D. Literasi Digital dan Etika Penggunaan Teknologi', teks:'Murid menerapkan etika, tata tertib, dan panduan yang berlaku dalam menggunakan perangkat atau platform digital.' },
  { kode:'D2', section:'D. Literasi Digital dan Etika Penggunaan Teknologi', teks:'Murid secara aktif memilah, menyaring, dan memverifikasi informasi digital secara kritis.' },
  { kode:'D3', section:'D. Literasi Digital dan Etika Penggunaan Teknologi', teks:'Murid menunjukkan perilaku yang bijak, aman, dan bertanggung jawab dalam memanfaatkan teknologi.' },
  { kode:'E1', section:'E. Asesmen Berbasis Digital', teks:'Murid menyelesaikan instrumen asesmen digital secara mandiri untuk mengukur pemahaman terhadap tujuan pembelajaran.' },
  { kode:'E2', section:'E. Asesmen Berbasis Digital', teks:'Hasil asesmen digital dimanfaatkan guru untuk memberikan umpan balik atau menyesuaikan strategi pembelajaran.' },
  { kode:'E3', section:'E. Asesmen Berbasis Digital', teks:'Murid dapat mengikuti dan menyelesaikan proses asesmen digital dengan lancar dan tanpa kendala teknis berarti.' },
  { kode:'F1', section:'F. Pengelolaan Kelas Digital', teks:'Guru mampu mengelola perhatian murid agar tetap fokus pada tujuan pembelajaran.' },
  { kode:'F2', section:'F. Pengelolaan Kelas Digital', teks:'Murid terlibat seimbang antara aktivitas berbasis digital dengan aktivitas non-digital.' },
  { kode:'F3', section:'F. Pengelolaan Kelas Digital', teks:'Suasana kelas digital tetap kondusif, tertib, dan mendukung proses belajar.' }
];

const INSTRUMEN_LK2 = [
  { tahap:'S', kode:'S1', teks:'Menggali konteks/latar belakang penerapan pembelajaran berbasis digital yang telah diobservasi (kondisi kelas, sarana TIK, karakteristik murid).' },
  { tahap:'T', kode:'T1', teks:'Menggali tujuan pembelajaran dan target penggunaan media/platform digital yang ingin dicapai guru.' },
  { tahap:'A', kode:'A1', teks:'Menggali langkah-langkah konkret yang dilakukan guru dalam mengintegrasikan teknologi ke dalam proses pembelajaran.' },
  { tahap:'R', kode:'R1', teks:'Menggali dampak/hasil dari penerapan pembelajaran digital, baik dari capaian belajar murid maupun refleksi guru.' },
  { tahap:'G', kode:'G1', teks:'Memfasilitasi guru merumuskan tujuan pengembangan diri yang spesifik terkait pemanfaatan pembelajaran digital.' },
  { tahap:'R', kode:'R2', teks:'Membantu guru mengidentifikasi kondisi nyata secara jujur dan objektif, termasuk kendala dan kompetensi digital.' },
  { tahap:'O', kode:'O1', teks:'Mendorong guru menghasilkan beberapa alternatif strategi atau solusi untuk meningkatkan kualitas pembelajaran digital.' },
  { tahap:'W', kode:'W1', teks:'Memastikan guru menetapkan langkah tindak lanjut yang konkret, terukur, dan disertai komitmen waktu.' }
];

function tentukanKategoriLK1(total) {
  if (total <= 25) return 'Belum Terlihat';
  if (total <= 50) return 'Mulai Terlihat';
  if (total <= 65) return 'Berkembang';
  return 'Mahir';
}

function tentukanKategoriLK2(total) {
  if (total <= 11) return 'Belum Tampak';
  if (total <= 19) return 'Mulai Tampak';
  if (total <= 27) return 'Berkembang';
  return 'Konsisten/Optimal';
}

window.INSTRUMEN_LK1 = INSTRUMEN_LK1;
window.INSTRUMEN_LK2 = INSTRUMEN_LK2;
window.tentukanKategoriLK1 = tentukanKategoriLK1;
window.tentukanKategoriLK2 = tentukanKategoriLK2;
