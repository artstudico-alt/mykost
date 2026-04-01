import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Home,
  CheckSquare,
  BarChart3,
  LogOut,
  Bell,
  MapPin,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Check,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const role = user?.role?.name || '';
  const isHR = role === 'hr';
  const isOwner = role === 'pemilik_kost';

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await api.get('/notifikasi');
      setNotifications(res.data?.data || []);
      setNotifCount(res.data?.unread_count || 0);
    } catch (e) {
      console.error('Gagal ambil notifikasi:', e);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll setiap 30 detik
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifikasi/${id}/read`);
      fetchNotifications();
    } catch (e) {
      console.error('Gagal mark as read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifikasi/read-all');
      fetchNotifications();
    } catch (e) {
      console.error('Gagal mark all read:', e);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifikasi/${id}`);
      fetchNotifications();
    } catch (e) {
      console.error('Gagal hapus notifikasi:', e);
    }
  };

  const getNotifIcon = (tipe) => {
    switch (tipe) {
      case 'success': return <CheckCircle2 size={16} color="#10b981" />;
      case 'warning': return <AlertTriangle size={16} color="#f59e0b" />;
      case 'error': return <XCircle size={16} color="#ef4444" />;
      default: return <Info size={16} color="#3b82f6" />;
    }
  };

  const getNotifBg = (tipe) => {
    switch (tipe) {
      case 'success': return '#ecfdf5';
      case 'warning': return '#fffbeb';
      case 'error': return '#fef2f2';
      default: return '#eff6ff';
    }
  };

  const getBranding = () => {
    if (isHR) return { title: 'HR Portal', sub: 'Employee Mgmt', color: '#22c55e' };
    if (isOwner) return { title: 'Owner Portal', sub: 'Property Mgmt', color: '#22c55e' };
    return { title: 'MyKost', sub: 'Admin Panel', color: '#22c55e' };
  };

  const brand = getBranding();

  const getMenuItems = () => {
    const allItems = [
      // Admin
      { id: 'dashboard_admin', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
      { id: 'kost_admin', label: 'Moderasi Kost', path: '/admin/kost', icon: Home, roles: ['super_admin', 'admin'] },
      { id: 'karyawan_admin', label: 'Data Karyawan', path: '/admin/karyawan', icon: Users, roles: ['super_admin', 'admin'] },
      { id: 'tracking_admin', label: 'Tracking Hunian', path: '/admin/tracking', icon: MapPin, roles: ['super_admin', 'admin'] },
      { id: 'pembayaran_admin', label: 'Pembayaran', path: '/admin/pembayaran', icon: CheckSquare, roles: ['super_admin', 'admin'] },
      { id: 'keluhan_admin', label: 'Keluhan', path: '/admin/keluhan', icon: MessageSquare, roles: ['super_admin', 'admin'] },
      { id: 'laporan_admin', label: 'Laporan', path: '/admin/laporan', icon: BarChart3, roles: ['super_admin', 'admin'] },
      // HR — dedicated paths
      { id: 'dashboard_hr', label: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard, roles: ['hr'] },
      { id: 'karyawan_hr', label: 'Data Karyawan', path: '/hr/karyawan', icon: Users, roles: ['hr'] },
      { id: 'tracking_hr', label: 'Tracking Hunian', path: '/hr/tracking', icon: MapPin, roles: ['hr'] },
      { id: 'laporan_hr', label: 'Laporan', path: '/hr/laporan', icon: BarChart3, roles: ['hr'] },
      // Owner
      { id: 'dashboard_owner', label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard, roles: ['pemilik_kost'] },
      { id: 'kost_owner', label: 'Kost Saya', path: '/owner/kost', icon: Home, roles: ['pemilik_kost'] },
      { id: 'pembayaran_owner', label: 'Pembayaran', path: '/owner/pembayaran', icon: CheckSquare, roles: ['pemilik_kost'] },
      { id: 'keluhan_owner', label: 'Keluhan', path: '/owner/keluhan', icon: MessageSquare, roles: ['pemilik_kost'] },
    ];
    return allItems.filter(item => item.roles.includes(role));
  };

  const menuItems = getMenuItems();
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A';
  const currentMenu = menuItems.find(m => location.pathname === m.path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* ─── Sidebar ─── */}
      <aside style={{
        width: sidebarOpen ? 260 : 80,
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100,
        borderRight: '1px solid #f1f5f9',
        boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        overflowX: 'hidden'
      }}>
        {/* Brand */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${brand.color}, #16a34a)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 16px ${brand.color}33`,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="22" height="22">
              <path d="M3 12l2-2 7-7 7 7 2 2" />
              <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <p style={{ color: '#0f172a', fontWeight: 900, fontSize: 19, margin: 0, letterSpacing: '-0.8px' }}>{brand.title}</p>
              <p style={{ color: '#94a3b8', fontSize: 10, margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{brand.sub}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderRadius: 14, textDecoration: 'none',
                  fontWeight: active ? 800 : 600, fontSize: 14, transition: 'all 0.2s',
                  background: active ? brand.color : 'transparent',
                  color: active ? 'white' : '#64748b',
                  boxShadow: active ? `0 10px 15px -3px ${brand.color}33` : 'none',
                  transform: active ? 'scale(1.02)' : 'none'
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: 'none', background: 'transparent', color: '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <LogOut size={20} />
            {sidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div style={{ marginLeft: sidebarOpen ? 260 : 80, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        
        {/* Header */}
        <header style={{
          height: 80, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}>
              <Menu size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{currentMenu?.label || 'Beranda'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Portal</span>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                <span style={{ fontSize: 12, color: brand.color, fontWeight: 700 }}>{currentMenu?.label || 'Dashboard'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Notification Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setNotifOpen(!notifOpen)} 
                style={{ width: 44, height: 44, borderRadius: 14, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', position: 'relative', background: 'white', transition: 'all 0.2s' }}>
                <Bell size={20} />
                {notifCount > 0 && (
                  <span style={{ position: 'absolute', top: 8, right: 8, minWidth: 18, height: 18, background: '#ef4444', border: '2px solid white', borderRadius: '50%', fontSize: 10, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 380,
                  maxHeight: 500,
                  background: 'white',
                  borderRadius: 16,
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Notifikasi</h3>
                    {notifCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        style={{ fontSize: 12, fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {notifLoading ? (
                      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat...</div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                        <Bell size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p style={{ margin: 0, fontSize: 14 }}>Tidak ada notifikasi</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => n.link && (window.location.hash = n.link)}
                          style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #f8fafc',
                            display: 'flex',
                            gap: 12,
                            cursor: n.link ? 'pointer' : 'default',
                            background: n.is_read ? 'white' : '#f8fafc',
                            opacity: n.is_read ? 0.7 : 1,
                          }}>
                          <div style={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 10, 
                            background: getNotifBg(n.tipe),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {getNotifIcon(n.tipe)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: n.is_read ? 600 : 700, color: '#0f172a' }}>{n.judul}</p>
                            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{n.pesan}</p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                {new Date(n.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                              </span>
                              {!n.is_read && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                  style={{ fontSize: 11, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                  <Check size={12} style={{ display: 'inline', marginRight: 2 }} /> Baca
                                </button>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                                style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '6px 6px 6px 14px', borderRadius: 18, background: '#f8fafc', border: '1px solid #f1f5f9' }} onClick={() => setProfileOpen(!profileOpen)}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.2px' }}>{role.replace('_', ' ')}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: brand.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, boxShadow: `0 4px 12px ${brand.color}44` }}>
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px', background: '#fcfdfe' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};


export default AdminLayout;
