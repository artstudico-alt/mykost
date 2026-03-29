/**
 * Midtrans Snap — Client Key di frontend (aman untuk Snap).
 * VITE_MIDTRANS_CLIENT_KEY, VITE_MIDTRANS_IS_PRODUCTION
 * VITE_MIDTRANS_SNAP_MODE: "redirect" (halaman pembayaran Midtrans penuh) | "popup" (snap.pay)
 */

const SNAP_SRC_SANDBOX = 'https://app.sandbox.midtrans.com/snap/snap.js'
const SNAP_SRC_PRODUCTION = 'https://app.midtrans.com/snap/snap.js'

export function getMidtransClientKey() {
  return import.meta.env.VITE_MIDTRANS_CLIENT_KEY || ''
}

/** @returns {'redirect' | 'popup'} */
export function getSnapPaymentMode() {
  const m = (import.meta.env.VITE_MIDTRANS_SNAP_MODE || 'redirect').toLowerCase()
  return m === 'popup' ? 'popup' : 'redirect'
}

/**
 * Hanya terima URL checkout Snap resmi (bukan callback / URL app kita).
 * Jika backend/API salah mengembalikan localhost atau domain sendiri, fallback vtweb.
 */
function isMidtransSnapCheckoutUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    return (
      h.endsWith('midtrans.com') ||
      h.endsWith('veritrans.co.id') ||
      h.endsWith('midtrans.io')
    )
  } catch {
    return false
  }
}

/**
 * Buka halaman pembayaran Snap penuh (sandbox / production).
 * Jika redirect_url tidak ada atau bukan host Midtrans, pakai pola vtweb resmi.
 *
 * @param {string|null|undefined} redirectUrl dari API (createTransaction.redirect_url)
 * @param {string|null|undefined} snapToken token Snap (wajib jika redirectUrl kosong)
 */
export function openSnapRedirect(redirectUrl, snapToken) {
  const isProd = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
  const host = isProd ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com'
  const fromApi = isMidtransSnapCheckoutUrl(redirectUrl) ? redirectUrl : null
  const url =
    fromApi ||
    (snapToken ? `${host}/snap/v2/vtweb/${encodeURIComponent(snapToken)}` : null)
  if (!url) {
    throw new Error('Tidak ada redirect_url atau snap_token untuk halaman pembayaran Midtrans')
  }
  window.location.replace(url)
}

export function loadMidtransSnap() {
  const clientKey = getMidtransClientKey()
  if (!clientKey) {
    return Promise.reject(
      new Error('VITE_MIDTRANS_CLIENT_KEY belum diisi di frontend (.env). Salin dari MIDTRANS_CLIENT_KEY backend.')
    )
  }

  if (typeof window !== 'undefined' && window.snap) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-midtrans-snap="1"]')
    if (existing) {
      const done = () => (window.snap ? resolve() : reject(new Error('Midtrans Snap tidak tersedia')))
      if (window.snap) return resolve()
      existing.addEventListener('load', done)
      existing.addEventListener('error', () => reject(new Error('Gagal memuat script Midtrans')))
      return
    }

    const isProd = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
    const script = document.createElement('script')
    script.src = isProd ? SNAP_SRC_PRODUCTION : SNAP_SRC_SANDBOX
    script.setAttribute('data-client-key', clientKey)
    script.setAttribute('data-midtrans-snap', '1')
    script.async = true
    script.onload = () => {
      if (window.snap) resolve()
      else reject(new Error('window.snap tidak didefinisikan setelah load'))
    }
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap.js — periksa Client Key & jaringan'))
    document.body.appendChild(script)
  })
}

/**
 * @param {string} snapToken
 * @param {object} [callbacks] onSuccess, onPending, onError, onClose
 */
export function payWithSnap(snapToken, callbacks = {}) {
  if (!window.snap) {
    throw new Error('Snap belum dimuat — panggil loadMidtransSnap() dulu')
  }
  window.snap.pay(snapToken, {
    onSuccess: callbacks.onSuccess,
    onPending: callbacks.onPending,
    onError: callbacks.onError,
    onClose: callbacks.onClose,
  })
}
