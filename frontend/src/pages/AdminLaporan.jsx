import React, { useState, useEffect } from 'react';
import { BarChart3, Loader2, TrendingUp, Users, Home, Percent, Download } from 'lucide-react';
import api from '../utils/api';

const AdminLaporan = () => {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLaporan(); }, []);

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tracking/laporan');
      setLaporan(res.data.data || []);
    } catch (e) {
      console.error('Gagal ambil laporan:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalKaryawan = laporan.reduce((s, l) => s + (l.total_karyawan || 0), 0);
  const totalHunian = laporan.reduce((s, l) => s + (l.punya_hunian || 0), 0);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Laporan Hunian</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0', fontWeight: 500 }}>
            Ringkasan persentase hunian karyawan berdasarkan data sistem.
          </p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <Download size={15} /> Unduh Laporan
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Karyawan', value: totalKaryawan, icon: Users, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Punya Hunian', value: totalHunian, icon: Home, color: '#10b981', bg: '#ecfdf5' },
          {
            label: 'Rata Hunian', 
            value: totalKaryawan > 0 ? `${Math.round(totalHunian / totalKaryawan * 100)}%` : '0%',
            icon: Percent, color: '#3b82f6', bg: '#eff6ff'
          },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{c.value}</p>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail per Kantor */}
      {loading ? (
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #f1f5f9', padding: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#94a3b8' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Memuat laporan...</span>
        </div>
      ) : laporan.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #f1f5f9', padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          Belum ada data laporan.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px,1fr))', gap: 20 }}>
          {laporan.map((l, idx) => {
            const pct = l.total_karyawan > 0 ? (l.punya_hunian / l.total_karyawan) * 100 : 0;
            const pctText = l.persentase_hunian || `${Math.round(pct)}%`;
            return (
              <div key={idx} style={{ background: 'white', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>{l.kantor?.nama_kantor || 'Kantor'}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      📍 {l.kantor?.kota || '-'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444', margin: 0 }}>
                      {pctText}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600 }}>Punya hunian</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width 0.8s ease',
                    width: `${Math.min(pct, 100)}%`,
                    background: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total', value: l.total_karyawan, color: '#6366f1' },
                    { label: 'Ada Hunian', value: l.punya_hunian, color: '#10b981' },
                    { label: 'Belum', value: l.belum_ada_hunian, color: '#ef4444' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', margin: '2px 0 0', textTransform: 'uppercase' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminLaporan;
