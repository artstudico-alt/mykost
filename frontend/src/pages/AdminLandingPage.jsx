import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Layout, Type, FileText, CheckCircle, Loader2, Home } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const AdminLandingPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previews, setPreviews] = useState({});

  const DEFAULT_VALUES = {
    site_name: 'mykost',
    hero_title: 'Cari Kos-Kosan Online Terpercaya',
    hero_subtitle: 'Ribuan pilihan hunian nyaman, aman, dan terjangkau tersebar di seluruh Bogor dan Indonesia. Proses mudah, booking sekarang!',
    search_placeholder: 'Cari lokasi, stasiun, atau universitas...',
    recommendation_title: 'Rekomendasi kos terbaru',
    feature_1_title: '100% Terverifikasi',
    feature_1_desc: 'Properti kami diverifikasi langsung oleh tim lapangan untuk menjamin keaslian data.',
    feature_2_title: 'Harga Transparan',
    feature_2_desc: 'Tidak ada biaya tersembunyi. Semua harga ditampilkan secara jujur sesuai kontrak.',
    feature_3_title: 'Proses Cepat',
    feature_3_desc: 'Mulai dari pencarian hingga akad sewa, semuanya bisa dilakukan dalam satu aplikasi.'
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/landing-page');
      if (response.data.success) {
        // Merge defaults with fetched data
        setSettings({ ...DEFAULT_VALUES, ...response.data.data });
      } else {
        setSettings(DEFAULT_VALUES);
      }
    } catch (error) {
      console.error('Gagal mengambil settings:', error);
      setSettings(DEFAULT_VALUES);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setSettings(prev => ({ ...prev, [name]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    Object.keys(settings).forEach(key => {
        formData.append(key, settings[key]);
    });

    try {
      await api.post('/landing-page', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Landing Page berhasil diperbarui!');
      fetchSettings(); // Refresh to get the new URLs
      setPreviews({}); // Clear previews
    } catch (error) {
      console.error('Gagal menyimpan settings:', error);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionStyle = {
    background: 'white',
    borderRadius: '24px',
    padding: '32px',
    marginBottom: '24px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 24px rgba(0,0,0,0.02)'
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 800,
    color: '#64748b',
    display: 'block',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color="#059669" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>Kelola Landing Page</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px', fontWeight: 500 }}>Sesuaikan logo, teks, dan gambar halaman utama Anda.</p>
        </div>
        <button 
          form="cms-form"
          type="submit"
          disabled={isSubmitting}
          style={{ 
            background: '#059669', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '14px', 
            fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
            boxShadow: '0 10px 20px -5px rgba(5, 150, 105, 0.4)', transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <form id="cms-form" onSubmit={handleSubmit}>
        
        {/* BRANDING */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: '10px' }}><Layout size={20} /></div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Branding & Identitas</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Nama Situs (Brand Text)</label>
              <input 
                name="site_name"
                value={settings.site_name ?? ''}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Contoh: MyKost"
              />
            </div>
            <div>
              <label style={labelStyle}>Logo Situs</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#f8fafc', border: '1.5px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {previews.logo || settings.logo ? (
                        <img src={previews.logo || settings.logo} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <ImageIcon size={24} color="#cbd5e1" />
                    )}
                </div>
                <label style={{ background: 'white', color: '#059669', border: '1px solid #a7f3d0', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  Pilih Logo
                  <input type="file" name="logo" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '10px' }}><Type size={20} /></div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Bagian Hero (Banner Utama)</h2>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Judul Utama (Title)</label>
              <input 
                name="hero_title"
                value={settings.hero_title ?? ''}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Sub Judul (Subtitle)</label>
              <textarea 
                name="hero_subtitle"
                value={settings.hero_subtitle ?? ''}
                onChange={handleInputChange}
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={labelStyle}>Pesan Placeholder Cari</label>
                <input 
                  name="search_placeholder"
                  value={settings.search_placeholder ?? ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Gambar Ilustrasi Hero</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '120px', height: '60px', borderRadius: '12px', background: '#f8fafc', border: '1.5px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {previews.hero_image || settings.hero_image ? (
                          <img src={previews.hero_image || settings.hero_image} alt="Hero Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                          <ImageIcon size={24} color="#cbd5e1" />
                      )}
                  </div>
                  <label style={{ background: 'white', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Ganti Gambar
                    <input type="file" name="hero_image" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES SECTION */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '8px', borderRadius: '10px' }}><CheckCircle size={20} /></div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Fitur Unggulan (3 Kartu)</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[1, 2, 3].map(num => (
              <div key={num} style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <p style={{ ...labelStyle, color: '#059669', marginBottom: '12px' }}>Fitur {num}</p>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ ...labelStyle, fontSize: '10px' }}>Judul</label>
                  <input 
                    name={`feature_${num}_title`}
                    value={settings[`feature_${num}_title`] ?? ''}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, fontSize: '10px' }}>Deskripsi</label>
                  <textarea 
                    name={`feature_${num}_desc`}
                    value={settings[`feature_${num}_desc`] ?? ''}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, minHeight: '60px', fontSize: '13px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECOMMENDATION SECTION */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#f1f5f9', color: '#475569', padding: '8px', borderRadius: '10px' }}><Home size={20} /></div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Section Rekomendasi</h2>
          </div>
          <div>
            <label style={labelStyle}>Judul Section Rekomendasi</label>
            <input 
              name="recommendation_title"
              value={settings.recommendation_title ?? ''}
              onChange={handleInputChange}
              style={inputStyle}
            />
          </div>
        </div>

      </form>
    </div>
  );
};

export default AdminLandingPage;
