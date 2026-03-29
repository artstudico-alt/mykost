import React, { useState, useEffect, useRef } from 'react'
import { X, ArrowLeft, Upload, CreditCard } from 'lucide-react'
import { getSnapPaymentMode } from '../utils/midtrans'
import '../booking-modal.css'

/**
 * Sewa per kost (tanpa pilihan kamar).
 * @param {object} kost — dari API: { id, nama_kost, harga_min, ... }
 */
const BookingModal = ({ isOpen, onClose, kost, user, onSubmit, isSubmitting = false }) => {
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nik: user?.nik || '',
    ktp_photo: null,
    tanggal_mulai: '',
    durasi_bulan: 1,
  })

  const wasOpenRef = useRef(false)
  useEffect(() => {
    const wasOpen = wasOpenRef.current
    if (isOpen && !wasOpen) {
      setStep(1)
    }
    wasOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setFormData((prev) => ({
      ...prev,
      name: user?.name ?? prev.name,
      email: user?.email ?? prev.email,
      phone: user?.phone ?? prev.phone,
      nik: user?.nik ?? prev.nik,
    }))
  }, [isOpen, user])

  if (!isOpen || !kost) return null

  const hargaBulan = Number(kost.harga_min || 0)
  const totalEstimasi = hargaBulan * Number(formData.durasi_bulan || 1)
  const isProd =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'

  const handleNext = () => setStep((s) => Math.min(s + 1, 4))
  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'durasi_bulan') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 1 }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, ktp_photo: e.target.files[0] }))
  }

  const kostSiapBooking = String(kost.status || '').toLowerCase() === 'aktif'

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="booking-step">
            <h3 className="booking-step-title">Data kontak</h3>
            <p className="booking-step-desc">Lengkapi kontak untuk proses sewa dan pembayaran.</p>
            <div className="booking-form-group">
              <label htmlFor="bm-name">Nama lengkap</label>
              <input
                id="bm-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nama sesuai identitas"
                autoComplete="name"
              />
            </div>
            <div className="booking-form-group">
              <label htmlFor="bm-phone">Nomor HP / WhatsApp</label>
              <input
                id="bm-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                autoComplete="tel"
              />
            </div>
            <div className="booking-form-group">
              <label htmlFor="bm-email">Email</label>
              <input
                id="bm-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </div>
            <div className="booking-actions">
              <button type="button" className="booking-next-btn" onClick={handleNext}>
                Lanjut
              </button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="booking-step">
            <h3 className="booking-step-title">Verifikasi identitas</h3>
            <p className="booking-step-desc">Digunakan sesuai ketentuan penyewaan.</p>
            <div className="booking-form-group">
              <label htmlFor="bm-nik">NIK</label>
              <input
                id="bm-nik"
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                placeholder="Nomor Induk Kependudukan"
                maxLength={16}
              />
            </div>
            <div className="booking-form-group">
              <span className="booking-form-group-label-text">Foto KTP</span>
              <div className="booking-upload-area">
                <label htmlFor="ktp_upload" className="booking-upload-label">
                  <Upload size={18} /> {formData.ktp_photo ? formData.ktp_photo.name : 'Unggah file'}
                </label>
                <input id="ktp_upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
              </div>
            </div>
            <div className="booking-actions">
              <button type="button" className="booking-back-btn" onClick={handleBack}>
                <ArrowLeft size={18} /> Kembali
              </button>
              <button type="button" className="booking-next-btn" onClick={handleNext}>
                Lanjut
              </button>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="booking-step">
            <h3 className="booking-step-title">Durasi sewa kost</h3>
            <p className="booking-step-desc">Harga mengikuti tarif kost ({kost.nama_kost}).</p>
            {!kostSiapBooking && (
              <p className="booking-warn">Kost ini belum aktif untuk booking online.</p>
            )}
            <div className="booking-form-group">
              <label htmlFor="bm-mulai">Tanggal mulai sewa</label>
              <input
                id="bm-mulai"
                type="date"
                name="tanggal_mulai"
                value={formData.tanggal_mulai}
                onChange={handleChange}
              />
            </div>
            <div className="booking-form-group">
              <label htmlFor="bm-durasi">Durasi (bulan)</label>
              <select
                id="bm-durasi"
                name="durasi_bulan"
                value={formData.durasi_bulan}
                onChange={handleChange}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} bulan
                  </option>
                ))}
              </select>
            </div>
            <div className="booking-summary-card booking-summary-card--minimal">
              <p>
                Perkiraan total: <strong>Rp {totalEstimasi.toLocaleString('id-ID')}</strong>
              </p>
              <p className="booking-midtrans-hint">Rp {hargaBulan.toLocaleString('id-ID')} × {formData.durasi_bulan} bulan</p>
            </div>
            <div className="booking-actions">
              <button type="button" className="booking-back-btn" onClick={handleBack}>
                <ArrowLeft size={18} /> Kembali
              </button>
              <button
                type="button"
                className="booking-next-btn"
                onClick={handleNext}
                disabled={!formData.tanggal_mulai || !kostSiapBooking}
              >
                Lanjut
              </button>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="booking-step booking-step--finalize">
            <div className="booking-success-icon">
              <CreditCard size={44} strokeWidth={1.5} className="booking-step-icon-midtrans" />
            </div>
            <h3 className="booking-step-title">Bayar dengan Midtrans</h3>
            <p className="booking-step-desc">
              {getSnapPaymentMode() === 'redirect'
                ? isProd
                  ? 'Anda akan diarahkan ke halaman pembayaran Midtrans (production).'
                  : 'Anda akan diarahkan ke halaman pembayaran sandbox Midtrans. Gunakan kartu / metode uji dari dashboard Midtrans.'
                : isProd
                  ? 'Setelah konfirmasi, jendela pembayaran Midtrans (production) akan terbuka.'
                  : 'Setelah konfirmasi, jendela pembayaran sandbox akan terbuka. Gunakan kartu / metode tes Midtrans.'}
            </p>
            <div className="booking-final-summary">
              <p>
                <strong>{kost.nama_kost}</strong>
              </p>
              <p>
                Mulai: <strong>{formData.tanggal_mulai || '—'}</strong> · {formData.durasi_bulan} bulan
              </p>
              <p className="booking-final-total">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
            </div>
            <button
              type="button"
              className="booking-pay-btn"
              disabled={isSubmitting || !kostSiapBooking}
              onClick={() => onSubmit(formData)}
            >
              {isSubmitting ? 'Memproses…' : 'Buka pembayaran'}
            </button>
            <button type="button" className="booking-cancel-link" onClick={onClose}>
              Batal
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="booking-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <div className="booking-modal-content">
        <button type="button" className="booking-modal-close" onClick={onClose} aria-label="Tutup">
          <X size={20} />
        </button>
        <div className="booking-modal-header" id="booking-modal-title">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`step-dot ${step >= i ? 'active' : ''}`} />
          ))}
        </div>
        {renderStep()}
      </div>
    </div>
  )
}

export default BookingModal
