import React, { useState, useEffect } from 'react';
import { Home, Edit2, Trash2, Search, MapPin, CheckCircle, XCircle, Clock, Loader2, Plus, Image as ImageIcon, Star, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useGlobalModal } from '../context/ModalContext';

// Fix Marker Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component untuk update peta jika FormData diganti manual
function FormMapUpdater({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Helper untuk klik Map Interaktif + Reverse Geocoding
function MapClickSetter({ setFormData, confirm }) {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setFormData(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lng) }));
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const street = addr.road || addr.pedestrian || addr.suburb || '';
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const state = addr.state || '';
          
          confirm(`Gunakan alamat terdeteksi?\n${data.display_name}`, () => {
            setFormData(prev => ({
              ...prev,
              alamat: street ? `${street}, ${addr.house_number || ''}` : prev.alamat,
              kota: city || prev.kota,
              provinsi: state || prev.provinsi
            }));
          });
        }
      } catch (err) {
        console.error('Reverse Geocode Error:', err);
      }
    },
  });
  return null;
}

const AdminKost = () => {
  const { user, loading: authLoading } = useAuth();
  const { alert: modalAlert, confirm: modalConfirm } = useGlobalModal();
  const role = user?.role?.name || '';
  const isOwner = role === 'pemilik_kost';
  const isAdmin = role === 'super_admin';

  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [currentKost, setCurrentKost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Gallery States
  const [photos, setPhotos] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    nama_kost: '', alamat: '', kota: '', provinsi: 'Jawa Barat', tipe: 'campur', harga_min: '', status: 'pending', deskripsi: '', latitude: -6.1751, longitude: 106.8650, jumlah_kamar: '', kode_kamar_list: []
  });

  // Delete reason modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState({ id: null, nama: '' });
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Delete requests for admin
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('kost'); // 'kost' | 'delete-requests'

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid #e2e8f0', outline: 'none',
    fontSize: 14, fontWeight: 600, color: '#0f172a',
    background: 'white', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 800, color: '#64748b',
    display: 'block', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: '0.7px',
  };


  // Tunggu AuthContext selesai sebelum fetch, cegah race condition
  useEffect(() => {
    if (!authLoading && user) {
      fetchKosts();
      if (isAdmin) {
        fetchDeleteRequests();
      }
    }
  }, [authLoading, user]);

  // Fetch delete requests when tab changes to delete-requests
  useEffect(() => {
    if (isAdmin && activeTab === 'delete-requests') {
      fetchDeleteRequests();
    }
  }, [activeTab, isAdmin]);

  const fetchKosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Token belum tersedia, skip fetch.');
        return;
      }

      // Super admin: moderasi. Pemilik: hanya properti sendiri (?mine=1). Lainnya: katalog aktif.
      const endpoint = isAdmin ? '/kost/moderasi' : (isOwner ? '/kost?mine=1' : '/kost');
      
      // CRITICAL DEBUG: Log everything about the request
      console.log('=== CRITICAL DEBUG - KOST FETCH ===');
      console.log('Current user:', user);
      console.log('User ID:', user?.id);
      console.log('User name:', user?.name);
      console.log('User email:', user?.email);
      console.log('User role:', role);
      console.log('IsOwner:', isOwner);
      console.log('IsAdmin:', isAdmin);
      console.log('Endpoint being called:', endpoint);
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      
      const response = await api.get(endpoint);
      console.log('=== API RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data length:', response.data.data?.length || 0);
      
      // CRITICAL: Check if Budi is seeing Santoso's data
      if (isOwner && response.data.data) {
        console.log('=== DATA OWNERSHIP CHECK ===');
        response.data.data.forEach((kost, index) => {
          console.log(`Kost ${index + 1}:`, {
            id: kost.id,
            name: kost.nama_kost,
            owner_id: kost.user_id,
            owner_name: kost.user?.name,
            owner_email: kost.user?.email,
            current_user_id: user?.id,
            current_user_name: user?.name,
            is_owner_correct: kost.user_id === user?.id
          });
          
          // ALERT if Budi is seeing Santoso's data
          if (kost.user_id !== user?.id) {
            console.error('🚨 DATA LEAK DETECTED! 🚨');
            console.error('User is seeing kost that belongs to someone else!');
            console.error('Current user:', user?.name, 'ID:', user?.id);
            console.error('Kost belongs to:', kost.user?.name, 'ID:', kost.user_id);
            console.error('Kost details:', kost);
          }
        });
      }
      
      setKosts(response.data.data || []);
      
      // If no data found for kost owner, try to debug
      if (isOwner && (!response.data.data || response.data.data.length === 0)) {
        console.log('No kosts found for owner, trying debug endpoints...');
        try {
          const debugResponse = await api.get('/debug/kost-permissions');
          console.log('Debug permissions:', debugResponse.data);
          
          // Try the budi-santoso specific debug
          const issueResponse = await api.get('/debug/budi-santoso-issue');
          console.log('Budi-Santoso issue debug:', issueResponse.data);
          
          // Try the debug mine endpoint
          const mineResponse = await api.get('/debug/kost-mine?mine=1');
          console.log('Debug mine response:', mineResponse.data);
          
          if (mineResponse.data.kosts && mineResponse.data.kosts.length > 0) {
            console.log('Found kosts via debug endpoint, updating display...');
            setKosts(mineResponse.data.kosts);
          }
        } catch (debugError) {
          console.error('Debug endpoint failed:', debugError);
        }
      }
      
    } catch (error) {
      console.error('=== FETCH ERROR ===');
      console.error('Gagal mengambil data kost:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Try fallback for kost owners
      if (isOwner && error.response?.status !== 401) {
        console.log('Trying fallback for kost owner...');
        try {
          const fallbackResponse = await api.get('/debug/kost-mine?mine=1');
          if (fallbackResponse.data.kosts) {
            setKosts(fallbackResponse.data.kosts);
            console.log('Using fallback data, found:', fallbackResponse.data.kosts.length, 'kosts');
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      // Jika error 401, berarti sesi habis (karena server restart dll)
      if (error.response?.status === 401) {
        modalAlert('Sesi Anda telah habis. Silakan login kembali.', 'warning', () => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/#/login';
        });
      } else {
        modalAlert('Gagal mengambil data kost. Silakan refresh halaman.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (kost = null) => {
    if (kost) {
      setCurrentKost(kost);

      let initialPhotos = [];
      if (kost.foto_utama) initialPhotos.push(kost.foto_utama);
      if (kost.foto_tambahan && Array.isArray(kost.foto_tambahan)) {
          initialPhotos = [...initialPhotos, ...kost.foto_tambahan];
      }
      setPhotos(initialPhotos);
      setThumbnailIndex(0);

      setFormData({
        nama_kost: kost.nama_kost || '',
        alamat: kost.alamat || '',
        kota: kost.kota || '',
        provinsi: kost.provinsi || 'Jawa Barat',
        tipe: kost.tipe || 'campur',
        harga_min: kost.harga_min || '',
        status: kost.status || 'pending',
        deskripsi: kost.deskripsi || '',
        latitude: kost.latitude || -6.1751,
        longitude: kost.longitude || 106.8650,
        jumlah_kamar: kost.jumlah_kamar || ''
      });
    } else {
      setCurrentKost(null);
      setPhotos([]);
      setThumbnailIndex(0);
      setFormData({
        nama_kost: '', alamat: '', kota: '', provinsi: 'Jawa Barat', tipe: 'campur', harga_min: '', status: 'pending', deskripsi: '', latitude: -6.1751, longitude: 106.8650, jumlah_kamar: '', kode_kamar_list: []
      });
    }
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // Remove the 10 photo limit - allow unlimited photos
    if (photos.length + files.length > 50) {
       modalAlert('Maksimal 50 gambar yang diizinkan!', 'warning');
       return;
    }

    setUploadingImage(true);
    let newPhotos = [...photos];

    try {
       for (let file of files) {
          const formDataObj = new FormData();
          formDataObj.append('image', file);
          
          const res = await api.post('/upload', formDataObj, {
             headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (res.data && res.data.url) {
             newPhotos.push(res.data.url);
          }
       }
       setPhotos(newPhotos);
    } catch (err) {
       modalAlert('Gagal mengupload gambar. Pastikan format jpeg/png/jpg/webp dan ukuran maksimal 5MB.', 'error');
    } finally {
       setUploadingImage(false);
       e.target.value = ''; // Reset input
    }
  };

  const handleRemovePhoto = (idxToRemove) => {
      setPhotos(prev => prev.filter((_, idx) => idx !== idxToRemove));
      if (thumbnailIndex === idxToRemove) {
          setThumbnailIndex(0);
      } else if (thumbnailIndex > idxToRemove) {
          setThumbnailIndex(prev => prev - 1);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let foto_utama = null;
    let foto_tambahan = [];

    if (photos.length > 0) {
        if (thumbnailIndex >= 0 && thumbnailIndex < photos.length) {
            foto_utama = photos[thumbnailIndex];
            foto_tambahan = photos.filter((_, idx) => idx !== thumbnailIndex);
        } else {
            foto_utama = photos[0];
            foto_tambahan = photos.slice(1);
        }
    }

    const payload = { ...formData, foto_utama, foto_tambahan, kode_kamar_list: formData.kode_kamar_list };

    try {
      if (isAdmin && currentKost) {
        // Super Admin hanya update status
        await api.patch(`/kost/${currentKost.id}/status`, { status: payload.status });
      } else if (isOwner) {
        if (currentKost) {
          await api.put(`/kost/${currentKost.id}`, payload);
        } else {
          await api.post('/kost', payload);
        }
      }
      setShowModal(false);
      fetchKosts();
      modalAlert(isAdmin ? 'Status berhasil diperbarui!' : (currentKost ? 'Properti berhasil diperbarui!' : 'Properti baru berhasil ditambahkan!'), 'success');
    } catch (error) {
      console.error('Kost submission error:', error);
      let errorMessage = 'Gagal menyimpan kost';
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Anda tidak memiliki izin untuk membuat kost. Pastikan akun Anda sudah terverifikasi.';
        } else if (error.response.status === 422) {
          const errors = error.response.data.errors || {};
          errorMessage = 'Validasi gagal: ' + Object.values(errors).flat().join(', ');
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      modalAlert(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id, nama) => {
    setDeleteTarget({ id, nama });
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  // Fetch delete requests (admin only)
  const fetchDeleteRequests = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/admin/kost-delete-requests');
      setDeleteRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch delete requests:', err);
    }
  };

  // Approve delete request
  const handleApproveDelete = async (requestId) => {
    try {
      await api.patch(`/admin/kost-delete-requests/${requestId}/approve`);
      modalAlert('Kost berhasil dihapus!', 'success');
      fetchDeleteRequests();
      fetchKosts();
    } catch (err) {
      modalAlert(err.response?.data?.message || 'Gagal menyetujui penghapusan.', 'error');
    }
  };

  // Reject delete request
  const handleRejectDelete = async (requestId) => {
    const reason = prompt('Alasan penolakan (minimal 10 karakter):');
    if (!reason || reason.length < 10) {
      modalAlert('Alasan penolakan minimal 10 karakter.', 'error');
      return;
    }
    try {
      await api.patch(`/admin/kost-delete-requests/${requestId}/reject`, { rejection_reason: reason });
      modalAlert('Permintaan penghapusan ditolak.', 'success');
      fetchDeleteRequests();
    } catch (err) {
      modalAlert(err.response?.data?.message || 'Gagal menolak penghapusan.', 'error');
    }
  };

  const submitDeleteRequest = async () => {
    if (!deleteReason || deleteReason.length < 10) {
      modalAlert('Alasan penghapusan minimal 10 karakter.', 'error');
      return;
    }

    setIsSubmittingDelete(true);
    try {
      await api.post(`/kost/${deleteTarget.id}/request-delete`, {
        reason: deleteReason
      });
      setShowDeleteModal(false);
      fetchKosts();
      modalAlert('Permintaan penghapusan kost telah dikirim ke admin untuk persetujuan.', 'success');
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengirim permintaan penghapusan.';
      modalAlert(message, 'error');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const statusFilter = kosts.filter(k => filterStatus === 'all' || k.status === filterStatus);
  const filteredKosts = statusFilter.filter(k =>
    k.nama_kost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.kota?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig = {
    aktif: { label: 'Aktif', icon: <CheckCircle size={12} />, cls: 'pill-aktif' },
    pending: { label: 'Pending', icon: <Clock size={12} />, cls: 'pill-pending' },
    nonaktif: { label: 'Nonaktif', icon: <XCircle size={12} />, cls: 'pill-nonaktif' },
  };

  const tipeConfig = {
    putra: { label: 'Putra', cls: 'tipe-putra' },
    putri: { label: 'Putri', cls: 'tipe-putri' },
    campur: { label: 'Campur', cls: 'tipe-campur' },
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>
            {isOwner ? 'Kost Saya' : 'Properti Kost'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
            {isOwner ? 'Kelola daftar properti kost yang Anda miliki.' : 'Kelola dan moderasi properti yang didaftarkan oleh Pemilik Kost.'}
          </p>
        </div>
        {isOwner && (
          <button 
            onClick={() => handleOpenModal()}
            style={{ 
              background: '#22c55e', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 14, 
              fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(34, 197, 94, 0.4)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} strokeWidth={3} /> Tambah Properti
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 32 }}>
        {[
          { label: 'Total Properti', value: kosts.length, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Kost Aktif', value: kosts.filter(k => k.status === 'aktif').length, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Pending Review', value: kosts.filter(k => k.status === 'pending').length, color: '#f59e0b', bg: '#fffbeb' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 24, padding: '24px 28px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{card.label}</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '4px 0 0', letterSpacing: '-0.5px' }}>{card.value}</p>
            </div>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, boxShadow: `0 8px 16px ${card.color}15` }}>
              <Home size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar - Only for Admin */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#f1f5f9', padding: 6, borderRadius: 16 }}>
          <button
            onClick={() => setActiveTab('kost')}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: 'none',
              background: activeTab === 'kost' ? 'white' : 'transparent',
              color: activeTab === 'kost' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'kost' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Home size={18} />
              Daftar Kost ({kosts.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('delete-requests')}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: 'none',
              background: activeTab === 'delete-requests' ? 'white' : 'transparent',
              color: activeTab === 'delete-requests' ? '#dc2626' : '#64748b',
              boxShadow: activeTab === 'delete-requests' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Trash2 size={18} />
              Permintaan Hapus
              {deleteRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{ background: '#dc2626', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 800 }}>
                  {deleteRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </span>
          </button>
        </div>
      )}

      {/* Table Card */}
      <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#fcfcfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 18px', flex: 1, maxWidth: 400, transition: 'all 0.2s' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari nama kost atau lokasi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent', width: '100%', fontWeight: 500 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 14 }}>
            {['all', 'aktif', 'pending', 'nonaktif'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '8px 16px', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  border: 'none',
                  background: filterStatus === s ? 'white' : 'transparent',
                  color: filterStatus === s ? '#0f172a' : '#64748b',
                  boxShadow: filterStatus === s ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {activeTab === 'delete-requests' && isAdmin ? (
          /* Delete Requests Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Kost', 'Pemilik', 'Alasan Penghapusan', 'Tanggal Request', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '16px 32px', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deleteRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>
                      Tidak ada permintaan penghapusan kost.
                    </td>
                  </tr>
                ) : deleteRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0, fontWeight: 800 }}>
                          <Trash2 size={18} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: 14 }}>{req.kost?.nama_kost || 'Kost tidak ditemukan'}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 700 }}>ID: {req.kost_id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 10, fontWeight: 800 }}>
                          {(req.requester?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <p style={{ fontWeight: 700, color: '#334155', margin: 0, fontSize: 13 }}>{req.requester?.name || 'Unknown'}</p>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px', maxWidth: 300 }}>
                      <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>{req.reason}</p>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      {(() => {
                        const statusConfig = {
                          pending: { bg: '#fffbeb', color: '#d97706', border: '#fef3c7', label: 'Menunggu' },
                          approved: { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce7', label: 'Disetujui' },
                          rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2', label: 'Ditolak' }
                        };
                        const cfg = statusConfig[req.status] || statusConfig.pending;
                        return (
                          <span style={{
                            padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                            background: cfg.bg,
                            color: cfg.color,
                            border: '1px solid ' + cfg.border
                          }}>
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleApproveDelete(req.id)}
                            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleRejectDelete(req.id)}
                            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Kost Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Properti', 'Pemilik', 'Lokasi', 'Tipe', 'Kamar', 'Harga / Bulan', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '16px 32px', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Memuat data properti...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredKosts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>
                    Tidak ada properti ditemukan.
                  </td>
                </tr>
              ) : filteredKosts.map(k => {
                const sc = statusConfig[k.status] || statusConfig.pending;
                const tc = tipeConfig[k.tipe] || tipeConfig.campur;
                return (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0, fontWeight: 800 }}>
                          <Home size={18} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: 14, letterSpacing: '-0.2px' }}>{k.nama_kost}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 700 }}>#{k.id} • Registered</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                         <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 10, fontWeight: 800 }}>
                            {(k.user?.name || 'U').charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p style={{ fontWeight: 700, color: '#334155', margin: 0, fontSize: 13 }}>{k.user?.name || 'Unknown'}</p>
                            <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 600 }}>Owner ID #{k.user?.id || '?'}</p>
                         </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                        <MapPin size={14} color="#94a3b8" />
                        <span>{k.kota}{k.provinsi ? `, ${k.provinsi}` : ''}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <span className={tc.cls} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {tc.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                          <Home size={14} />
                          <span>{k.jumlah_kamar || 0} Total</span>
                        </div>
                        {k.jumlah_kamar > 0 && (
                           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>Terisi:</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: (k.kamar_terisi || 0) >= k.jumlah_kamar ? '#dc2626' : '#059669' }}>
                                 {k.kamar_terisi || 0}/{k.jumlah_kamar}
                              </span>
                           </div>
                        )}
                        {k.jumlah_kamar > 0 && (
                           <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
                              <div 
                                 style={{ 
                                   height: '100%', 
                                   background: (k.kamar_terisi || 0) >= k.jumlah_kamar ? '#dc2626' : '#10b981',
                                   width: `${Math.min((k.kamar_terisi || 0) / k.jumlah_kamar * 100, 100)}%`,
                                   transition: 'width 0.3s ease'
                                 }}
                              ></div>
                           </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px', fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                      Rp {parseInt(k.harga_min || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <span className={sc.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {sc.icon} {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleOpenModal(k)}
                          title="Edit Properti"
                          style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                          onMouseEnter={e => e.currentTarget.style.background='#e2e8f0'}
                          onMouseLeave={e => e.currentTarget.style.background='#f1f5f9'}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id, k.nama_kost)}
                          title="Hapus Properti"
                          style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                          onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background='#fef2f2'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: isAdmin ? 500 : 760, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)', animation: 'fadeUp 0.3s ease-out', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '32px 40px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>
                  {isAdmin ? 'Moderasi Properti' : (currentKost ? 'Perbarui Properti' : 'Tambah Properti Baru')}
                </h2>
                {currentKost && <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0', fontWeight: 600 }}>ID: #{currentKost.id} • {currentKost.nama_kost}</p>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #e2e8f0', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}>
                <XCircle size={22} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleSubmit} id="kost-form">
                {isAdmin ? (
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Tentukan Status Approval</label>
                    <div style={{ display: 'grid', gap: 12 }}>
                       {['aktif', 'pending', 'nonaktif'].map(s => (
                         <div key={s} 
                            onClick={() => setFormData({ ...formData, status: s })}
                            style={{ 
                              padding: '16px 20px', borderRadius: 16, border: `2px solid ${formData.status === s ? (s === 'aktif' ? '#22c55e' : (s === 'pending' ? '#f59e0b' : '#ef4444')) : '#f1f5f9'}`,
                              background: formData.status === s ? (s === 'aktif' ? '#f0fdf4' : (s === 'pending' ? '#fffbeb' : '#fef2f2')) : 'white',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                               <div style={{ width: 12, height: 12, borderRadius: '50%', background: s === 'aktif' ? '#22c55e' : (s === 'pending' ? '#f59e0b' : '#ef4444') }} />
                               <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 15, textTransform: 'capitalize' }}>{s}</span>
                            </div>
                            {formData.status === s && <CheckCircle size={20} color={s === 'aktif' ? '#22c55e' : (s === 'pending' ? '#f59e0b' : '#ef4444')} />}
                         </div>
                       ))}
                    </div>
                    <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                       <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informasi Pendaftar</p>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', border: '1px solid #e2e8f0', fontWeight: 800 }}>
                             {(currentKost?.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{currentKost?.user?.name || 'N/A'}</p>
                             <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 500 }}>{currentKost?.user?.email || 'No email provided'}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                    {/* Nama Properti */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Nama Properti</label>
                      <input type="text" placeholder="Contoh: Kost Hijau Sejahtera"
                        value={formData.nama_kost}
                        onChange={e => setFormData({...formData, nama_kost: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Tipe Hunian */}
                    <div>
                      <label style={labelStyle}>Tipe Hunian</label>
                      <select value={formData.tipe}
                        onChange={e => setFormData({...formData, tipe: e.target.value})}
                        style={inputStyle}>
                        <option value="putra">Putra</option>
                        <option value="putri">Putri</option>
                        <option value="campur">Campur</option>
                      </select>
                    </div>

                    {/* Harga */}
                    <div>
                      <label style={labelStyle}>Harga Sewa / Bulan (Rp)</label>
                      <input type="number" placeholder="500000"
                        value={formData.harga_min}
                        onChange={e => setFormData({...formData, harga_min: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Jumlah Kamar */}
                    <div>
                      <label style={labelStyle}>Jumlah Kamar</label>
                      <input type="number" placeholder="5"
                        value={formData.jumlah_kamar || ''}
                        onChange={e => {
                          const jumlah = parseInt(e.target.value) || 0;
                          setFormData(prev => {
                            // Generate default kode kamar if not exists
                            const currentList = prev.kode_kamar_list || [];
                            const newList = [];
                            for (let i = 0; i < jumlah; i++) {
                              newList.push(currentList[i] || `K${String(i + 1).padStart(3, '0')}`);
                            }
                            return { ...prev, jumlah_kamar: jumlah, kode_kamar_list: newList };
                          });
                        }}
                        required min="1"
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0', fontWeight: 600 }}>
                        Total kamar yang tersedia di properti ini
                      </p>
                    </div>

                    {/* Kode Kamar */}
                    {formData.jumlah_kamar > 0 && (
                      <div style={{ gridColumn: 'span 2', background: '#f0fdf4', padding: 20, borderRadius: 16, border: '1px solid #bbf7d0', marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Home size={18} color="#16a34a" />
                          <label style={{ ...labelStyle, margin: 0 }}>Kode Kamar</label>
                        </div>
                        <p style={{ fontSize: 13, color: '#166534', margin: '0 0 16px', fontWeight: 500 }}>
                          Masukkan kode unik untuk setiap kamar (contoh: A01, B02, 101, 102, K001)
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                          {formData.kode_kamar_list?.map((kode, index) => (
                            <div key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 8, 
                              background: 'white', 
                              padding: '12px 14px', 
                              borderRadius: 12, 
                              border: '2px solid #22c55e',
                              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)'
                            }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', minWidth: 20 }}>
                                #{index + 1}
                              </span>
                              <input
                                type="text"
                                placeholder={`K${String(index + 1).padStart(3, '0')}`}
                                value={kode}
                                onChange={e => {
                                  const newList = [...formData.kode_kamar_list];
                                  newList[index] = e.target.value.toUpperCase();
                                  setFormData({ ...formData, kode_kamar_list: newList });
                                }}
                                style={{ 
                                  width: '100%', 
                                  border: 'none', 
                                  background: 'transparent', 
                                  fontSize: 14, 
                                  fontWeight: 800, 
                                  color: '#0f172a', 
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alamat */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Alamat Lengkap</label>
                      <textarea placeholder="Jalan Raya No. 123..."
                        value={formData.alamat}
                        onChange={e => setFormData({...formData, alamat: e.target.value})}
                        required
                        style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Kota */}
                    <div>
                      <label style={labelStyle}>Kota</label>
                      <input type="text" placeholder="contoh: Bogor"
                        value={formData.kota}
                        onChange={e => setFormData({...formData, kota: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Provinsi */}
                    <div>
                      <label style={labelStyle}>Provinsi</label>
                      <input type="text" placeholder="contoh: Jawa Barat"
                        value={formData.provinsi}
                        onChange={e => setFormData({...formData, provinsi: e.target.value})}
                        required style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#22c55e'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>

                    {/* Galeri Foto */}
                    <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'block' }}>Galeri Foto Properti</label>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Upload hingga 50 foto. Pilih salah satu untuk dijadikan Thumbnail utama.</p>
                        </div>
                        <label style={{ background: 'white', color: '#10b981', border: '1px solid #a7f3d0', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)', opacity: uploadingImage ? 0.6 : 1 }}>
                          {uploadingImage ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={16} strokeWidth={3} />}
                          {uploadingImage ? 'Mengupload...' : 'Tambah Foto'}
                          <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                        </label>
                      </div>

                      {photos.length > 0 ? (
                         <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                             {photos.map((src, idx) => (
                                <div key={idx} style={{ position: 'relative', width: 120, height: 120, borderRadius: 14, overflow: 'hidden', border: thumbnailIndex === idx ? '3px solid #10b981' : '1px solid #e2e8f0', cursor: 'pointer', background: '#e2e8f0' }} onClick={() => setThumbnailIndex(idx)}>
                                   <img src={src} alt={`Kost photo ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                   
                                   {/* Badge Thumbnail */}
                                   {thumbnailIndex === idx && (
                                     <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(16, 185, 129, 0.9)', padding: '4px 0', textAlign: 'center', color: 'white', fontSize: 10, fontWeight: 800, backdropFilter: 'blur(2px)' }}>
                                        <Star size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} fill="white" />
                                        THUMBNAIL
                                     </div>
                                   )}

                                   {/* Delete Button */}
                                   <button type="button" onClick={(e) => { e.stopPropagation(); handleRemovePhoto(idx); }} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                      <X size={14} />
                                   </button>
                                </div>
                             ))}
                         </div>
                      ) : (
                         <div style={{ textAlign: 'center', padding: '32px 0', border: '2px dashed #cbd5e1', borderRadius: 14, background: 'white' }}>
                            <ImageIcon size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
                            <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>Belum ada foto. Upload sekarang!</p>
                         </div>
                      )}
                    </div>

                    {/* Container Koordinat */}
                    <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                          <label style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'block' }}>Pemetaan Otomatis Koordinat</label>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Tekan tombol di samping setelah mengisi Alamat, Kota, dan Provinsi.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            type="button" 
                            onClick={async () => {
                              if (!formData.alamat && !formData.kota) {
                                return modalAlert('Silakan isi Alamat atau minimal Kota terlebih dahulu!', 'warning');
                              }
                              
                              setIsSubmitting(true);
                              try {
                                // Fungsi membersihkan alamat dari RT/RW & singkatan yang membingungkan GPS
                                const cleanAddr = (str) => {
                                  return str
                                    .replace(/RT[-./\s]?\d+/gi, '')
                                    .replace(/RW[-./\s]?\d+/gi, '')
                                    .replace(/RT\.?\d+/gi, '')
                                    .replace(/RW\.?\d+/gi, '')
                                    .replace(/Kec\.?\s?\w+/gi, '')
                                    .replace(/Kel\.?\s?\w+/gi, '')
                                    .replace(/No\.\s?\d+/gi, '')
                                    .replace(/\b\d{5}\b/g, '') // hapus kodepos
                                    .replace(/,/g, ' ')
                                    .replace(/\s{2,}/g, ' ')
                                    .trim();
                                };

                                const alamatBersih = cleanAddr(formData.alamat);
                                const kota = formData.kota;
                                
                                const trySearch = async (queryStr, engine = 'nominatim') => {
                                   try {
                                       // Deteksi jika input adalah Koordinat Langsung (-6.xxx, 106.xxx)
                                       const coordRegex = /^([-+]?\d{1,2}(?:\.\d+)?),\s*([-+]?\d{1,3}(?:\.\d+)?)$/;
                                       const match = queryStr.match(coordRegex);
                                       if (match) {
                                          return { lat: match[1], lon: match[2], name: 'Koordinat Langsung' };
                                       }

                                       const url = engine === 'nominatim' 
                                          ? `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`
                                          : `https://photon.komoot.io/api/?q=${encodeURIComponent(queryStr)}&limit=1&lang=id`;
                                       
                                       const resp = await fetch(url, { timeout: 6000 });
                                       if (!resp.ok) return null;
                                       const data = await resp.json();
                                       
                                       if (engine === 'nominatim') {
                                          return (data && data.length > 0) ? { lat: data[0].lat, lon: data[0].lon, name: data[0].display_name } : null;
                                       } else {
                                          return (data && data.features && data.features.length > 0) 
                                             ? { 
                                                 lat: data.features[0].geometry.coordinates[1], 
                                                 lon: data.features[0].geometry.coordinates[0], 
                                                 name: data.features[0].properties.label || data.features[0].properties.name || data.features[0].properties.street || data.features[0].properties.city 
                                               } 
                                             : null;
                                       }
                                   } catch (err) { return null; }
                                };

                                // Langkah 1: Koordinat Langsung (Jika user paste koordinat dari GMaps)
                                const inputAlamat = formData.alamat.trim();
                                const coordMatch = inputAlamat.match(/^([-+]?\d{1,2}(?:\.\d+)?),\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
                                if (coordMatch) {
                                   setFormData(prev => ({ ...prev, latitude: parseFloat(coordMatch[1]), longitude: parseFloat(coordMatch[2]) }));
                                   modalAlert('🎯 Koordinat Langsung Berhasil Dideteksi!', 'success');
                                   return;
                                }

                                // Langkah 2: FULL ADDRESS via Photon (Lebih Cerdas cari Toko/POI Gmaps)
                                let result = await trySearch(`${formData.alamat}, ${formData.kota}`, 'photon');
                                if (result) {
                                   setFormData(prev => ({ ...prev, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }));
                                   modalAlert(`🎯 Lokasi Ditemukan!\n\n${result.name}`, 'success');
                                   return;
                                }

                                await new Promise(r => setTimeout(r, 600));

                                // Langkah 3: Smart Clean
                                const smartClean = formData.alamat
                                    .replace(/RT[-./\s]?\d+/gi, '')
                                    .replace(/RW[-./\s]?\d+/gi, '')
                                    .replace(/Kec\.?\s?\w+/gi, '')
                                    .replace(/Kel\.?\s?\w+/gi, '')
                                    .trim();
                                
                                result = await trySearch(`${smartClean}, ${formData.kota}`, 'nominatim');
                                if (result) {
                                   setFormData(prev => ({ ...prev, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }));
                                   modalAlert(`✅ Alamat Berhasil Ditemukan!\n\n${result.name}`, 'success');
                                   return;
                                }

                                // Langkah 4: Hanya Nama Jalan Utama
                                const streetOnly = smartClean.split('No')[0].split(',')[0].trim();
                                result = await trySearch(`${streetOnly} ${formData.kota}`, 'photon');
                                if (result) {
                                  setFormData(prev => ({ ...prev, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }));
                                  modalAlert(`⚠️ Nama Jalan Ditemukan.\nArea: ${streetOnly}, ${formData.kota}`, 'warning');
                                  return;
                                }

                                // Final Fallback
                                result = await trySearch(`${formData.kota}, Indonesia`, 'nominatim');
                                if (result) {
                                  setFormData(prev => ({ ...prev, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }));
                                  modalAlert('⚠️ Lokasi detail tidak terdeteksi. Silakan tandai manual di peta.', 'warning');
                                } else {
                                  modalAlert('❌ Lokasi tidak terdaftar di satelit.', 'error');
                                }
                              } catch (e) {
                                modalAlert('❌ Gangguan koneksi peta.', 'error');
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            style={{ background: 'white', color: '#2563eb', border: '1px solid #bfdbfe', padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)' }}
                          >
                            <Search size={18} strokeWidth={3} /> Deteksi Lokasi Otomatis (Koordinat)
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Titik Koordinat - Latitude */}
                        <div>
                          <label style={labelStyle}>Latitude (Titik Y)</label>
                          <input type="number" step="any" placeholder="contoh: -6.563749"
                            value={formData.latitude}
                            onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || ''})}
                            required style={{...inputStyle, background: 'white'}}
                            onFocus={e => e.target.style.borderColor = '#22c55e'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>

                        {/* Titik Koordinat - Longitude */}
                        <div>
                          <label style={labelStyle}>Longitude (Titik X)</label>
                          <input type="number" step="any" placeholder="contoh: 106.781062"
                            value={formData.longitude}
                            onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || ''})}
                            required style={{...inputStyle, background: 'white'}}
                            onFocus={e => e.target.style.borderColor = '#22c55e'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>
                      </div>

                      {/* Interactive Mini Map */}
                      <div style={{ marginTop: 20, width: '100%', height: 280, borderRadius: 18, overflow: 'hidden', border: '2px solid #e2e8f0', position: 'relative' }}>
                        <MapContainer 
                          center={[formData.latitude || -6.1751, formData.longitude || 106.8650]} 
                          zoom={16} 
                          scrollWheelZoom={true} 
                          style={{ height: '100%', width: '100%', zIndex: 0 }}
                        >
                          <TileLayer 
                            attribution='&copy; Google Maps'
                            url={formData.use_satellite 
                                ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
                                : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"} 
                          />
                          <FormMapUpdater lat={formData.latitude} lng={formData.longitude} />
                          <MapClickSetter setFormData={setFormData} />
                          
                          {(formData.latitude && formData.longitude) && (
                            <Marker position={[formData.latitude, formData.longitude]} />
                          )}
                        </MapContainer>
                        
                        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
                           <button 
                             type="button"
                             onClick={() => setFormData(p => ({ ...p, use_satellite: !p.use_satellite }))}
                             style={{ background: 'white', border: 'none', padding: '8px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800, color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                           >
                             <MapPin size={14} /> {formData.use_satellite ? 'Mode Standar' : 'Mode Satelit'}
                           </button>
                        </div>

                        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 400, background: 'rgba(255,255,255,0.92)', padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#0f172a', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', maxWidth: '80%' }}>
                          💡 <b>Tips:</b> Data RT/RW tidak tersedia di peta digital publik. Gunakan <b>Mode Satelit</b> di atas untuk menarik Pin tepat ke atap rumah Anda.
                        </div>
                      </div>

                    </div>

                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '24px 40px', background: '#fcfcfd', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '13px 28px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}>Batal</button>
              <button type="submit" form="kost-form" disabled={isSubmitting} style={{ padding: '13px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 20px -5px rgba(34,197,94,0.4)', minWidth: 160, opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Memproses...' : (currentKost ? 'Simpan Perubahan' : 'Daftarkan Properti')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reason Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', padding: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.18)', animation: 'fadeUp 0.25s ease', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1e293b' }}>Permintaan Hapus Kost</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{deleteTarget.nama}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px' }}>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                Penghapusan kost memerlukan persetujuan admin. Silakan berikan alasan mengapa kost ini ingin dihapus.
              </p>

              <div style={{ marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>Alasan Penghapusan *</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Contoh: Kost sudah tidak dioperasikan lagi, ingin mengganti lokasi, dll."
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                  maxLength={500}
                />
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>
                  {deleteReason.length}/500 karakter (min. 10)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '20px 28px', background: '#fcfcfd', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#475569' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitDeleteRequest}
                disabled={isSubmittingDelete || deleteReason.length < 10}
                style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: (isSubmittingDelete || deleteReason.length < 10) ? 0.6 : 1 }}
              >
                {isSubmittingDelete ? 'Mengirim...' : 'Kirim Permintaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tipe-putra { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
        .tipe-putri { background: #fdf2f8; color: #db2777; border: 1px solid #fce7f3; }
        .tipe-campur { background: #f5f3ff; color: #7c3aed; border: 1px solid #ede9fe; }
        .pill-aktif { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        .pill-pending { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }

        .pill-nonaktif { background: #f8fafc; color: #64748b; border: 1px solid #f1f5f9; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};


export default AdminKost;
