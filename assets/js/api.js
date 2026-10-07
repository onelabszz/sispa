/**
 * SISPA — API Client
 * Semua request ke GAS lewat sini.
 * Mendukung auto-migrasi URL + batch request.
 */

async function sispaRequest(action, payload = {}) {
  const apiUrl = getApiUrl();
  const token = localStorage.getItem(SISPA_CONFIG.STORAGE_KEYS.TOKEN);

  const body = Object.assign({}, payload, {
    action: action,
    version: 'v1',
    token: token || '',
    client_request_id: generateRequestId()
  });

  if (body.payload === undefined) {
    body.payload = payload;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SISPA_CONFIG.REQUEST_TIMEOUT
  );

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();

    if (data.status === 'error') {
      const err = new Error(data.message || 'Terjadi kesalahan');
      err.code = data.code;
      throw err;
    }

    return data.data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Permintaan timeout. Periksa koneksi atau URL GAS.');
    }
    throw err;
  }
}

/**
 * Batch request — gabungkan beberapa action dalam 1 HTTP call.
 */
async function sispaBatch(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new Error('Batch actions kosong');
  }
  if (actions.length > 5) {
    throw new Error('Maksimal 5 actions per batch');
  }

  const normalized = actions.map((a, i) => Object.assign({}, a, {
    key: a.key || a.action || ('action_' + i)
  }));

  const res = await sispaRequest('batch', { actions: normalized });

  res.get = function (key) {
    const r = res.results[key];
    if (!r) throw new Error('Batch key tidak ditemukan: ' + key);
    if (r.error) throw new Error(r.error);
    return r.data;
  };

  res.ok = function (key) {
    return res.results[key] && !res.results[key].error;
  };

  return res;
}

function generateRequestId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
}

async function testApiConnection(url) {
  const target = url || getApiUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'admin.health', version: 'v1' }),
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    return { ok: data.status === 'ok', data: data };
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, error: err.message || String(err) };
  }
}

/**
 * Cache request dengan sessionStorage.
 */
async function sispaRequestCached(action, payload = {}, ttlSeconds = 120) {
  const cacheKey = 'cache:' + action + ':' + JSON.stringify(payload);
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.expires > Date.now()) return parsed.data;
    } catch (e) { /* abaikan */ }
  }

  const data = await sispaRequest(action, payload);
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      data: data,
      expires: Date.now() + ttlSeconds * 1000
    }));
  } catch (e) { /* abaikan */ }
  return data;
}

function clearFrontendCache() {
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith('cache:'))
      .forEach(k => sessionStorage.removeItem(k));
  } catch (e) { /* abaikan */ }
}

window.sispaRequest = sispaRequest;
window.sispaBatch = sispaBatch;
window.sispaRequestCached = sispaRequestCached;
window.clearFrontendCache = clearFrontendCache;
window.testApiConnection = testApiConnection;
