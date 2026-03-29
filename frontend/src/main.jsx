import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * Midtrans mengarahkan balik ke URL callback dengan query (?order_id=...) di depan hash.
 * HashRouter hanya membaca hash — tanpa normalisasi ini user tetap di route "/" (beranda).
 */
;(function normalizeMidtransReturnUrl() {
  const { search, hash, pathname, origin } = window.location
  if (!search || !search.includes('order_id=')) return
  const q = search.startsWith('?') ? search : `?${search}`
  let step = 'selesai'
  if (hash.includes('unfinish')) step = 'unfinish'
  else if (hash.includes('error')) step = 'error'
  const hashHasQuery = hash.includes('?')
  if (!hash.includes('/pembayaran/')) {
    window.location.replace(`${origin}${pathname}#/pembayaran/${step}${q}`)
    return
  }
  if (hash.includes('/pembayaran/') && !hashHasQuery) {
    window.location.replace(`${origin}${pathname}#/pembayaran/${step}${q}`)
  }
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
