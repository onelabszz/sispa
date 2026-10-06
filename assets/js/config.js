/**
 * SISPA — Konfigurasi Frontend
 */
const SISPA_CONFIG = {
  APP_NAME: 'SISPA',
  APP_VERSION: '1.0.0',
  DEFAULT_API_URL: 'https://script.google.com/macros/s/AKfycbzVF04wBd_ZBA0lnAyid2V4chiWUwEMCQH5eSontQgNNTRam4u43a6DhOzfV9L3JN9Kcw/exec',
  REQUEST_TIMEOUT: 30000,
  STORAGE_KEYS: {
    API_URL: 'sispa_api_url',
    TOKEN: 'sispa_token',
    USER: 'sispa_user'
  }
};

/** Deteksi base path (/sispa atau kosong). */
const SISPA_BASE = (function () {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] === 'sispa' ? '/sispa' : '';
})();

function sispaUrl(path) {
  return SISPA_BASE + path;
}

function getApiUrl() {
  const stored = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.API_URL);
  return stored && stored.trim() !== '' ? stored.trim() : SISPA_CONFIG.DEFAULT_API_URL;
}

function setApiUrl(url) {
  if (!url || typeof url !== 'string') throw new Error('URL tidak valid');
  localStorage.setItem(SISPA_CONFIG.STORAGE_KEYS.API_URL, url.trim());
}

function resetApiUrl() {
  localStorage.removeItem(SISPA_CONFIG.STORAGE_KEYS.API_URL);
}

function isApiUrlCustom() {
  const s = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.API_URL);
  return !!(s && s.trim() !== '');
}

window.SISPA_CONFIG = SISPA_CONFIG;
window.SISPA_BASE = SISPA_BASE;
window.sispaUrl = sispaUrl;
window.getApiUrl = getApiUrl;
window.setApiUrl = setApiUrl;
window.resetApiUrl = resetApiUrl;
window.isApiUrlCustom = isApiUrlCustom;

function sispaIsAdmin() {
  const u = sispaGetUser ? sispaGetUser() : null;
  if (u && u.role === 'Admin') return true;
  // Fallback: admin via NPSN tertentu (opsional)
  const adminNpsn = ['11111111'];
  return u && adminNpsn.includes(String(u.npsn));
}

window.sispaIsAdmin = sispaIsAdmin;
