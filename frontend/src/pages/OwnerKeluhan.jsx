import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { 
  MessageSquare, 
  Calendar, 
  User, 
  Home, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Loader2,
  Search,
  Filter,
  Send,
  X
} from 'lucide-react';
import { useGlobalModal } from '../context/ModalContext';

const OwnerKeluhan = () => {
  const { user } = useAuth();
  const { alert: modalAlert } = useGlobalModal();
  const [keluhanList, setKeluhanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeluhan, setSelectedKeluhan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responModalOpen, setResponModalOpen] = useState(false);
  const [responText, setResponText] = useState('');
  const [responStatus, setResponStatus] = useState('diproses');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchKeluhan();
  }, []);

  const fetchKeluhan = async () => {
    try {
      setLoading(true);
      const response = await api.get('/keluhan');
      setKeluhanList(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching keluhan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespon = async (e) => {
    e.preventDefault();
    if (!responText.trim()) {
      modalAlert('Respon tidak boleh kosong', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/keluhan/${selectedKeluhan.id}/respon`, {
        respon: responText,
        status: responStatus
      });

      modalAlert('Respon berhasil dikirim!', 'success');
      setResponModalOpen(false);
      setResponText('');
      setResponStatus('diproses');
      fetchKeluhan();
    } catch (error) {
      console.error('Error sending respon:', error);
      modalAlert(error.response?.data?.message || 'Gagal mengirim respon', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openResponModal = (keluhan) => {
    setSelectedKeluhan(keluhan);
    setResponText(keluhan.respon || '');
    setResponStatus(keluhan.status === 'open' ? 'diproses' : keluhan.status);
    setResponModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: { bg: '#fef3c7', color: '#d97706', icon: AlertCircle, text: 'Open' },
      diproses: { bg: '#dbeafe', color: '#2563eb', icon: Clock, text: 'Diproses' },
      selesai: { bg: '#d1fae5', color: '#059669', icon: CheckCircle, text: 'Selesai' },
    };
    const style = styles[status] || styles.open;
    const Icon = style.icon;
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 6, 
        background: style.bg, 
        color: style.color, 
        padding: '6px 12px', 
        borderRadius: 20, 
        fontSize: 12, 
        fontWeight: 700 
      }}>
        <Icon size={14} />
        {style.text}
      </span>
    );
  };

  const filteredKeluhan = keluhanList.filter(k => {
    const matchesSearch = 
      k.judul?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.kost?.nama_kost?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="#10b981" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #059669, #10b981)', 
        borderRadius: 24, 
        padding: '32px 40px', 
        marginBottom: 32, 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>Kelola Keluhan</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>
            Kelola dan tanggapi keluhan dari penyewa kost Anda. Berikan respon yang cepat untuk meningkatkan kepuasan penyewa.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Keluhan', value: keluhanList.length, color: '#10b981' },
          { label: 'Perlu Respon', value: keluhanList.filter(k => k.status === 'open').length, color: '#ef4444' },
          { label: 'Diproses', value: keluhanList.filter(k => k.status === 'diproses').length, color: '#3b82f6' },
          { label: 'Selesai', value: keluhanList.filter(k => k.status === 'selesai').length, color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 32, fontWeight: 800, margin: '0 0 4px', color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        background: 'white',
        padding: 20,
        borderRadius: 16,
        border: '1px solid #f1f5f9'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari keluhan berdasarkan judul, nama, atau kost..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={18} color="#64748b" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              outline: 'none',
              background: 'white',
            }}
          >
            <option value="all">Semua Status</option>
            <option value="open">Open</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Keluhan List */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid #f8fafc' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>
            Daftar Keluhan ({filteredKeluhan.length})
          </h3>
        </div>
        
        {filteredKeluhan.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>Tidak ada keluhan yang sesuai filter.</p>
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredKeluhan.map((k) => (
              <div 
                key={k.id} 
                style={{ 
                  padding: '24px 30px', 
                  borderBottom: '1px solid #f8fafc',
                  background: 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 12, 
                      background: k.respon ? '#f0fdf4' : '#fef3c7', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <MessageSquare size={22} color={k.respon ? "#10b981" : "#d97706"} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                        {k.judul}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} />
                          {k.user?.name || 'Unknown'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Home size={12} />
                          {k.kost?.nama_kost || 'Unknown Kost'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {new Date(k.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getStatusBadge(k.status)}
                    <button
                      onClick={() => openResponModal(k)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#10b981',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Send size={14} />
                      {k.respon ? 'Edit Respon' : 'Beri Respon'}
                    </button>
                  </div>
                </div>

                <div style={{ 
                  marginTop: 16, 
                  padding: 16, 
                  background: '#f8fafc', 
                  borderRadius: 12,
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 6px', textTransform: 'uppercase' }}>
                      Kategori
                    </p>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '3px 10px', 
                      background: '#e0e7ff', 
                      color: '#4f46e5', 
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      {k.kategori}
                    </span>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 6px', textTransform: 'uppercase' }}>
                      Isi Keluhan
                    </p>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                      {k.isi || k.deskripsi}
                    </p>
                  </div>
                </div>

                {k.respon && (
                  <div style={{ 
                    marginTop: 12,
                    padding: 16, 
                    background: '#ecfdf5', 
                    borderRadius: 12,
                    borderLeft: '4px solid #10b981'
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#059669', margin: '0 0 8px', textTransform: 'uppercase' }}>
                      Respon Anda
                    </p>
                    <p style={{ fontSize: 14, color: '#065f46', lineHeight: 1.6, margin: 0 }}>
                      {k.respon}
                    </p>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '8px 0 0' }}>
                      Dibalas pada: {new Date(k.responded_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Respon Modal */}
      {responModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 24,
            width: '100%',
            maxWidth: 600,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              padding: '1.5rem 2rem',
              color: 'white',
              position: 'relative'
            }}>
              <button 
                onClick={() => setResponModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                {selectedKeluhan?.respon ? 'Edit Respon' : 'Beri Respon'}
              </h2>
              <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>
                Keluhan: {selectedKeluhan?.judul}
              </p>
            </div>

            <form onSubmit={handleRespon} style={{ padding: '2rem' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Status Keluhan
                </label>
                <select
                  value={responStatus}
                  onChange={(e) => setResponStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  <option value="diproses">Diproses</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Respon Anda *
                </label>
                <textarea
                  value={responText}
                  onChange={(e) => setResponText(e.target.value)}
                  placeholder="Tulis respon untuk keluhan ini..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setResponModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#10b981',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {submitting ? 'Mengirim...' : 'Kirim Respon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerKeluhan;
