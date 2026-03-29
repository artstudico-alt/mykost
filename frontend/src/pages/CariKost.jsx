import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, SlidersHorizontal, Navigation, Star, Wifi, Car, Shield, Building2 } from 'lucide-react';
import api from '../utils/api';
import './CariKost.css';

// Fix for default marker icons in Leaflet with Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically update map center
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function CariKost() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Default Center: Kedung Waringin, Kota Bogor, Jawa Barat (CQPJ+GC)
  const defaultLocation = { lat: -6.5637499, lng: 106.7810624 };
  
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    search: '',
    latitude: '',
    longitude: '',
    radius_km: 5,
    harga_min: '',
    harga_max: '',
  });

  const [mapCenter, setMapCenter] = useState([defaultLocation.lat, defaultLocation.lng]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const lat = params.get('lat');
    const lng = params.get('lng');
    
    setSearchParams(prev => ({
      ...prev,
      search: q || '',
      latitude: lat || '',
      longitude: lng || '',
    }));

    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
    }
  }, [location.search]);

  useEffect(() => {
    fetchKosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.latitude, searchParams.longitude, searchParams.radius_km]);

  const fetchKosts = async () => {
    setLoading(true);
    try {
      const payload = { ...searchParams };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null) {
          delete payload[key];
        }
      });

      const response = await api.get('/search/kost', { params: payload });
      setKosts(response.data.data || []);
      
      if (response.data.center?.latitude && response.data.center?.longitude) {
         setMapCenter([response.data.center.latitude, response.data.center.longitude]);
      }
    } catch (error) {
      console.error('Error fetching kosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchKosts();
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSearchParams(prev => ({
          ...prev,
          latitude,
          longitude,
          search: 'Lokasi Saya'
        }));
        setMapCenter([latitude, longitude]);
      },
      (error) => {
        alert("Gagal mendapatkan lokasi: " + error.message);
      }
    );
  };

  return (
    <div className="search-page">
      
      {/* HEADER */}
      <header className="search-header">
        <div className="search-brand" onClick={() => navigate('/')}>
          <div className="search-brand-icon">
            <MapPin size={24} />
          </div>
          <span className="search-brand-text">MyKost</span>
        </div>

        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-bar-wrap">
            <div className="search-input-group">
              <Search className="search-input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Cari nama kost atau area..." 
                className="search-input"
                value={searchParams.search}
                onChange={(e) => setSearchParams({...searchParams, search: e.target.value})}
              />
            </div>
            <button type="button" onClick={getUserLocation} className="search-location-btn">
              <Navigation size={18} /> Sekitar Saya
            </button>
            <button type="submit" className="search-submit-btn" aria-label="Cari">
              <Search size={20} />
            </button>
          </div>
        </form>

        <div className="search-header-actions">
          <button className="search-header-btn" onClick={() => navigate('/owner/kost')}>Sewakan Kost</button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="search-filter-bar">
        <button className="filter-btn">
          <SlidersHorizontal size={18} /> Filter
        </button>
        
        <select 
          className="filter-select"
          value={searchParams.radius_km}
          onChange={(e) => setSearchParams({...searchParams, radius_km: e.target.value})}
        >
          <option value="1">Radius: 1 km</option>
          <option value="3">Radius: 3 km</option>
          <option value="5">Radius: 5 km</option>
          <option value="10">Radius: 10 km</option>
        </select>

        <div className="filter-divider"></div>
        
        <span className="filter-stats">{kosts.length} kost ditemukan</span>

        {/* Info titik pusat */}
        <div className="filter-center-badge">
          <Building2 size={16} />
          Titik Pusat: Kantor Kedung Waringin, Bogor
        </div>
      </div>

      {/* MAIN CONTENT SPLIT SCREEN */}
      <div className="search-content">
        
        {/* LEFT PANEL - LIST VIEW */}
        <div className="search-sidebar">
           {loading && (
              <div className="search-loading">
                 <div className="search-spinner"></div>
              </div>
           )}

           <div className="kost-grid">
              {kosts.length === 0 && !loading ? (
                 <div className="kost-empty">
                    <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="Kosong" />
                    <h3>Kost tidak ditemukan</h3>
                    <p>Coba perbesar radius atau geser titik lokasi pencarian Anda untuk melihat lebih banyak pilihan kost yang tersedia.</p>
                 </div>
              ) : (
                kosts.map((kost) => (
                   <div 
                      key={kost.id} 
                      className="kost-card"
                      onClick={() => navigate(`/kost/${kost.id}`)}
                   >
                     {/* Thumbnail */}
                     <div className="kost-card-img-wrap">
                        <img 
                           src={kost.foto_utama || `https://picsum.photos/seed/${kost.id * 10}/600/400`} 
                           alt={kost.nama_kost} 
                           className="kost-card-img"
                        />
                        <div className="kost-card-badges">
                           {kost.tipe === 'putri' && <span className="badge-tipe badge-putri">Putri</span>}
                           {kost.tipe === 'putra' && <span className="badge-tipe badge-putra">Putra</span>}
                           {kost.tipe === 'campur' && <span className="badge-tipe badge-campur">Campur</span>}
                        </div>
                     </div>

                     {/* Details */}
                     <div className="kost-card-body">
                        <div className="kost-card-header">
                           <h3 className="kost-card-title">{kost.nama_kost}</h3>
                           <div className="kost-card-rating">
                              <Star size={14} className="fill-yellow-500 text-yellow-500" /> 4.8
                           </div>
                        </div>

                        <p className="kost-card-address">{kost.alamat}</p>
                        
                        {/* Facilities */}
                        <div className="kost-card-facilities">
                           <span className="facility-item"><Wifi size={16}/> WiFi</span>
                           <span className="facility-item"><Car size={16}/> Parkir</span>
                           <span className="facility-item"><Shield size={16}/> Aman</span>
                        </div>

                        <div className="kost-card-footer">
                           <div className="kost-price-wrap">
                              <div>
                                 <span className="kost-price-label">Mulai dari</span>
                                 <p className="kost-price-amount">
                                    Rp {parseFloat(kost.harga_min || 0).toLocaleString('id-ID')}
                                    <span className="kost-price-period">/bln</span>
                                 </p>
                              </div>
                              {kost.distance_km !== undefined && (
                                 <div className="k-distance-radius">
                                    <Navigation size={14} />
                                    {parseFloat(kost.distance_km).toFixed(1)} km
                                 </div>
                              )}
                           </div>

                           {kost.jarak_dari_referensi !== undefined && (
                              <div className="k-distance-office">
                                 <Building2 size={16} />
                                 <span>{parseFloat(kost.jarak_dari_referensi).toFixed(1)} km dari titik referensi</span>
                              </div>
                           )}
                        </div>
                     </div>
                   </div>
                ))
              )}
           </div>
        </div>

        {/* RIGHT PANEL - MAP VIEW */}
        <div className="search-map-container">
          <MapContainer 
            center={mapCenter} 
            zoom={14} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
            
            <MapUpdater center={mapCenter} />

            {/* Radius Circle */}
            {(searchParams.latitude && searchParams.longitude) && (
               <>
                  <Circle 
                     center={mapCenter} 
                     pathOptions={{ fillColor: '#10b981', fillOpacity: 0.15, color: '#059669', weight: 2, dashArray: '5, 5' }} 
                     radius={searchParams.radius_km * 1000} 
                  />
                  <Marker position={mapCenter}>
                     <Popup>Titik Pusat Pencarian</Popup>
                  </Marker>
               </>
            )}

            {/* Kost Markers */}
            {kosts.map(kost => (
               <Marker key={kost.id} position={[kost.latitude, kost.longitude]}>
                  <Popup>
                     <div className="popup-card">
                        <img src={kost.foto_utama || `https://picsum.photos/seed/${kost.id * 10}/300/200`} alt="k" className="popup-img" />
                        <h4 className="popup-title">{kost.nama_kost}</h4>
                        <p className="popup-price">Rp {parseFloat(kost.harga_min || 0).toLocaleString('id-ID')}</p>
                        {kost.jarak_dari_referensi !== undefined && (
                           <p className="popup-dist"><Building2 size={12}/> {parseFloat(kost.jarak_dari_referensi).toFixed(1)} km dari titik referensi</p>
                        )}
                        <button 
                           onClick={() => navigate(`/kost/${kost.id}`)}
                           className="popup-btn"
                        >
                           Lihat Detail Kost
                        </button>
                     </div>
                  </Popup>
               </Marker>
            ))}

          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="map-overlay-badge">
             <span>
                <div className="map-pulse-dot"></div>
                Area Pencarian Langsung
             </span>
          </div>
        </div>

      </div>
    </div>
  );
}
