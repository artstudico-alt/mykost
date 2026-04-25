import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * Midtrans mengarahkan balik ke URL callback dengan query (?order_id=...) di depan hash.
 * HashRouter hanya membaca hash — tanpa normalisasi ini user tetap di route "/" (beranda).
 */
// Register Service Worker for PWA
// Service Worker disabled in development to prevent caching issues
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available, show update notification
              if (confirm('Versi baru MyKost tersedia! Update sekarang?')) {
                newWorker.postMessage({ action: 'skipWaiting' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('SW registration failed: ', error);
      });
  });
}
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
