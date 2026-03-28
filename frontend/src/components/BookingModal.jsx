import React, { useState, useEffect } from 'react'
import { X, ArrowLeft, Upload, CreditCard } from 'lucide-react'
import '../booking-modal.css'

/**
 * @param {object} kost — dari API: { id, nama_kost, harga_min, ... }
 * @param {Array} kamars — kamar tersedia (status kosong), punya id, nomor_kamar, harga_bulanan
 */
const BookingModal = ({ isOpen, onClose, kost, kamars = [], user, onSubmit, isSubmitting = false }) => {
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nik: user?.nik || '',
    ktp_photo: null,
    tanggal_mulai: '',
    durasi_bulan: 1,
    kamar_id: '',
  })

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    const kid = kamars[0]?.id != null ? String(kamars[0].id) : ''
    setFormData((prev) => ({
      ...prev,
      kamar_id: kid,
      name: user?.name || prev.name,
      email: user?.email || prev.email,
      phone: user?.phone || prev.phone,
      nik: user?.nik || prev.nik,
    }))
  }, [isOpen, user, kamars])

  if (!isOpen || !kost) return null

  const selectedKamar = kamars.find((k) => String(k.id) === String(formData.kamar_id))
  const hargaBulan = selectedKamar
    ? Number(selectedKamar.harga_bulanan)
    : Number(kost.harga_min || 0)
  const totalEstimasi = hargaBulan * Number(formData.durasi_bulan || 1)

  const handleNext = () => setStep((s) => Math.min(s + 1, 4))
  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'durasi_bulan') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 1 }))
      return
    }
    if (name === 'kamar_id') {
      setFormData((prev) => ({ ...prev, kamar_id: value }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, ktp_photo: e.target.files[0] }))
  }

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
            <button type="button" className="booking-next-btn" onClick={handleNext}>
              Lanjut
            </button>
          </div>
        )
      case 2:
        return (
          <div className="booking-step">
            <h3 className="booking-step-title">Verifikasi identitas</h3>
            <p className="booking-step-desc">Digunakan sesuai ketentuan penyewaan.</p>
            <div className="booking-form-group">
              <label htmlFor="bm-nik">NIK (16 digit)</label>
              <input
                id="bm-nik"
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                placeholder="3201xxxxxxxxxxxx"
                maxLength={16}
              />
            </div>
            <div className="booking-form-group">
              <span className="booking-form-group-label-text">Foto KTP</span>
              <div className="booking-upload-area">
                <input type="file" id="ktp_upload" onChange={handleFileChange} accept="image/*" hidden />
                <label htmlFor="ktp_upload" className="booking-upload-label">
                  <Upload size={24} strokeWidth={1.75} />
                  <span>{formData.ktp_photo ? formData.ktp_photo.name : 'Unggah foto KTP'}</span>
                </label>
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
            <h3 className="booking-step-title">Kamar & durasi</h3>
            <p className="booking-step-desc">Pilih kamar kosong dan tanggal mulai sewa.</p>
            {kamars.length === 0 ? (
              <p className="booking-warn">Saat ini tidak ada kamar kosong untuk kost ini.</p>
            ) : (
              <div className="booking-form-group">
                <label htmlFor="bm-kamar">Kamar</label>
                <select id="bm-kamar" name="kamar_id" value={formData.kamar_id} onChange={handleChange}>
                  {kamars.map((k) => (
                    <option key={k.id} value={String(k.id)}>
                      {k.nomor_kamar || `Kamar ${k.id}`} — Rp {Number(k.harga_bulanan).toLocaleString('id-ID')}/bln
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="booking-form-group">
              <label htmlFor="bm-start">Mulai sewa</label>
              <input
                id="bm-start"
                type="date"
                name="tanggal_mulai"
                value={formData.tanggal_mulai}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="booking-form-group">
              <label htmlFor="bm-durasi">Durasi (bulan)</label>
              <select id="bm-durasi" name="durasi_bulan" value={formData.durasi_bulan} onChange={handleChange}>
                {[1, 2, 3, 6, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} bulan
                  </option>
                ))}
              </select>
            </div>
            <div className="booking-summary-card booking-summary-card--minimal">
              <div className="summary-row">
                <span>Harga / bulan</span>
                <span>Rp {hargaBulan.toLocaleString('id-ID')}</span>
              </div>
              <div className="summary-row">
                <span>Durasi</span>
                <span>{formData.durasi_bulan} bulan</span>
              </div>
              <div className="summary-row total">
                <span>Total pembayaran</span>
                <span>Rp {totalEstimasi.toLocaleString('id-ID')}</span>
              </div>
              <p className="booking-midtrans-hint">Pembayaran aman via Midtrans (kartu, QRIS, e-wallet sandbox).</p>
            </div>
            <div className="booking-actions">
              <button type="button" className="booking-back-btn" onClick={handleBack}>
                <ArrowLeft size={18} /> Kembali
              </button>
              <button
                type="button"
                className="booking-next-btn"
                onClick={handleNext}
                disabled={kamars.length === 0 || !formData.tanggal_mulai}
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
              Setelah konfirmasi, popup pembayaran sandbox akan terbuka. Gunakan kartu / metode tes Midtrans.
            </p>
            <div className="booking-final-summary">
              <p>
                <strong>{kost.nama_kost}</strong>
              </p>
              {selectedKamar && (
                <p>
                  Kamar: <strong>{selectedKamar.nomor_kamar || selectedKamar.id}</strong>
                </p>
              )}
              <p>
                Mulai: <strong>{formData.tanggal_mulai || '—'}</strong> · {formData.durasi_bulan} bulan
              </p>
              <p className="booking-final-total">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
            </div>
            <button
              type="button"
              className="booking-pay-btn"
              disabled={isSubmitting || kamars.length === 0}
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
