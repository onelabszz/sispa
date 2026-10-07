/**
 * SISPA — Konfigurasi Frontend
 * URL GAS dapat diubah dari halaman Pengaturan (settings.html).
 *
 * AUTO-MIGRASI:
 * Setiap kali Anda melakukan migrasi backend (pindah akun Gmail, ganti Sheet, dll.),
 * naikkan API_URL_VERSION dan tambahkan ID URL lama ke LEGACY_URL_IDS.
 * Semua user akan otomatis dialihkan saat membuka aplikasi.
 */

const SISPA_CONFIG = {
  APP_NAME: 'SISPA',
  APP_VERSION: '1.2.0',

  // ============================================
  // URL BACKEND — Ganti saat migrasi
  // ============================================
  DEFAULT_API_URL: 'https://script.google.com/macros/s/AKfycbzVF04wBd_ZBA0lnAyid2V4chiWUwEMCQH5eSontQgNNTRam4u43a6DhOzfV9L3JN9Kcw/exec',

  // ============================================
  // AUTO-MIGRASI
  // ============================================

  /**
   * Versi URL saat ini. Naikkan setiap kali migrasi.
   * Contoh: 'v1', 'v2-2026-10-07', 'v3'
   * Ketika versi berubah, semua user otomatis reset ke DEFAULT_API_URL.
   */
  API_URL_VERSION: 'v1',

  /**
   * Daftar ID URL lama (bagian setelah /s/ dan sebelum /exec).
   * Semua URL yang mengandung salah satu ID ini akan otomatis diganti.
   *
   * Saat migrasi lagi, tambahkan ID URL sebelumnya di sini.
   */
  LEGACY_URL_IDS: [
    // Contoh: 'AKfycbzVF04wBd_ZBA0lnAyid2V4chiWUwEMCQH5eSontQgNNTRam4u43a6DhOzfV9L3JN9Kcw'
  ],

  /**
   * Kalau true: setelah migrasi, user tidak perlu login ulang
   * (token lama tetap dipakai; kalau expired, backend akan minta login).
   * Kalau false: setelah migrasi, token langsung dihapus dan user login ulang.
   */
  PRESERVE_SESSION_ON_MIGRATION: true,

  // ============================================
  // STORAGE KEYS
  // ============================================
  STORAGE_KEYS: {
    API_URL: 'sispa_api_url',
    API_URL_VERSION: 'sispa_api_url_version',
    TOKEN: 'sispa_token',
    USER: 'sispa_user'
  },

  REQUEST_TIMEOUT: 30000
};

/**
 * Cek apakah user sudah pakai SISPA sebelumnya.
 * Berguna untuk menampilkan pesan welcome (opsional).
 */
function isNewUser() {
  return !localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.API_URL) &&
         !localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);
}

/**
 * Cek apakah migrasi baru saja terjadi.
 * Dipakai oleh api.js untuk menampilkan banner sekali.
 */
function wasJustMigrated() {
  return sessionStorage.getItem('sispa_just_migrated') === '1';
}

function clearMigrationFlag() {
  sessionStorage.removeItem('sispa_just_migrated');
}

// ============================================
// BASE PATH
// ============================================

const SISPA_BASE = (function () {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] === 'sispa' ? '/sispa' : '';
})();

function sispaUrl(path) {
  return SISPA_BASE + path;
}

// ============================================
// API URL RESOLVER DENGAN AUTO-MIGRASI
// ============================================

function getApiUrl() {
  const stored = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.API_URL);
  const storedVersion = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.API_URL_VERSION);
  const currentVersion = SISPA_CONFIG.API_URL_VERSION;
  const def = SISPA_CONFIG.DEFAULT_API_URL;

  // ===== CEK 1: Version marker =====
  // Kalau versi berubah → reset otomatis ke default
  if (storedVersion && storedVersion !== currentVersion) {
    console.log('[SISPA] Auto-migrate: versi URL berubah dari', storedVersion, 'ke', currentVersion);
    _performMigration(def);
    return def;
  }

  // Set versi untuk pertama kali
  if (!storedVersion) {
    localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.API_URL_VERSION, currentVersion);
  }

  // ===== CEK 2: URL kosong → pakai default =====
  if (!stored || stored.trim() === '') {
    return def;
  }

  const s = stored.trim();

  // ===== CEK 3: URL sama dengan default → pakai =====
  if (s === def) return s;

  // ===== CEK 4: Legacy URL ID → migrasi =====
  const legacyIds = SISPA_CONFIG.LEGACY_URL_IDS || [];
  for (const legacy of legacyIds) {
    if (legacy && s.includes(legacy)) {
      console.log('[SISPA] Auto-migrate: URL lama terdeteksi (ID ' + legacy.slice(0, 12) + '...)');
      _performMigration(def);
      return def;
    }
  }

  // ===== CEK 5: URL kustom (admin override) → pakai =====
  return s;
}

/**
 * Internal: lakukan migrasi URL.
 */
function _performMigration(newUrl) {
  // 1. Set URL baru
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.API_URL, newUrl);

  // 2. Update version marker
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.API_URL_VERSION, SISPA_CONFIG.API_URL_VERSION);

  // 3. Hapus cache frontend (data lama dari backend lama)
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('cache:'))
      .forEach(k => sessionStorage.removeItem(k));
  } catch (e) { /* abaikan */ }

  // 4. Session handling
  if (!SISPA_CONFIG.PRESERVE_SESSION_ON_MIGRATION) {
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.USER);
  }

  // 5. Tandai flag migrasi (ditampilkan sebagai banner 1×)
  try {
    sessionStorage.setItem('sispa_just_migrated', '1');
  } catch (e) { /* abaikan */ }
}

function setApiUrl(url) {
  if (!url || typeof url !== 'string') throw new Error('URL tidak valid');
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.API_URL, url.trim());
  // Update version marker saat admin ganti manual
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.API_URL_VERSION, SISPA_CONFIG.API_URL_VERSION);
}

function resetApiUrl() {
  localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.API_URL);
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.API_URL_VERSION, SISPA_CONFIG.API_URL_VERSION);
}

function isApiUrlCustom() {
  const s = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.API_URL);
  return !!(s && s.trim() !== '' && s.trim() !== SISPA_CONFIG.DEFAULT_API_URL);
}

// ============================================
// EXPORT
// ============================================

window.SISPA_CONFIG = SISPA_CONFIG;
window.SISPA_BASE = SISPA_BASE;
window.sispaUrl = sispaUrl;
window.getApiUrl = getApiUrl;
window.setApiUrl = setApiUrl;
window.resetApiUrl = resetApiUrl;
window.isApiUrlCustom = isApiUrlCustom;
window.isNewUser = isNewUser;
window.wasJustMigrated = wasJustMigrated;
window.clearMigrationFlag = clearMigrationFlag;
