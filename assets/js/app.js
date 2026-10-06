const DashboardService = (function () {

  /* ============================================================
     HELPER PERIODE
     ============================================================ */

  function getPeriodeSemester(ref) {
    const d = ref ? new Date(ref) : new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    if (m >= 7) {
      return {
        dari: y + '-07-01',
        sampai: y + '-12-31',
        label: 'Semester Ganjil ' + y + '/' + (y + 1)
      };
    }
    return {
      dari: (y - 1) + '-07-01',
      sampai: y + '-06-30',
      label: 'Semester Genap ' + (y - 1) + '/' + y
    };
  }

  function resolvePeriode(body) {
    const b = body || {};
    if (b.dari && b.sampai) {
      return {
        dari: String(b.dari).slice(0, 10),
        sampai: String(b.sampai).slice(0, 10),
        label: b.label || 'Kustom'
      };
    }
    return getPeriodeSemester(b.ref_tanggal);
  }

  /**
   * Normalisasi tanggal dari Google Sheets (Date object) atau string
   * menjadi 'YYYY-MM-DD'.
   */
  function normalizeTanggal(t) {
    if (!t) return '';
    if (t instanceof Date) {
      if (isNaN(t.getTime())) return '';
      return Utilities.formatDate(t, 'Asia/Jakarta', 'yyyy-MM-dd');
    }
    const s = String(t).trim();
    if (s === '') return '';
    // Coba parse sebagai Date
    const d = new Date(s);
    if (!isNaN(d.getTime()) && s.length > 10) {
      return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
    }
    // Sudah string YYYY-MM-DD atau serupa
    return s.slice(0, 10);
  }

  function isDalamPeriode(tanggal, dari, sampai) {
    if (!tanggal) return false;
    const t = normalizeTanggal(tanggal);
    if (!t) return false;
    return t >= dari && t <= sampai;
  }

  function getBulanList(dari, sampai) {
    const list = [];
    const bulanLabel = ['Jan','Feb','Mar','Apr','Mei','Jun',
                        'Jul','Agu','Sep','Okt','Nov','Des'];
    const start = new Date(dari + 'T00:00:00');
    const end = new Date(sampai + 'T00:00:00');
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      list.push({
        key: y + '-' + String(m + 1).padStart(2, '0'),
        label: bulanLabel[m] + ' ' + String(y).slice(2)
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return list;
  }

  function hitungKategoriDominan(distribusi) {
    let top = '-', max = 0;
    Object.keys(distribusi).forEach(k => {
      if (distribusi[k] > max) { max = distribusi[k]; top = k; }
    });
    return top;
  }

  function tanggalSatuBulanLalu() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
  }

  /**
   * Ambil daftar sekolah, kecualikan entri "Dinas" (admin) dan nonaktif.
   */
  function ambilSekolahValid() {
    return SekolahRepo.list()
      .filter(s => toStr(s.jenjang) !== 'Dinas')
      .filter(s => toStr(s.status) !== 'nonaktif');
  }

  /* ============================================================
     PENGAWAS — DASHBOARD
     ============================================================ */

  function pengawas(body) {
    const session = AuthService.requireSession(body);
    Guard.requireRole(session, ['Pengawas', 'Admin']);

    const periode = resolvePeriode(body);
    const binaan = Guard.getBinaanList(session.user_id);

    const cacheKey = 'dashboard:pengawas:' + session.user_id +
      ':' + periode.dari + ':' + periode.sampai;
    cacheInvalidate(cacheKey);

    return cached(cacheKey, CONFIG.CACHE_TTL.DASHBOARD_PENGAWAS, () => {
      return hitungDashboardPengawas(binaan, periode);
    });
  }

  function hitungDashboardPengawas(binaan, periode) {
    const allSekolah = ambilSekolahValid();
    const allGuru = readSheetFast(CONFIG.SHEETS.GURU)
      .filter(g => toStr(g.status) !== 'hapus');
    const allSupervisi = readSheetFast(CONFIG.SHEETS.SUPERVISI);
    const allCoaching = readSheetFast(CONFIG.SHEETS.COACHING);
    const allUsers = readSheetFast(CONFIG.SHEETS.USERS);

    const sekolahList = binaan.length > 0
      ? allSekolah.filter(s => binaan.includes(toStr(s.npsn)))
      : allSekolah;

    const npsnSet = sekolahList.map(s => toStr(s.npsn));
    const guruBinaan = allGuru.filter(g => npsnSet.includes(toStr(g.npsn_sekolah)));

    const supervisiPeriode = allSupervisi.filter(s =>
      npsnSet.includes(toStr(s.npsn_sekolah)) &&
      isDalamPeriode(s.tanggal, periode.dari, periode.sampai) &&
      toStr(s.status) !== 'hapus'
    );
    const coachingPeriode = allCoaching.filter(c =>
      npsnSet.includes(toStr(c.npsn_sekolah)) &&
      isDalamPeriode(c.tanggal, periode.dari, periode.sampai) &&
      toStr(c.status) !== 'hapus'
    );

    const supervisiTerkirim = supervisiPeriode.filter(s => toStr(s.status) === 'terkirim');
    const supervisiDraft = supervisiPeriode.filter(s => toStr(s.status) === 'draft');

    const totalSkorTerkirim = supervisiTerkirim.reduce((a, s) => a + toInt(s.skor_total), 0);
    const rataSkor = supervisiTerkirim.length
      ? Math.round(totalSkorTerkirim / supervisiTerkirim.length)
      : 0;

    const distribusi = {};
    supervisiTerkirim.forEach(s => {
      const k = toStr(s.kategori) || '-';
      distribusi[k] = (distribusi[k] || 0) + 1;
    });

    const bulanAktif = tanggalSatuBulanLalu();

    const sekolah = sekolahList.map(sek => {
      const npsn = toStr(sek.npsn);
      const guruSek = guruBinaan.filter(g => toStr(g.npsn_sekolah) === npsn);
      const supSek = supervisiPeriode.filter(s => toStr(s.npsn_sekolah) === npsn);
      const supTerkirimSek = supSek.filter(s => toStr(s.status) === 'terkirim');
      const supDraftSek = supSek.filter(s => toStr(s.status) === 'draft');
      const coachSek = coachingPeriode.filter(c => toStr(c.npsn_sekolah) === npsn);

      const totalSkorSek = supTerkirimSek.reduce((a, s) => a + toInt(s.skor_total), 0);
      const rataSek = supTerkirimSek.length
        ? Math.round(totalSkorSek / supTerkirimSek.length)
        : 0;

      const distSek = {};
      supTerkirimSek.forEach(s => {
        const k = toStr(s.kategori) || '-';
        distSek[k] = (distSek[k] || 0) + 1;
      });

      const terakhir = supTerkirimSek.length
        ? supTerkirimSek.map(s => normalizeTanggal(s.tanggal)).sort().reverse()[0]
        : null;

      const aktif = terakhir && terakhir >= bulanAktif;

      const ks = allUsers.find(u =>
        toStr(u.npsn) === npsn && toStr(u.role) === 'KS'
      );

      return {
        npsn: npsn,
        nama_sekolah: toStr(sek.nama_sekolah),
        jenjang: toStr(sek.jenjang),
        kecamatan: toStr(sek.kecamatan),
        jumlah_guru: guruSek.length,
        total_supervisi: supSek.length,
        total_terkirim: supTerkirimSek.length,
        total_draft: supDraftSek.length,
        total_coaching: coachSek.length,
        rata_skor: rataSek,
        kategori_dominan: hitungKategoriDominan(distSek),
        terakhir_supervisi: terakhir,
        status: aktif ? 'aktif' : 'pasif',
        ks: ks ? {
          id: toStr(ks.id),
          nama: toStr(ks.nama),
          nip: toStr(ks.nip),
          pangkat_golongan: toStr(ks.pangkat_golongan),
          no_hp: toStr(ks.no_hp),
          email: toStr(ks.email)
        } : null
      };
    });

    // Attention panel
    const perluPerhatian = [];

    sekolah.filter(s => s.status === 'pasif').forEach(s => {
      perluPerhatian.push({
        tipe: 'sekolah_pasif',
        npsn: s.npsn,
        nama_sekolah: s.nama_sekolah,
        pesan: 'Belum ada supervisi terkirim dalam 1 bulan terakhir',
        aksi: '/pengawas/sekolah.html?npsn=' + s.npsn
      });
    });

    sekolah.filter(s => s.total_draft >= 2).forEach(s => {
      perluPerhatian.push({
        tipe: 'draft_menumpuk',
        npsn: s.npsn,
        nama_sekolah: s.nama_sekolah,
        pesan: s.total_draft + ' supervisi berstatus draft belum dikirim',
        jumlah: s.total_draft,
        aksi: '/pengawas/sekolah.html?npsn=' + s.npsn
      });
    });

    const guruIdsSudah = new Set();
    supervisiTerkirim.forEach(s => guruIdsSudah.add(toStr(s.guru_id)));
    const guruBelum = guruBinaan.filter(g => !guruIdsSudah.has(toStr(g.id)));
    if (guruBelum.length > 0) {
      perluPerhatian.push({
        tipe: 'guru_belum',
        pesan: guruBelum.length + ' guru belum disupervisi pada periode ini',
        jumlah: guruBelum.length,
        aksi: '/pengawas/guru.html?filter=belum'
      });
    }

    // Tren bulanan
    const bulanList = getBulanList(periode.dari, periode.sampai);
    const trenBulanan = bulanList.map(b => {
      const supBulan = supervisiTerkirim.filter(s =>
        normalizeTanggal(s.tanggal).slice(0, 7) === b.key
      );
      const coachBulan = coachingPeriode.filter(c =>
        normalizeTanggal(c.tanggal).slice(0, 7) === b.key &&
        toStr(c.status) === 'terkirim'
      );
      const skorBulan = supBulan.reduce((a, s) => a + toInt(s.skor_total), 0);
      return {
        bulan: b.key,
        label: b.label,
        supervisi: supBulan.length,
        coaching: coachBulan.length,
        rata_skor: supBulan.length ? Math.round(skorBulan / supBulan.length) : 0
      };
    });

    return {
      periode: periode,
      global: {
        total_sekolah: sekolah.length,
        total_guru: guruBinaan.length,
        total_supervisi: supervisiPeriode.length,
        total_supervisi_terkirim: supervisiTerkirim.length,
        total_supervisi_draft: supervisiDraft.length,
        total_coaching: coachingPeriode.length,
        rata_skor: rataSkor,
        kategori_dominan: hitungKategoriDominan(distribusi)
      },
      distribusi_kategori: distribusi,
      sekolah: sekolah.sort((a, b) => b.rata_skor - a.rata_skor),
      perlu_perhatian: perluPerhatian,
      tren_bulanan: trenBulanan
    };
  }

  /* ============================================================
     PENGAWAS — DETAIL SEKOLAH
     ============================================================ */

  function sekolah(body) {
    const session = AuthService.requireSession(body);
    Guard.requireRole(session, ['Pengawas', 'Admin', 'KS']);

    const npsn = toStr(body.npsn_sekolah || body.npsn);
    if (!npsn) throw appError(400, 'npsn_sekolah wajib diisi');

    if (session.role === 'KS') Guard.ensureOwnSchool(session, npsn);
    if (session.role === 'Pengawas') Guard.ensurePengawasBinaan(session, npsn);

    const periode = resolvePeriode(body);
    const cacheKey = 'pengawas:sekolah:' + npsn + ':' + periode.dari + ':' + periode.sampai;
    cacheInvalidate(cacheKey);

    return cached(cacheKey, 120, () => {
      const sek = SekolahRepo.getCached(npsn);
      if (!sek) throw appError(404, 'Sekolah tidak ditemukan');

      const guruAll = GuruRepo.listBySchool(npsn);
      const supAll = SupervisiRepo.listBySchool(npsn, {});
      const coachAll = CoachingRepo.listBySchool(npsn, {});

      const supPeriode = supAll.filter(s => isDalamPeriode(s.tanggal, periode.dari, periode.sampai));
      const coachPeriode = coachAll.filter(c => isDalamPeriode(c.tanggal, periode.dari, periode.sampai));
      const supTerkirim = supPeriode.filter(s => toStr(s.status) === 'terkirim');

      const users = readSheetFast(CONFIG.SHEETS.USERS);
      const ksUser = users.find(u => toStr(u.npsn) === npsn && toStr(u.role) === 'KS');

      const distribusi = {};
      supTerkirim.forEach(s => {
        const k = toStr(s.kategori) || '-';
        distribusi[k] = (distribusi[k] || 0) + 1;
      });

      const guruRekap = guruAll.map(g => {
        const supGuru = supPeriode.filter(s => toStr(s.guru_id) === toStr(g.id));
        const supTerkirimGuru = supGuru.filter(s => toStr(s.status) === 'terkirim');
        const coachGuru = coachPeriode.filter(c => toStr(c.guru_id) === toStr(g.id));
        const totalSkor = supTerkirimGuru.reduce((a, s) => a + toInt(s.skor_total), 0);
        const terakhir = supTerkirimGuru.length
          ? supTerkirimGuru.map(s => normalizeTanggal(s.tanggal)).sort().reverse()[0]
          : null;

        let statusGuru = 'belum';
        if (supGuru.length > 0) {
          statusGuru = supTerkirimGuru.length > 0 ? 'terkirim' : 'draft';
        }

        return {
          guru: g,
          jumlah_supervisi: supGuru.length,
          supervisi_terkirim: supTerkirimGuru.length,
          jumlah_coaching: coachGuru.length,
          rata_skor: supTerkirimGuru.length
            ? Math.round(totalSkor / supTerkirimGuru.length)
            : 0,
          terakhir_supervisi: terakhir,
          status: statusGuru
        };
      }).sort((a, b) => {
        const order = { belum: 1, draft: 2, terkirim: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return a.rata_skor - b.rata_skor;
      });

      const totalSkorSek = supTerkirim.reduce((a, s) => a + toInt(s.skor_total), 0);

      return {
        periode: periode,
        npsn_sekolah: npsn,
        nama_sekolah: toStr(sek.nama_sekolah),
        jenjang: toStr(sek.jenjang),
        kecamatan: toStr(sek.kecamatan),
        kabupaten: toStr(sek.kabupaten),
        provinsi: toStr(sek.provinsi),
        ks: ksUser ? {
          id: toStr(ksUser.id),
          nama: toStr(ksUser.nama),
          nip: toStr(ksUser.nip),
          pangkat_golongan: toStr(ksUser.pangkat_golongan),
          no_hp: toStr(ksUser.no_hp),
          email: toStr(ksUser.email)
        } : null,
        statistik: {
          jumlah_guru: guruAll.length,
          total_supervisi: supPeriode.length,
          total_terkirim: supTerkirim.length,
          total_draft: supPeriode.filter(s => toStr(s.status) === 'draft').length,
          total_coaching: coachPeriode.length,
          rata_skor: supTerkirim.length ? Math.round(totalSkorSek / supTerkirim.length) : 0
        },
        distribusi_kategori: distribusi,
        guru: guruRekap
      };
    });
  }

  /* ============================================================
     PENGAWAS — TREN BULANAN
     ============================================================ */

  function tren(body) {
    const session = AuthService.requireSession(body);
    Guard.requireRole(session, ['Pengawas', 'Admin']);

    const periode = resolvePeriode(body);
    const binaan = Guard.getBinaanList(session.user_id);

    const cacheKey = 'pengawas:tren:' + session.user_id +
      ':' + periode.dari + ':' + periode.sampai;
    cacheInvalidate(cacheKey);

    return cached(cacheKey, CONFIG.CACHE_TTL.DASHBOARD_PENGAWAS, () => {
      const allSekolah = ambilSekolahValid();
      const sekolahList = binaan.length > 0
        ? allSekolah.filter(s => binaan.includes(toStr(s.npsn)))
        : allSekolah;
      const npsnSet = sekolahList.map(s => toStr(s.npsn));

      const allSupervisi = readSheetFast(CONFIG.SHEETS.SUPERVISI)
        .filter(s => npsnSet.includes(toStr(s.npsn_sekolah)) &&
          toStr(s.status) === 'terkirim' &&
          isDalamPeriode(s.tanggal, periode.dari, periode.sampai));
      const allCoaching = readSheetFast(CONFIG.SHEETS.COACHING)
        .filter(c => npsnSet.includes(toStr(c.npsn_sekolah)) &&
          toStr(c.status) === 'terkirim' &&
          isDalamPeriode(c.tanggal, periode.dari, periode.sampai));

      const bulanList = getBulanList(periode.dari, periode.sampai);
      const bulanan = bulanList.map(b => {
        const supBulan = allSupervisi.filter(s =>
          normalizeTanggal(s.tanggal).slice(0, 7) === b.key
        );
        const coachBulan = allCoaching.filter(c =>
          normalizeTanggal(c.tanggal).slice(0, 7) === b.key
        );
        const totalSkor = supBulan.reduce((a, s) => a + toInt(s.skor_total), 0);
        return {
          bulan: b.key,
          label: b.label,
          supervisi: supBulan.length,
          coaching: coachBulan.length,
          rata_skor: supBulan.length ? Math.round(totalSkor / supBulan.length) : 0
        };
      });

      return { periode: periode, bulanan: bulanan };
    });
  }

  /* ============================================================
     PENGAWAS — DAFTAR GURU LINTAS SEKOLAH
     ============================================================ */

  function guruList(body) {
    const session = AuthService.requireSession(body);
    Guard.requireRole(session, ['Pengawas', 'Admin']);

    const binaan = Guard.getBinaanList(session.user_id);
    const periode = resolvePeriode(body);

    const allSekolah = ambilSekolahValid();
    const sekolahList = binaan.length > 0
      ? allSekolah.filter(s => binaan.includes(toStr(s.npsn)))
      : allSekolah;
    const npsnSet = sekolahList.map(s => toStr(s.npsn));

    const guruAll = readSheetFast(CONFIG.SHEETS.GURU)
      .filter(g => npsnSet.includes(toStr(g.npsn_sekolah)) && toStr(g.status) !== 'hapus');

    const allSupervisi = readSheetFast(CONFIG.SHEETS.SUPERVISI)
      .filter(s => npsnSet.includes(toStr(s.npsn_sekolah)) &&
        isDalamPeriode(s.tanggal, periode.dari, periode.sampai));

    const sekolahMap = {};
    sekolahList.forEach(s => sekolahMap[toStr(s.npsn)] = toStr(s.nama_sekolah));

    const items = guruAll.map(g => {
      const supGuru = allSupervisi.filter(s => toStr(s.guru_id) === toStr(g.id));
      const terkirim = supGuru.filter(s => toStr(s.status) === 'terkirim');
      const totalSkor = terkirim.reduce((a, s) => a + toInt(s.skor_total), 0);
      const terakhir = terkirim.length
        ? terkirim.map(s => normalizeTanggal(s.tanggal)).sort().reverse()[0]
        : null;

      let status = 'belum';
      if (supGuru.length > 0) status = terkirim.length > 0 ? 'terkirim' : 'draft';

      return {
        id: toStr(g.id),
        nama: toStr(g.nama),
        nip: toStr(g.nip),
        mapel: toStr(g.mapel),
        kelas: toStr(g.kelas),
        status_kepegawaian: toStr(g.status_kepegawaian),
        npsn_sekolah: toStr(g.npsn_sekolah),
        nama_sekolah: sekolahMap[toStr(g.npsn_sekolah)] || toStr(g.npsn_sekolah),
        jumlah_supervisi: supGuru.length,
        supervisi_terkirim: terkirim.length,
        rata_skor: terkirim.length ? Math.round(totalSkor / terkirim.length) : 0,
        terakhir_supervisi: terakhir,
        status: status
      };
    });

    const f = body.filter || {};
    let filtered = items;
    if (f.status) filtered = filtered.filter(x => x.status === f.status);
    if (f.npsn_sekolah) filtered = filtered.filter(x => x.npsn_sekolah === f.npsn_sekolah);
    if (f.status_kepegawaian) filtered = filtered.filter(x => x.status_kepegawaian === f.status_kepegawaian);
    if (f.q) {
      const q = String(f.q).toLowerCase();
      filtered = filtered.filter(x => x.nama.toLowerCase().includes(q) || x.nip.includes(q));
    }

    return {
      periode: periode,
      total: filtered.length,
      items: filtered
    };
  }

  /* ============================================================
     KS — DASHBOARD
     ============================================================ */

  function ks(body) {
    const session = AuthService.requireSession(body);
    Guard.requireRole(session, ['KS', 'Admin']);
    const npsn = session.npsn;

    return cached('dashboard:ks:' + npsn, CONFIG.CACHE_TTL.DASHBOARD_KS, () => {
      const guru = GuruRepo.listBySchool(npsn);
      const supervisi = SupervisiRepo.listBySchool(npsn, {});
      const coaching = CoachingRepo.listBySchool(npsn, {});

      const terkirim = supervisi.filter(s => toStr(s.status) === 'terkirim');
      const avgSkor = terkirim.length
        ? Math.round(terkirim.reduce((a, s) => a + toInt(s.skor_total), 0) / terkirim.length)
        : 0;

      const distribusi = {};
      terkirim.forEach(s => {
        const k = toStr(s.kategori) || '-';
        distribusi[k] = (distribusi[k] || 0) + 1;
      });

      return {
        npsn: npsn,
        jumlah_guru: guru.length,
        jumlah_supervisi: supervisi.length,
        jumlah_supervisi_terkirim: terkirim.length,
        jumlah_coaching: coaching.length,
        jumlah_coaching_terkirim: coaching.filter(c => toStr(c.status) === 'terkirim').length,
        rata_skor_supervisi: avgSkor,
        distribusi_kategori: distribusi,
        aktivitas_terakhir: supervisi.slice(0, 5).map(s => ({
          id: toStr(s.id),
          tanggal: s.tanggal,
          guru_id: toStr(s.guru_id),
          status: toStr(s.status),
          skor_total: toInt(s.skor_total)
        }))
      };
    });
  }

  /* ============================================================
     PENGAWAS — DAFTAR SUPERVISI LINTAS SEKOLAH
     ============================================================ */

  function supervisiList(body) {
    const session = AuthService.requireSession(body);
    Guard.requireRole(session, ['Pengawas', 'Admin']);

    const binaan = Guard.getBinaanList(session.user_id);
    const periode = resolvePeriode(body);

    const allSekolah = ambilSekolahValid();
    const sekolahList = binaan.length > 0
      ? allSekolah.filter(s => binaan.includes(toStr(s.npsn)))
      : allSekolah;
    const npsnSet = sekolahList.map(s => toStr(s.npsn));
    const sekolahMap = {};
    sekolahList.forEach(s => sekolahMap[toStr(s.npsn)] = toStr(s.nama_sekolah));

    const allGuru = readSheetFast(CONFIG.SHEETS.GURU);
    const guruMap = {};
    allGuru.forEach(g => guruMap[toStr(g.id)] = toStr(g.nama));

    const all = readSheetFast(CONFIG.SHEETS.SUPERVISI)
      .filter(s => npsnSet.includes(toStr(s.npsn_sekolah)))
      .filter(s => toStr(s.status) !== 'hapus')
      .filter(s => isDalamPeriode(s.tanggal, periode.dari, periode.sampai));

    const items = all.map(s => ({
      id: toStr(s.id),
      tanggal: normalizeTanggal(s.tanggal),
      npsn_sekolah: toStr(s.npsn_sekolah),
      nama_sekolah: sekolahMap[toStr(s.npsn_sekolah)] || toStr(s.npsn_sekolah),
      guru_id: toStr(s.guru_id),
      nama_guru: guruMap[toStr(s.guru_id)] || toStr(s.guru_id),
      mapel: toStr(s.mapel),
      materi: toStr(s.materi),
      skor_total: toInt(s.skor_total),
      kategori: toStr(s.kategori),
      status: toStr(s.status),
      submitted_at: s.submitted_at
    })).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    // Filter opsional
    const f = body.filter || {};
    let filtered = items;
    if (f.status) filtered = filtered.filter(x => x.status === f.status);
    if (f.npsn_sekolah) filtered = filtered.filter(x => x.npsn_sekolah === f.npsn_sekolah);
    if (f.kategori) filtered = filtered.filter(x => x.kategori === f.kategori);
    if (f.dari) filtered = filtered.filter(x => x.tanggal >= f.dari);
    if (f.sampai) filtered = filtered.filter(x => x.tanggal <= f.sampai);
    if (f.q) {
      const q = String(f.q).toLowerCase();
      filtered = filtered.filter(x =>
        x.nama_guru.toLowerCase().includes(q) ||
        x.nama_sekolah.toLowerCase().includes(q) ||
        x.mapel.toLowerCase().includes(q)
      );
    }

    return {
      periode: periode,
      total: filtered.length,
      items: filtered
    };
  }

  /* ============================================================
     PENGAWAS — DAFTAR COACHING LINTAS SEKOLAH
     ============================================================ */

  function coachingList(body) {
    const session = AuthService.requireSession(body);
    Guard.requireRole(session, ['Pengawas', 'Admin']);

    const binaan = Guard.getBinaanList(session.user_id);
    const periode = resolvePeriode(body);

    const allSekolah = ambilSekolahValid();
    const sekolahList = binaan.length > 0
      ? allSekolah.filter(s => binaan.includes(toStr(s.npsn)))
      : allSekolah;
    const npsnSet = sekolahList.map(s => toStr(s.npsn));
    const sekolahMap = {};
    sekolahList.forEach(s => sekolahMap[toStr(s.npsn)] = toStr(s.nama_sekolah));

    const allGuru = readSheetFast(CONFIG.SHEETS.GURU);
    const guruMap = {};
    allGuru.forEach(g => guruMap[toStr(g.id)] = toStr(g.nama));

    const all = readSheetFast(CONFIG.SHEETS.COACHING)
      .filter(c => npsnSet.includes(toStr(c.npsn_sekolah)))
      .filter(c => toStr(c.status) !== 'hapus')
      .filter(c => isDalamPeriode(c.tanggal, periode.dari, periode.sampai));

    const items = all.map(c => ({
      id: toStr(c.id),
      tanggal: normalizeTanggal(c.tanggal),
      npsn_sekolah: toStr(c.npsn_sekolah),
      nama_sekolah: sekolahMap[toStr(c.npsn_sekolah)] || toStr(c.npsn_sekolah),
      guru_id: toStr(c.guru_id),
      nama_guru: guruMap[toStr(c.guru_id)] || toStr(c.guru_id),
      skor_total: toInt(c.skor_total),
      kategori: toStr(c.kategori),
      status: toStr(c.status),
      submitted_at: c.submitted_at
    })).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    const f = body.filter || {};
    let filtered = items;
    if (f.status) filtered = filtered.filter(x => x.status === f.status);
    if (f.npsn_sekolah) filtered = filtered.filter(x => x.npsn_sekolah === f.npsn_sekolah);
    if (f.kategori) filtered = filtered.filter(x => x.kategori === f.kategori);
    if (f.q) {
      const q = String(f.q).toLowerCase();
      filtered = filtered.filter(x =>
        x.nama_guru.toLowerCase().includes(q) ||
        x.nama_sekolah.toLowerCase().includes(q)
      );
    }

    return {
      periode: periode,
      total: filtered.length,
      items: filtered
    };
  }

  return { ks, pengawas, sekolah, tren, guruList, supervisiList, coachingList };
})();
