import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Home, 
  BarChart3, 
  TrendingUp,
  UserCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalKantor: 0,
    totalHR: 0,
    totalOwner: 0,
    pendingKost: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setTimeout(() => {
        setStats({
          totalKantor: 8,
          totalHR: 12,
          totalOwner: 45,
          pendingKost: 3,
          revenue: 'Rp 124.500.000',
          growth: '+12.5%',
          recentBookings: [
            { id: 1, user: 'Audry Noers', kost: 'Bunk House Bogor', status: 'Pending', time: '2 jam lalu' },
            { id: 2, user: 'Dinda Jelita', kost: 'Kost Melania', status: 'Verified', time: '5 jam lalu' },
            { id: 3, user: 'Rahmat Hidayat', kost: 'Griya Asri 2', status: 'Canceled', time: 'Yesterday' },
          ]
        });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Menyiapkan Dashboard Admin...</p>
      </div>
    );
  }

  return (
    <div className="admin-content-inner">
      <div className="content-header">
        <div className="header-text">
          <h2>Ringkasan Eksekutif</h2>
          <p>Pantau performa dan kesehatan sistem MyKost secara real-time.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
             Unduh Laporan
          </button>
          <button className="btn-primary">
            <Plus size={18} /> Tambah Properti
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-main">
            <div className="stat-info">
              <span className="stat-label">Total Kantor</span>
              <p className="stat-value">{stats.totalKantor}</p>
            </div>
            <div className="stat-icon blue"><Building2 size={24} /></div>
          </div>
          <div className="stat-footer positive">
            <TrendingUp size={14} /> <span>{stats.growth}</span> <span className="footer-desc">vs bulan lalu</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-main">
            <div className="stat-info">
              <span className="stat-label">Akun Aktif</span>
              <p className="stat-value">{stats.totalHR + stats.totalOwner}</p>
            </div>
            <div className="stat-icon purple"><Users size={24} /></div>
          </div>
          <div className="stat-footer positive">
            <UserCheck size={14} /> <span>12 Baru</span> <span className="footer-desc">minggu ini</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-main">
            <div className="stat-info">
              <span className="stat-label">Verifikasi Pending</span>
              <p className="stat-value">{stats.pendingKost}</p>
            </div>
            <div className="stat-icon orange"><Home size={24} /></div>
          </div>
          <div className="stat-footer warning">
            <span className="footer-dot"></span> <span>Membutuhkan tindakan</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-main">
            <div className="stat-info">
              <span className="stat-label">Estimasi Revenue</span>
              <p className="stat-value">{stats.revenue}</p>
            </div>
            <div className="stat-icon green"><BarChart3 size={24} /></div>
          </div>
          <div className="stat-footer positive">
            <TrendingUp size={14} /> <span>+5.2%</span> <span className="footer-desc">pertumbuhan</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="content-card table-card">
          <div className="card-header">
            <h3 className="card-title">Aktivitas Booking Terbaru</h3>
            <button className="btn-link">Lihat Semua</button>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Penyewa</th>
                  <th>Properti</th>
                  <th>Status</th>
                  <th>Waktu</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">{booking.user.charAt(0)}</div>
                        <span>{booking.user}</span>
                      </div>
                    </td>
                    <td>{booking.kost}</td>
                    <td>
                      <span className={`badge ${booking.status.toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="text-muted">{booking.time}</td>
                    <td className="text-right">
                      <button className="btn-action">Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="side-column">
          <div className="content-card stats-mini-card">
            <div className="card-header">
              <h3 className="card-title">Distribusi Pengguna</h3>
            </div>
            <div className="user-types">
              <div className="type-item">
                <div className="type-info">
                  <span className="dot hr"></span>
                  <span className="type-label">Admin HR</span>
                </div>
                <span className="count">{stats.totalHR}</span>
              </div>
              <div className="type-item">
                <div className="type-info">
                  <span className="dot owner"></span>
                  <span className="type-label">Pemilik Kost</span>
                </div>
                <span className="count">{stats.totalOwner}</span>
              </div>
            </div>
          </div>

          <div className="content-card health-card">
            <div className="card-header">
              <h3 className="card-title">Kesehatan Infrastruktur</h3>
            </div>
            <div className="system-health">
              <div className="health-stat">
                <span>Server Uptime</span>
                <span className="status-good">Terjaga</span>
              </div>
              <div className="progress-bar">
                <div className="progress" style={{width: '99.9%'}}></div>
              </div>
              <p className="uptime">Aktivitas normal: 99.9% availability</p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-content-inner { max-width: 1400px; margin: 0 auto; }
        
        .content-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
        .header-text h2 { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; margin-bottom: 8px; }
        .header-text p { color: #64748b; font-size: 15px; font-weight: 500; }
        
        .header-actions { display: flex; gap: 12px; }
        .btn-primary { background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .btn-primary:hover { background: #059669; transform: translateY(-2px); }
        .btn-secondary { background: white; color: #1e293b; border: 1px solid #e2e8f0; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }
        .stat-card { background: white; padding: 28px; border-radius: 20px; border: 1px solid rgba(226, 232, 240, 0.6); box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); }
        
        .stat-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .stat-label { color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 32px; font-weight: 800; color: #1e293b; margin-top: 4px; }
        
        .stat-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .stat-icon.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
        .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }

        .stat-footer { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
        .stat-footer.positive { color: #10b981; }
        .stat-footer.warning { color: #f97316; }
        .footer-desc { color: #94a3b8; font-weight: 500; }
        .footer-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }

        .dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 32px; }
        .content-card { background: white; border-radius: 24px; padding: 32px; border: 1px solid rgba(226, 232, 240, 0.6); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
        .card-title { font-weight: 800; font-size: 18px; color: #1e293b; letter-spacing: -0.3px; }

        .table-responsive { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 16px; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; letter-spacing: 0.5px; }
        .admin-table td { padding: 20px 16px; font-size: 14px; font-weight: 500; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .admin-table tr:hover { background: #f8fafc; }
        
        .user-cell { display: flex; align-items: center; gap: 12px; font-weight: 600; }
        .user-avatar-small { width: 32px; height: 32px; border-radius: 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #475569; font-weight: 800; }
        
        .badge { padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
        .badge.pending { background: #fff7ed; color: #c2410c; }
        .badge.verified { background: #ecfdf5; color: #065f46; }
        .badge.canceled { background: #fef2f2; color: #991b1b; }

        .btn-link { color: #3b82f6; background: none; border: none; font-weight: 700; font-size: 14px; cursor: pointer; }
        .btn-link:hover { text-decoration: underline; }
        .btn-action { background: #f1f5f9; color: #475569; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-action:hover { background: #e2e8f0; color: #1e293b; }

        .side-column { display: flex; flex-direction: column; gap: 32px; }
        .type-item { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
        .type-info { display: flex; align-items: center; gap: 12px; }
        .type-label { font-size: 14px; font-weight: 600; color: #475569; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.hr { background: #8b5cf6; }
        .dot.owner { background: #3b82f6; }
        .count { font-weight: 800; color: #1e293b; font-size: 15px; }

        .health-stat { display: flex; justify-content: space-between; margin-bottom: 16px; font-weight: 700; color: #1e293b; }
        .status-good { color: #10b981; display: flex; align-items: center; gap: 6px; }
        .status-good::before { content: ''; width: 8px; height: 8px; background: currentColor; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
        
        .progress-bar { height: 10px; background: #f1f5f9; border-radius: 6px; margin: 12px 0; overflow: hidden; }
        .progress { height: 100%; background: linear-gradient(90deg, #10b981 0%, #34d399 100%); }
        .uptime { font-size: 13px; color: #64748b; font-weight: 500; }

        .text-muted { color: #94a3b8; }
        .text-right { text-align: right; }

        .admin-loading { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spinner { width: 48px; height: 48px; border: 5px solid #e2e8f0; border-top: 5px solid #10b981; border-radius: 50%; animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; margin-bottom: 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default AdminDashboard;
