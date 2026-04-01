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
  Filter
} from 'lucide-react';

const AdminKeluhan = () => {
  const { user } = useAuth();
  const [keluhanList, setKeluhanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeluhan, setSelectedKeluhan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
            Pantau dan monitoring keluhan dari penyewa kost. Admin dapat melihat detail keluhan untuk koordinasi dengan pemilik kost.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Keluhan', value: keluhanList.length, color: '#10b981' },
          { label: 'Open', value: keluhanList.filter(k => k.status === 'open').length, color: '#f59e0b' },
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
                  cursor: 'pointer',
                  background: selectedKeluhan?.id === k.id ? '#f0fdf4' : 'white',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelectedKeluhan(selectedKeluhan?.id === k.id ? null : k)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: 12, 
                      background: '#f0fdf4', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <MessageSquare size={22} color="#10b981" />
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
                  {getStatusBadge(k.status)}
                </div>

                {selectedKeluhan?.id === k.id && (
                  <div style={{ 
                    marginTop: 20, 
                    padding: 20, 
                    background: '#f8fafc', 
                    borderRadius: 12,
                    borderLeft: '4px solid #10b981'
                  }}>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase' }}>
                        Kategori
                      </p>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 12px', 
                        background: '#e0e7ff', 
                        color: '#4f46e5', 
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        {k.kategori}
                      </span>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase' }}>
                        Isi Keluhan
                      </p>
                      <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                        {k.isi || k.deskripsi}
                      </p>
                    </div>

                    {k.respon && (
                      <div style={{ 
                        padding: 16, 
                        background: '#ecfdf5', 
                        borderRadius: 12,
                        borderLeft: '4px solid #10b981'
                      }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', margin: '0 0 8px', textTransform: 'uppercase' }}>
                          Respon Pemilik Kost
                        </p>
                        <p style={{ fontSize: 14, color: '#065f46', lineHeight: 1.6, margin: 0 }}>
                          {k.respon}
                        </p>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: '8px 0 0' }}>
                          Dibalas pada: {new Date(k.responded_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    )}

                    {!k.respon && (
                      <div style={{ 
                        padding: 12, 
                        background: '#fef3c7', 
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <AlertCircle size={16} color="#d97706" />
                        <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                          Belum ada respon dari pemilik kost.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKeluhan;
