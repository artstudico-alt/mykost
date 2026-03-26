import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, SlidersHorizontal, Navigation, Star, Wifi, Car, Shield, Building2 } from 'lucide-react';
import api from '../utils/api';

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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 h-20 px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <MapPin color="white" size={24} />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tight">MyKost</span>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-3xl mx-10">
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-full px-2 py-2 shadow-inner transition-all focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
            <div className="flex-1 px-4 border-r border-gray-300 flex items-center gap-3">
              <Search className="text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Cari nama kost atau area..." 
                className="w-full bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700"
                value={searchParams.search}
                onChange={(e) => setSearchParams({...searchParams, search: e.target.value})}
              />
            </div>
            <div className="px-4 flex items-center gap-3">
               <button type="button" onClick={getUserLocation} className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-green-50 transition w-max">
                  <Navigation size={16} /> Sekitar Saya
               </button>
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors shadow-md">
              <Search size={18} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4">
          <button className="text-gray-600 font-semibold px-4 py-2 hover:bg-gray-100 rounded-lg hidden md:block">Sewakan Kost</button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="bg-white border-b border-gray-200 h-14 px-8 flex items-center gap-4 shadow-sm z-10 shrink-0 text-sm">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full font-medium hover:border-gray-400 transition">
          <SlidersHorizontal size={16} /> Filter
        </button>
        
        <select 
          className="px-4 py-2 border border-gray-300 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white cursor-pointer"
          value={searchParams.radius_km}
          onChange={(e) => setSearchParams({...searchParams, radius_km: e.target.value})}
        >
          <option value="1">Radius: 1 km</option>
          <option value="3">Radius: 3 km</option>
          <option value="5">Radius: 5 km</option>
          <option value="10">Radius: 10 km</option>
        </select>

        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        
        <span className="text-gray-500 font-medium">{kosts.length} kost ditemukan</span>

        {/* Info titik pusat */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-full">
          <Building2 size={13} />
          Titik Pusat: Kantor Kedung Waringin, Bogor
        </div>
      </div>

      {/* MAIN CONTENT SPLIT SCREEN */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANEL - LIST VIEW */}
        <div className="w-full lg:w-[55%] xl:w-[60%] h-full overflow-y-auto p-6 md:p-8 relative">
           {loading && (
              <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                 <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
              </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {kosts.length === 0 && !loading ? (
                 <div className="col-span-full py-20 text-center">
                    <img src="/hero-kost-illustration.png" alt="Kosong" className="w-64 h-auto mx-auto opacity-50 mb-6" />
                    <h3 className="text-xl font-bold text-gray-800">Kost tidak ditemukan</h3>
                    <p className="text-gray-500 mt-2">Coba perbesar radius atau geser titik lokasi pencarian Anda.</p>
                 </div>
              ) : (
                kosts.map((kost) => (
                   <div 
                      key={kost.id} 
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-transparent transition-all duration-300 cursor-pointer flex flex-col h-full"
                      onClick={() => navigate(`/kost/${kost.id}`)}
                   >
                     {/* Thumbnail */}
                     <div className="relative h-48 w-full overflow-hidden">
                        <img 
                           src={kost.foto_utama || `https://picsum.photos/seed/${kost.id * 10}/600/400`} 
                           alt={kost.nama_kost} 
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                           {kost.tipe === 'putri' && <span className="bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">Putri</span>}
                           {kost.tipe === 'putra' && <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">Putra</span>}
                           {kost.tipe === 'campur' && <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">Campur</span>}
                        </div>
                     </div>

                     {/* Details */}
                     <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2 gap-2">
                           <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-green-600 transition-colors line-clamp-1">{kost.nama_kost}</h3>
                           <div className="flex items-center gap-1 text-sm font-bold text-gray-700 bg-yellow-50 px-2 py-0.5 rounded-lg shrink-0">
                              <Star className="text-yellow-400 fill-yellow-400" size={14} /> 4.8
                           </div>
                        </div>

                        <p className="text-gray-500 text-sm mb-4 line-clamp-1">{kost.alamat}</p>
                        
                        {/* Facilities */}
                        <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                           <span className="flex items-center gap-1.5"><Wifi size={16}/> WiFi</span>
                           <span className="flex items-center gap-1.5"><Car size={16}/> Parkir</span>
                           <span className="flex items-center gap-1.5"><Shield size={16}/> Aman</span>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                           {/* Harga + badge jarak dari radius pencarian */}
                           <div className="flex items-end justify-between">
                              <div>
                                 <p className="text-xs text-gray-500 font-medium mb-1">Mulai dari</p>
                                 <p className="font-black text-lg text-gray-900">
                                    Rp {parseFloat(kost.harga_min || 0).toLocaleString('id-ID')}
                                    <span className="text-sm font-medium text-gray-500">/bln</span>
                                 </p>
                              </div>
                              {kost.distance_km !== undefined && (
                                 <div className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0">
                                    <Navigation size={12} className="shrink-0" />
                                    {parseFloat(kost.distance_km).toFixed(1)} km dari pencarian
                                 </div>
                              )}
                           </div>

                           {/* Badge jarak dari kantor pusat — SELALU MUNCUL */}
                           {kost.jarak_dari_kantor !== undefined && (
                              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-lg w-full">
                                 <Building2 size={13} className="shrink-0" />
                                 <span>{parseFloat(kost.jarak_dari_kantor).toFixed(1)} km dari Kantor Pusat (Kedung Waringin, Bogor)</span>
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
        <div className="hidden lg:block w-[45%] xl:w-[40%] h-full relative border-l border-gray-200">
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
                     pathOptions={{ fillColor: '#22c55e', fillOpacity: 0.1, color: '#16a34a', weight: 2, dashArray: '5, 5' }} 
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
                     <div className="text-center p-1 w-48">
                        <img src={kost.foto_utama || `https://picsum.photos/seed/${kost.id * 10}/300/200`} alt="t" className="w-full h-24 object-cover rounded-lg mb-2" />
                        <h4 className="font-bold text-sm mb-1">{kost.nama_kost}</h4>
                        <p className="text-green-600 font-bold mb-1">Rp {parseFloat(kost.harga_min || 0).toLocaleString('id-ID')}</p>
                        {kost.jarak_dari_kantor !== undefined && (
                           <p className="text-blue-600 text-xs font-semibold mb-2">{parseFloat(kost.jarak_dari_kantor).toFixed(1)} km dari kantor</p>
                        )}
                        <button 
                           onClick={() => navigate(`/kost/${kost.id}`)}
                           className="w-full bg-green-600 text-white text-xs font-bold py-1.5 rounded hover:bg-green-700"
                        >
                           Lihat Detail
                        </button>
                     </div>
                  </Popup>
               </Marker>
            ))}

          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50 pointer-events-none">
             <p className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Area Pencarian Langsung
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
