import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, CheckCircle, Calendar, CreditCard } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, kost, user, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nik: user?.nik || '',
    ktp_photo: null,
    tanggal_mulai: '',
    durasi_bulan: 1,
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        nik: user.nik || prev.nik,
      }));
    }
  }, [user]);

  console.log('BookingModal rendered, isOpen:', isOpen);
  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, ktp_photo: e.target.files[0] }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="booking-step">
            <h3 className="booking-step-title">Tertarik dengan Properti Ini?</h3>
            <p className="booking-step-desc">Dapatkan info lebih lanjut terkait properti ini langsung dari pemilik.</p>
            <div className="booking-form-group">
              <label>Nama Lengkap</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="booking-form-group">
              <label>Nomor HP / WhatsApp</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+62 8xx xxxx xxxx"
              />
            </div>
            <div className="booking-form-group">
              <label>Email Aktif</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="nama@email.com"
              />
            </div>
            <button className="booking-next-btn" onClick={handleNext}>Lanjut</button>
          </div>
        );
      case 2:
        return (
          <div className="booking-step">
            <h3 className="booking-step-title">Lengkapi Data Diri</h3>
            <p className="booking-step-desc">Data ini diperlukan untuk verifikasi identitas penyewa.</p>
            <div className="booking-form-group">
              <label>Nomor KTP (NIK)</label>
              <input 
                type="text" 
                name="nik" 
                value={formData.nik} 
                onChange={handleChange} 
                placeholder="16 digit NIK"
              />
            </div>
            <div className="booking-form-group">
              <label>Foto KTP</label>
              <div className="booking-upload-area">
                <input 
                  type="file" 
                  id="ktp_upload" 
                  onChange={handleFileChange} 
                  accept="image/*"
                  hidden
                />
                <label htmlFor="ktp_upload" className="booking-upload-label">
                  <Upload size={24} />
                  <span>{formData.ktp_photo ? formData.ktp_photo.name : 'Klik untuk upload foto KTP'}</span>
                </label>
              </div>
            </div>
            <div className="booking-actions">
              <button className="booking-back-btn" onClick={handleBack}><ArrowLeft size={18} /> Kembali</button>
              <button className="booking-next-btn" onClick={handleNext}>Lanjut</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="booking-step">
            <h3 className="booking-step-title">Pilih Durasi Sewa</h3>
            <p className="booking-step-desc">Tentukan kapan kamu akan mulai menempati kost ini.</p>
            <div className="booking-form-group">
              <label>Mulai Kost dari Bulan</label>
              <input 
                type="date" 
                name="tanggal_mulai" 
                value={formData.tanggal_mulai} 
                onChange={handleChange} 
              />
            </div>
            <div className="booking-form-group">
              <label>Durasi Sewa (Bulan)</label>
              <select name="durasi_bulan" value={formData.durasi_bulan} onChange={handleChange}>
                {[1, 2, 3, 6, 12].map(m => (
                  <option key={m} value={m}>{m} Bulan</option>
                ))}
              </select>
            </div>
            <div className="booking-summary-card">
              <div className="summary-row">
                <span>Harga per Bulan</span>
                <span>{kost.priceLabel}</span>
              </div>
              <div className="summary-row total">
                <span>Total Estimasi</span>
                <span>Rp {(parseInt(kost.priceLabel.replace(/[^0-9]/g, '')) * formData.durasi_bulan).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="booking-actions">
              <button className="booking-back-btn" onClick={handleBack}><ArrowLeft size={18} /> Kembali</button>
              <button className="booking-next-btn" onClick={handleNext}>Lanjut ke Pembayaran</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="booking-step text-center">
            <div className="booking-success-icon">
              <CreditCard size={48} className="text-blue-500" />
            </div>
            <h3 className="booking-step-title">Siap untuk Pembayaran?</h3>
            <p className="booking-step-desc">Klik tombol di bawah untuk melanjutkan ke gerbang pembayaran aman.</p>
            <div className="booking-final-summary">
              <p>Properti: <strong>{kost.title}</strong></p>
              <p>Mulai: <strong>{formData.tanggal_mulai}</strong></p>
              <p>Durasi: <strong>{formData.durasi_bulan} Bulan</strong></p>
            </div>
            <button className="booking-pay-btn" onClick={() => onSubmit(formData)}>
              Bayar Sekarang
            </button>
            <button className="booking-cancel-link" onClick={onClose}>Batalkan</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal-content">
        <button className="booking-modal-close" onClick={onClose}><X size={20} /></button>
        <div className="booking-modal-header">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
          <div className={`step-dot ${step >= 4 ? 'active' : ''}`} />
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default BookingModal;
