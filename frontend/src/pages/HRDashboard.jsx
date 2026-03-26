import React, { useState, useEffect } from 'react';
import {
  Users, MapPin, CheckCircle, Clock, Home, BarChart3,
  Loader2, TrendingUp, Shield, AlertTriangle, Navigation,
  Building2, ChevronRight, Eye, Filter, RefreshCw,
  Activity, Target, Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

/* ─── helpers ─── */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Selamat Pagi' : h < 17 ? 'Selamat Siang' : 'Selamat Malam';
};

const pill = (text, bg, color, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '0.3px',
  background: bg, color, border: `1px solid ${border}`,
});

/* ─── Radius Badge ─── */
const RadiusBadge = ({ km }) => {
  if (km === null || km === undefined)
    return <span style={pill('—', '#f8fafc', '#94a3b8', '#f1f5f9')}>Belum ada data</span>;
  if (km <= 5)
    return <span style={pill(`${km.toFixed(1)} km`, '#f0fdf4', '#16a34a', '#bbf7d0')}>✓ Dekat</span>;
  if (km <= 7)
    return <span style={pill(`${km.toFixed(1)} km`, '#fffbeb', '#d97706', '#fde68a')}>⚠ Sedang</span>;
  return <span style={pill(`${km.toFixed(1)} km`, '#fef2f2', '#dc2626', '#fecaca')}>✗ Jauh</span>;
};

/* ─── Main Component ─── */
const HRDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('dashboard');
  const [karyawanList, setKaryawanList] = useState([]);
  const [hunianList, setHunianList] = useState([]);
  const [kantor, setKantor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKary, setSearchKary] = useState('');
  const [filterRadius, setFilterRadius] = useState('all');

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [karyRes, trackRes, kantorRes] = await Promise.allSettled([
        api.get('/karyawan'),
        api.get('/tracking/hunian'),
        api.get('/kantor'),
      ]);

      const karyawan = karyRes.status === 'fulfilled' ? karyRes.value?.data?.data || [] : [];
      const hunianData = trackRes.status === 'fulfilled' ? trackRes.value?.data?.data || [] : [];
      const kantorList = kantorRes.status === 'fulfilled' ? kantorRes.value?.data?.data || [] : [];

      // Ambil kantor milik HR ini (user_id match atau pertama jika satu)
      const myKantor = kantorList.find(k => k.user_id === user?.id) || kantorList[0] || null;
      setKantor(myKantor);

      // Enrich hunian dengan jarak jika kantor koordinatnya ada
      const enriched = hunianData.map(h => {
        let jarak = h.jarak_ke_kantor ?? null;
        if (!jarak && myKantor?.latitude && h.kost?.latitude) {
          jarak = haversineKm(
            parseFloat(myKantor.latitude), parseFloat(myKantor.longitude),
            parseFloat(h.kost.latitude), parseFloat(h.kost.longitude)
          );
        }
        return { ...h, jarakKm: jarak };
      });

      setKaryawanList(karyawan);
      setHunianList(enriched);
    } catch (e) {
      console.error('HR fetchAll:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchAll();
    }
  }, [authLoading, user]);

  /* ─── Computed Stats ─── */
  const totalKaryawan = karyawanList.length;
  const hunianAktif = hunianList.filter(h => h.status === 'aktif').length;
  const verified = hunianList.filter(h => h.is_verified).length;
  const pending = hunianList.filter(h => !h.is_verified && h.status === 'aktif').length;
  const belumInput = totalKaryawan - hunianList.filter(h => h.status === 'aktif').length;

  const dekat = hunianList.filter(h => h.jarakKm !== null && h.jarakKm <= 5).length;
  const sedang = hunianList.filter(h => h.jarakKm !== null && h.jarakKm > 5 && h.jarakKm <= 7).length;
  const jauh = hunianList.filter(h => h.jarakKm !== null && h.jarakKm > 7).length;
  const totalWithRadius = dekat + sedang + jauh;
  const pctDekat = totalWithRadius > 0 ? Math.round((dekat / totalWithRadius) * 100) : 0;

  /* ─── Filter karyawan ─── */
  const filteredKary = karyawanList.filter(k => {
    const name = (k.user?.name || k.nama || '').toLowerCase();
    const match = name.includes(searchKary.toLowerCase());
    const hunianKary = hunianList.find(h => h.karyawan_id === k.id);
    if (filterRadius === 'dekat') return match && hunianKary?.jarakKm !== null && hunianKary?.jarakKm <= 5;
    if (filterRadius === 'jauh') return match && (!hunianKary?.jarakKm || hunianKary?.jarakKm > 7);
    if (filterRadius === 'belum') return match && !hunianKary;
    return match;
  });

  /* ─── Colors ─── */
  const G = '#22c55e';
  const GD = '#16a34a';

  const statCards = [
    { label: 'Total Karyawan', value: totalKaryawan, icon: Users, color: '#6366f1', bg: '#f5f3ff', shadow: '#6366f115' },
    { label: 'Hunian Aktif', value: hunianAktif, icon: Home, color: G, bg: '#f0fdf4', shadow: '#22c55e15' },
    { label: 'Terverifikasi', value: verified, icon: CheckCircle, color: GD, bg: '#dcfce7', shadow: '#16a34a15' },
    { label: 'Menunggu Verif', value: pending, icon: Clock, color: '#f59e0b', bg: '#fffbeb', shadow: '#f59e0b15' },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'radius', label: 'Radius Tracker', icon: Navigation },
    { id: 'karyawan', label: 'Data Karyawan', icon: Users },
    { id: 'hunian', label: 'Hunian', icon: Home },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease-in-out infinite', color: G }}>
          <Activity size={28} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#64748b' }}>Memuat data HR...</p>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
        borderRadius: 28, padding: '40px 48px', marginBottom: 32,
        border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 20px 40px -15px rgba(34,197,94,0.12)', overflow: 'hidden', position: 'relative'
      }}>
        <div style={{ position: 'absolute', right: 180, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,197,94,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: GD, fontSize: 12, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{greet()}, 👋</p>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-1px' }}>{user?.name}</h1>
          <p style={{ color: '#475569', fontSize: 14, margin: '0 0 20px', fontWeight: 500 }}>
            {kantor ? `Mengelola karyawan ${kantor.nama_kantor}` : 'HR Portal — Manajemen Hunian Karyawan'}
          </p>
          {kantor && (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '10px 16px', borderRadius: 14, border: '1px solid #dcfce7', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <Building2 size={16} color={G} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{kantor.nama_kantor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '10px 16px', borderRadius: 14, border: '1px solid #dcfce7', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <MapPin size={16} color={G} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{kantor.kota}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '10px 16px', borderRadius: 14, border: '1px solid #dcfce7', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <Target size={16} color={G} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{pctDekat}% karyawan dalam radius aman</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
          {[
            { v: totalKaryawan, l: 'Karyawan', c: G },
            { v: `${pctDekat}%`, l: 'Dekat Kantor', c: '#2563eb' },
            { v: verified, l: 'Terverifikasi', c: GD },
            { v: belumInput > 0 ? belumInput : 0, l: 'Belum Input', c: '#f59e0b' },
          ].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 16, padding: '14px 18px', textAlign: 'center', border: '1px solid #dcfce7', minWidth: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: s.c, margin: 0, letterSpacing: '-0.8px' }}>{s.v}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: '#f1f5f9', padding: 6, borderRadius: 18, width: 'fit-content' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 14, border: 'none',
              background: active ? 'white' : 'transparent',
              color: active ? '#0f172a' : '#64748b',
              fontWeight: active ? 800 : 600, fontSize: 13, cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: active ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            }}>
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              {t.label}
            </button>
          );
        })}
        <button onClick={() => fetchAll(true)} disabled={refreshing} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 14, border: 'none',
          background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s'
        }}>
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* ════════════════════════════════════ TAB: DASHBOARD ════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 28 }}>
            {statCards.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} style={{ background: 'white', borderRadius: 24, padding: '24px 28px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', cursor: 'default', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{c.label}</p>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, boxShadow: `0 8px 16px ${c.shadow}` }}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <p style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{c.value}</p>
                </div>
              );
            })}
          </div>

          {/* Main Content Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
            {/* Recent Tracking Table */}
            <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Update Lokasi Karyawan</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', fontWeight: 600 }}>5 data terbaru</p>
                </div>
                <button onClick={() => setTab('hunian')} style={{ fontSize: 13, fontWeight: 800, color: G, background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Lihat Semua <ChevronRight size={14} />
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Karyawan', 'Kost', 'Radius', 'Status Verif'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '13px 24px', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hunianList.slice(0, 5).length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Belum ada data tracking hunian.</td></tr>
                  ) : hunianList.slice(0, 5).map(h => {
                    const nama = h.karyawan?.user?.name || h.karyawan?.nama || '-';
                    return (
                      <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setTab('hunian')}
                      >
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: G, fontSize: 15, flexShrink: 0 }}>
                              {nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{nama}</p>
                              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{h.karyawan?.no_karyawan || h.karyawan?.jabatan || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{h.kost?.nama_kost || '-'}</td>
                        <td style={{ padding: '16px 24px' }}><RadiusBadge km={h.jarakKm} /></td>
                        <td style={{ padding: '16px 24px' }}>
                          {h.is_verified
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: GD, fontSize: 13, fontWeight: 800 }}><CheckCircle size={14} strokeWidth={3}/> Verified</span>
                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: 13, fontWeight: 800 }}><Clock size={14} strokeWidth={3}/> Pending</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Distribusi & Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Distribusi Hunian */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>Distribusi Hunian</h3>
                {[
                  { label: 'Terverifikasi', color: G, val: verified },
                  { label: 'Menunggu', color: '#f59e0b', val: pending },
                  { label: 'Belum Input', color: '#cbd5e1', val: Math.max(0, belumInput) },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{item.val}</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: item.color, borderRadius: 4, width: `${totalKaryawan > 0 ? Math.min(100, (item.val / totalKaryawan) * 100) : 0}%`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Links */}
              <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>Aksi Cepat</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Lihat Radius Tracker', icon: Navigation, color: '#2563eb', bg: '#eff6ff', action: () => setTab('radius') },
                    { label: 'Data Karyawan', icon: Users, color: G, bg: '#f0fdf4', action: () => setTab('karyawan') },
                    { label: 'Kelola Hunian', icon: Home, color: '#8b5cf6', bg: '#f5f3ff', action: () => setTab('hunian') },
                  ].map(q => {
                    const Icon = q.icon;
                    return (
                      <button key={q.label} onClick={q.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, border: '1px solid #f1f5f9', background: '#fafafa', cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left' }}
                        onMouseEnter={e => { e.currentTarget.style.background = q.bg; e.currentTarget.style.borderColor = q.color + '33'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: q.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: q.color, flexShrink: 0 }}>
                          <Icon size={17} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{q.label}</span>
                        <ChevronRight size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ TAB: RADIUS TRACKER ════════════════════════════════════ */}
      {tab === 'radius' && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>HR Radius Tracker</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '6px 0 0', fontWeight: 500 }}>
              Persentase karyawan yang tinggal dalam radius aman dari kantor {kantor?.nama_kantor || ''}.
            </p>
          </div>

          {/* Radius Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 32 }}>
            {[
              { label: 'Dekat Kantor', sub: '≤ 5 KM — Sangat Baik', value: dekat, pct: pctDekat, color: GD, bg: '#f0fdf4', border: '#bbf7d0', icon: Shield },
              { label: 'Jarak Sedang', sub: '5–7 KM — Cukup', value: sedang, pct: totalWithRadius > 0 ? Math.round((sedang / totalWithRadius) * 100) : 0, color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Activity },
              { label: 'Jauh Kantor', sub: '> 7 KM — Perlu Perhatian', value: jauh, pct: totalWithRadius > 0 ? Math.round((jauh / totalWithRadius) * 100) : 0, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle },
            ].map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} style={{ background: 'white', borderRadius: 28, padding: '32px', border: `2px solid ${card.border}`, boxShadow: `0 12px 30px ${card.color}10`, cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                      <Icon size={24} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 40, fontWeight: 900, color: card.color, margin: 0, letterSpacing: '-1.5px' }}>{card.pct}%</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>{card.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 16px' }}>{card.sub}</p>
                  <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', background: `linear-gradient(90deg, ${card.color}, ${card.color}99)`, borderRadius: 5, width: `${card.pct}%`, transition: 'width 1s ease' }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#475569', margin: 0 }}>{card.value} dari {totalWithRadius} karyawan</p>
                </div>
              );
            })}
          </div>

          {/* Daftar karyawan dengan radius */}
          <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 32px', background: '#fcfcfd', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', margin: 0, flex: 1 }}>Detail Radius per Karyawan</h3>
              <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 14 }}>
                {[['all', 'Semua'], ['dekat', '≤5KM'], ['jauh', '>7KM'], ['belum', 'Belum Input']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFilterRadius(val)} style={{
                    padding: '7px 14px', borderRadius: 11, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: filterRadius === val ? 'white' : 'transparent',
                    color: filterRadius === val ? '#0f172a' : '#64748b',
                    boxShadow: filterRadius === val ? '0 4px 8px rgba(0,0,0,0.05)' : 'none'
                  }}>{lbl}</button>
                ))}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Karyawan', 'Jabatan', 'Kost', 'Jarak ke Kantor', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 28px', color: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {karyawanList.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Tidak ada data karyawan.</td></tr>
                ) : karyawanList.map(k => {
                  const hunianKary = hunianList.find(h => h.karyawan_id === k.id || h.karyawan?.id === k.id);
                  const nama = k.user?.name || k.nama || '-';
                  return (
                    <tr key={k.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '18px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: G, fontSize: 15 }}>
                            {nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{nama}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{k.email || k.user?.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 28px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>{k.jabatan || '-'}</td>
                      <td style={{ padding: '18px 28px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{hunianKary?.kost?.nama_kost || '—'}</td>
                      <td style={{ padding: '18px 28px' }}><RadiusBadge km={hunianKary?.jarakKm} /></td>
                      <td style={{ padding: '18px 28px' }}>
                        {!hunianKary
                          ? <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Belum Input</span>
                          : hunianKary.is_verified
                            ? <span style={{ fontSize: 12, fontWeight: 800, color: GD, display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={13} strokeWidth={3} /> Verified</span>
                            : <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} strokeWidth={3} /> Pending</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ TAB: KARYAWAN ════════════════════════════════════ */}
      {tab === 'karyawan' && (
        <div>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Data Karyawan</h2>
              <p style={{ color: '#64748b', fontSize: 14, margin: '6px 0 0', fontWeight: 500 }}>
                Karyawan yang terdaftar di kantor Anda ({totalKaryawan} orang).
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 18px', minWidth: 300 }}>
              <Filter size={16} color="#94a3b8" />
              <input type="text" placeholder="Cari nama karyawan..."
                value={searchKary} onChange={e => setSearchKary(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent', width: '100%', fontWeight: 500 }}
              />
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Karyawan', 'Jabatan / Divisi', 'Status Karyawan', 'Hunian', 'Radius'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '15px 28px', color: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredKary.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>
                    {searchKary ? 'Karyawan tidak ditemukan.' : 'Belum ada data karyawan di kantor ini.'}
                  </td></tr>
                ) : filteredKary.map(k => {
                  const nama = k.user?.name || k.nama || '-';
                  const hunianKary = hunianList.find(h => h.karyawan_id === k.id || h.karyawan?.id === k.id);
                  const statusColor = k.status === 'aktif' ? { bg: '#f0fdf4', color: GD, border: '#bbf7d0' } : { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
                  return (
                    <tr key={k.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '18px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: G, fontSize: 16, flexShrink: 0 }}>
                            {nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>{nama}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>ID: {k.no_karyawan || k.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 28px' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{k.jabatan || '-'}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{k.divisi || '-'}</p>
                      </td>
                      <td style={{ padding: '18px 28px' }}>
                        <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px', background: statusColor.bg, color: statusColor.color, border: `1px solid ${statusColor.border}` }}>
                          {k.status || 'aktif'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 28px', fontSize: 13, color: '#475569', fontWeight: 600 }}>
                        {hunianKary?.kost?.nama_kost || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum input</span>}
                      </td>
                      <td style={{ padding: '18px 28px' }}><RadiusBadge km={hunianKary?.jarakKm} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ TAB: HUNIAN ════════════════════════════════════ */}
      {tab === 'hunian' && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Data Hunian</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '6px 0 0', fontWeight: 500 }}>
              Seluruh data hunian karyawan yang terdaftar beserta status verifikasi.
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Karyawan', 'Kost / Kamar', 'Tgl Masuk', 'Jarak', 'Status', 'Verifikasi'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '15px 24px', color: '#94a3b8', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hunianList.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>Belum ada data hunian.</td></tr>
                ) : hunianList.map(h => {
                  const nama = h.karyawan?.user?.name || h.karyawan?.nama || '-';
                  const sc = h.status === 'aktif'
                    ? { bg: '#f0fdf4', color: GD, border: '#bbf7d0' }
                    : h.status === 'selesai'
                      ? { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
                      : { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
                  return (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: G, fontSize: 15 }}>
                            {nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{nama}</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{h.karyawan?.jabatan || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{h.kost?.nama_kost || '-'}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{h.kamar ? `Kamar ${h.kamar.nomor_kamar}` : '-'}</p>
                      </td>
                      <td style={{ padding: '18px 24px', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                        {h.tanggal_masuk ? new Date(h.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ padding: '18px 24px' }}><RadiusBadge km={h.jarakKm} /></td>
                      <td style={{ padding: '18px 24px' }}>
                        <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {h.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        {h.is_verified
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: GD, fontSize: 13, fontWeight: 800 }}><CheckCircle size={14} strokeWidth={3}/> Terverifikasi</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: 13, fontWeight: 800 }}><Clock size={14} strokeWidth={3}/> Tertunda</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default HRDashboard;
